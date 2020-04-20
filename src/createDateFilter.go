// COPYRIGHT_BEGIN
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

// createLogTimestampQuery will create a Cassandra query that returns all entries
// that are equal to "createDate". If "createDate" is zero, then all entries in the
// table will be returned.
func createLogTimestampQuery(createDate time.Time) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, create_date FROM \"LogTimestamp\"")
	if !createDate.IsZero() {
		createDateStr := createDate.Format(time.RFC3339)
		parts = append(parts, " Where create_date = '")
		parts = append(parts, createDateStr+"'")
	}

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func createLogTimestampQueryForUUID(uuid gocql.UUID) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, create_date FROM \"LogTimestamp\"")
	parts = append(parts, " WHERE time_id = ")
	parts = append(parts, uuid.String())

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func filterContainsCreateDateOnly(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName == "") && (filter.Owner == "") && (filter.SizeLower < 0) && (filter.SizeUpper < 0) &&
		(!filter.CreateDateLower.IsZero()) && (!filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func processCreateDateQuery(session *gocql.Session, filter *LogFilter) ([]LogEntry, error) {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process create_date query:", err, ".")
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

	// Retrieve values for owner meta-data.
	query, _ := createLogTimestampQuery(filter.CreateDateLower)
	log.Println("[LOGSERVER-Info] query:", query)

	iter := session.Query(query).Iter()
	for iter.Scan(&id, &createDate) {
		// Populate the return value.
		var entry LogEntry
		entry.TimeID = id
		entry.CreateDate = createDate

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
	}

	return values, nil
}
