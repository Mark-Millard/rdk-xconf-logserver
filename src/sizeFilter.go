// COPYRIGHT_BEGIN
// COPYRIGHT_END

// Declare package.
package main

// Declare imported packages.
import (
	"errors"
	"log"
	"strconv"
	"time"

	"github.com/gocql/gocql"
)

// createLogSizeQuery will create a Cassandra query that returns all entries
// that are equal to "size". If "size" < 0, then all entries in the table
// will be returned.
func createLogSizeQuery(size int64) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, size FROM \"LogSize\"")
	if size >= 0 {
		var fileSize string = strconv.FormatInt(size, 10)
		parts = append(parts, " WHERE size = ")
		parts = append(parts, fileSize)
	}

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func createLogSizeRangeQuery(lowerBound int64, upperBound int64) (string, error) {
	var query string
	var parts []string
	var lowerSpecified bool = false

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, size FROM \"LogSize\"")
	if lowerBound >= 0 {
		var lower string = strconv.FormatInt(lowerBound, 10)
		parts = append(parts, " WHERE size >= ")
		parts = append(parts, lower)
		lowerSpecified = true
	}
	if upperBound >= 0 {
		var upper string = strconv.FormatInt(upperBound, 10)
		if lowerSpecified {
			parts = append(parts, " AND size <= ")
			parts = append(parts, upper)
		} else {
			parts = append(parts, " WHERE size <= ")
			parts = append(parts, upper)
		}
	}

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func createLogSizeQueryForUUID(uuid gocql.UUID) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, size FROM \"LogSize\"")
	parts = append(parts, " WHERE time_id = ")
	parts = append(parts, uuid.String())

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func filterContainsSizeOnly(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName == "") && (filter.Owner == "") && (filter.SizeLower >= 0) && (filter.SizeUpper >= 0) &&
		(filter.SizeLower == filter.SizeUpper) && (filter.CreateDateLower.IsZero()) && (filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func filterContainsSizeRangeOnly(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName == "") && (filter.Owner == "") && ((filter.SizeLower >= 0) || (filter.SizeUpper >= 0)) &&
		(filter.CreateDateLower.IsZero()) && (filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func validSizeRange(lowerBound int64, upperBound int64) bool {
	if (lowerBound >= 0) && (upperBound == -1) {
		// Special case: only the lower bound is being specified.
		return true
	}
	if (lowerBound == -1) && (upperBound >= 0) {
		// Special case: only the upper bound is being specified.
		return true
	}
	if (lowerBound < 0) || (upperBound < 0) {
		return false
	}
	if (upperBound < lowerBound) || (lowerBound > upperBound) {
		return false
	}
	return true
}

func processSizeQuery(session *gocql.Session, lowerBound int64, upperBound int64) ([]LogEntry, error) {
	if !validSizeRange(lowerBound, upperBound) {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process size query:", err, ".")
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

	// Retrieve values for size meta-data.
	var query string
	if lowerBound == upperBound {
		query, _ = createLogSizeQuery(lowerBound)
	} else {
		query, _ = createLogSizeRangeQuery(lowerBound, upperBound)
	}
	log.Println("[LOGSERVER-Info] query:", query)

	iter := session.Query(query).Iter()
	for iter.Scan(&id, &fileSize) {
		// Populate the return value.
		var entry LogEntry
		entry.TimeID = id
		entry.Size = fileSize

		values = append(values, entry)
	}
	if err := iter.Close(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return nil, err
	}

	for i, next := range values {
		// Find matching log entry data.
		query, _ = createLogEntryQueryForUUID(next.TimeID)
		log.Println("[LOGSERVER-Info] query:", query)

		iter = session.Query(query).Iter()
		if iter.NumRows() == 0 {
			// No matching uuid was found.
			err := errors.New("currupt LogEntry table")
			return nil, err
		}
		// There should only be one unique size entry found.
		for iter.Scan(&id, &fileName, &contact, &description, &location) {
			values[i].FileName = fileName
			values[i].Contact = contact
			values[i].Description = description
			values[i].Location = location
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
			err := errors.New("currupt LogOwner table")
			return nil, err
		}
		// There should only be one unique size entry found.
		for iter.Scan(&id, &createDate) {
			values[i].CreateDate = createDate
		}
		if err := iter.Close(); err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}
	}

	return values, nil
}
