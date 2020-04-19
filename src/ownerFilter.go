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

// createLogOwnerQuery will create a Cassandra query that returns all entries
// that are equal to "owner". If "owner" == "", then all entries in the
// table will be returned.
func createLogOwnerQuery(owner string) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, owner FROM \"LogOwner\"")
	if owner != "" {
		parts = append(parts, " WHERE owner = '")
		parts = append(parts, owner+"'")
	}

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func createLogOwnerQueryForUUID(uuid gocql.UUID) (string, error) {
	var query string
	var parts []string

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, owner FROM \"LogOwner\"")
	parts = append(parts, " WHERE time_id = ")
	parts = append(parts, uuid.String())

	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}

func filterContainsOwnerOnly(filter *LogEntry) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log entry:", err, ".")
		return false
	}

	if (filter.FileName == "") && (filter.Owner != "") && (filter.Size < 0) && (filter.CreateDate.IsZero()) {
		return true
	}

	return false
}

func processOwnerQuery(session *gocql.Session, filter *LogEntry) ([]LogEntry, error) {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to process owner query:", err, ".")
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
	query, _ := createLogOwnerQuery(filter.Owner)
	log.Println("[LOGSERVER-Info] query:", query)

	iter := session.Query(query).Iter()
	for iter.Scan(&id, &owner) {
		// Populate the return value.
		var entry LogEntry
		entry.TimeID = id
		entry.Owner = owner

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
		if err := iter.Close(); err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}
	}

	return values, nil
}
