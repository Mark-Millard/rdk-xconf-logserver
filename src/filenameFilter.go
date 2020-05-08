// COPYRIGHT_BEGIN
// Copyright 2020 Alticast Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// COPYRIGHT_END

// Declare package.
package main

// Declare imported packages.
import (
	"errors"
	"log"
	"time"

	"github.com/gocql/gocql"
)

func createLogEntryQuery(filter *LogFilter) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, file_name, contact, description, location FROM \"LogEntry\"")
	if filter.FileName != "" {
		parts = append(parts, " WHERE file_name = '")
		parts = append(parts, filter.FileName+"'")
	}

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func createLogEntryQueryForUUID(uuid gocql.UUID) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, file_name, contact, description, location FROM \"LogEntry\"")
	parts = append(parts, " WHERE time_id = ")
	parts = append(parts, uuid.String())

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func filterContainsFilenameOnly(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName != "") && (filter.Owner == "") && (filter.SizeLower < 0) && (filter.SizeUpper < 0) &&
		(filter.CreateDateLower.IsZero()) && (filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func processLogEntryQuery(session *gocql.Session, filter *LogFilter) ([]LogEntry, error) {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process log entry query:", err, ".")
		return nil, err
	}

	// Retrieve a log entry.
	var values []LogEntry
	var id gocql.UUID
	var fileName string
	var fileSize int64
	var owner string
	var contact string
	var description string
	var location string
	var createDate time.Time

	// Retrieve values for core meta-data.
	query, _ := createLogEntryQuery(filter)
	log.Println("[LOGSERVER-Info] query:", query)

	iter := session.Query(query).Iter()
	for iter.Scan(&id, &fileName, &contact, &description, &location) {
		// Populate the return value.
		var entry LogEntry
		entry.TimeID = id
		entry.FileName = fileName
		entry.Contact = contact
		entry.Description = description
		entry.Location = location

		values = append(values, entry)
	}
	if err := iter.Close(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return nil, err
	}

	for i, next := range values {
		// Find matching size data.
		query, _ = createLogSizeQueryForUUID(next.TimeID)
		log.Println("[LOGSERVER-Info] query:", query)

		iter = session.Query(query).Iter()
		if iter.NumRows() == 0 {
			// No matching uuid was found.
			err := errors.New("currupt LogSize table")
			return nil, err
		}
		// There should only be one unique size entry found.
		for iter.Scan(&id, &fileSize) {
			values[i].Size = fileSize
		}
		if err := iter.Close(); err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}

		// Find matching owner data.
		query, _ = createLogOwnerQueryForUUID(next.TimeID)
		log.Println("[LOGSERVER-Info] query:", query)

		iter = session.Query(query).Iter()
		if iter.NumRows() == 0 {
			// No matching uuid was found.
			err := errors.New("currupt LogOwner table")
			return nil, err
		}
		// There should only be one unique size entry found.
		for iter.Scan(&id, &owner) {
			values[i].Owner = owner
		}
		if err := iter.Close(); err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}

		// Find matching create_date data.
		query, _ = createLogTimestampQueryForUUID(next.TimeID)
		log.Println("[LOGSERVER-Info] query:", query)

		iter = session.Query(query).Iter()
		if iter.NumRows() == 0 {
			// No matching uuid was found.
			err := errors.New("currupt LogTimestamp table")
			return nil, err
		}
		// There should only be one unique size entry found.
		for iter.Scan(&id, &createDate) {
			values[i].CreateDate = createDate
		}
	}

	return values, nil
}

func filterContainsFilenameAndSizeRange(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName != "") && (filter.Owner == "") && ((filter.SizeLower >= 0) || (filter.SizeUpper >= 0)) &&
		(filter.CreateDateLower.IsZero()) && (filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func processFilenameAndSizeQuery(session *gocql.Session, filter *LogFilter) ([]LogEntry, error) {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if filter.FileName == "" {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if !validSizeRange(filter.SizeLower, filter.SizeUpper) {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}

	// Retrieve log entries for file name.
	var values []LogEntry
	var err error
	values, err = processLogEntryQuery(session, filter)
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}

	// Prune entries for mismatched size range.
	var tmpValues []LogEntry
	for _, next := range values {
		size := next.Size
		if (filter.SizeLower > size) || (filter.SizeUpper < size) {
			// Size out of range, skip entry.
		} else {
			tmpValues = append(tmpValues, next)
		}
	}
	values = tmpValues

	return values, nil
}

func filterContainsFilenameAndDateRange(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName != "") && (filter.Owner == "") && (filter.SizeLower < 0) && (filter.SizeUpper < 0) &&
		((!filter.CreateDateLower.IsZero()) || (!filter.CreateDateUpper.IsZero())) {
		return true
	}

	return false
}

func processFilenameAndCreateDateQuery(session *gocql.Session, filter *LogFilter) ([]LogEntry, error) {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if filter.FileName == "" {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if !validDateRange(filter.CreateDateLower, filter.CreateDateUpper) {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}

	// Retrieve log entries for file_name.
	var values []LogEntry
	var err error
	values, err = processLogEntryQuery(session, filter)
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}

	// Prune entries for mismatched date range.
	var tmpValues []LogEntry
	for _, next := range values {
		date := next.CreateDate
		if (filter.CreateDateLower.Before(date)) || (filter.CreateDateUpper.After(date)) {
			// Date timestamp out of range, skip entry.
		} else {
			tmpValues = append(tmpValues, next)
		}
	}
	values = tmpValues

	return values, nil
}

func filterContainsFilenameAndSizeRangeAndDateRange(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName != "") && (filter.Owner == "") && ((filter.SizeLower >= 0) || (filter.SizeUpper >= 0)) &&
		((!filter.CreateDateLower.IsZero()) || (!filter.CreateDateUpper.IsZero())) {
		return true
	}

	return false
}

func processFilenameAndSizeAndCreateDateQuery(session *gocql.Session, filter *LogFilter) ([]LogEntry, error) {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if filter.FileName == "" {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if !validSizeRange(filter.SizeLower, filter.SizeUpper) {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}
	if !validDateRange(filter.CreateDateLower, filter.CreateDateUpper) {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}

	// Retrieve log entries for file_name.
	var values []LogEntry
	var err error
	values, err = processLogEntryQuery(session, filter)
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to process Cassandra query:", err, ".")
		return nil, err
	}

	// Prune entries for mismatched date range.
	var tmpValues []LogEntry
	for _, next := range values {
		date := next.CreateDate
		size := next.Size
		if (filter.CreateDateLower.Before(date)) || (filter.CreateDateUpper.After(date)) ||
			(filter.SizeLower > size) || (filter.SizeUpper < size) {
			// Size or date timestamp out of range, skip entry.
		} else {
			tmpValues = append(tmpValues, next)
		}
	}
	values = tmpValues

	return values, nil
}
