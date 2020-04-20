// COPYRIGHT_BEGIN
// COPYRIGHT_END

// Declare package.
package main

// Declare imported packages.
import (
	"errors"
	"log"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gocql/gocql"
)

// Declare global variables.
var gSession *gocql.Session = nil

// LogEntry provides information for a log asset,
// one that is being uploaded/downloaded to/from the log server.
type LogEntry struct {
	TimeID      gocql.UUID `json:"timeID"`      // A unique identifier based on a timestamp.
	FileName    string     `json:"fileName"`    // The name of the file.
	Location    string     `json:"location"`    // The location of the file (i.e. URL).
	Size        int64      `json:"size"`        // The size of the file (in KB).
	CreateDate  time.Time  `json:"createDate"`  // A date stamp indicating when the file was created.
	Owner       string     `json:"owner"`       // The owner of the file.
	Contact     string     `json:"contact"`     // Contact information for the file owner.
	Description string     `json:"description"` // A textual desciption of the file contents.
}

// LogFilter provides information for filterint Cassandra queries.
type LogFilter struct {
	TimeID          gocql.UUID // The unique identifier based on a timestamp.
	FileName        string     // The name of the file.
	SizeLower       int64      // The lower bound for the size of the file (in KB).
	SizeUpper       int64      // The upper bound for the size of the file (in KB)
	CreateDateLower time.Time  // The lower range date stamp indicating when the file was created.
	CreateDateUpper time.Time  // The lower range date stamp indicating when the file was created.
	Owner           string     // The owner of the file.
}

// Opens a session with the Cassandra cluster.
func openSession(hosts []string) (*gocql.Session, error) {
	// Validate input arguments.
	if len(hosts) == 0 {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to open a cassandra session:", err, ".")
		return nil, err
	}

	// Connect to the cluster.
	cluster := gocql.NewCluster(hosts[0])
	cluster.Keyspace = "LogDataService"
	cluster.Consistency = gocql.Quorum
	session, err := cluster.CreateSession()
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to create a cassandra session:", err, ".")
	}

	return session, err
}

// closeSession will close the specified session.
func closeSession(session *gocql.Session) error {
	// Validate input arguments.
	if session == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to close a cassandra session:", err, ".")
		return err
	}

	session.Close()

	return nil
}

// registerLog will insert the log meta-data to the Cassandra cluster.
func registerLog(session *gocql.Session, entry *LogEntry) error {
	// Validate input arguments.
	if session == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		return err
	}
	if entry == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		return err
	}

	// Insert a log entry.
	var err error
	uuid := gocql.TimeUUID()

	if err = session.Query(`INSERT INTO "LogEntry" (time_id, file_name, location, contact, description) VALUES (?, ?, ?, ?, ?)`,
		uuid, entry.FileName, entry.Location, entry.Contact, entry.Description).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	if err = session.Query(`INSERT INTO "LogOwner" (time_id, owner) VALUES (?, ?)`,
		uuid, entry.Owner).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	if err = session.Query(`INSERT INTO "LogSize" (time_id, size) VALUES (?, ?)`,
		uuid, entry.Size).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	if err = session.Query(`INSERT INTO "LogTimestamp" (time_id, create_date) VALUES (?, ?)`,
		uuid, entry.CreateDate).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	entry.TimeID = uuid

	return err
}

// unregisterLog removes the log meta-data from the Cassandra cluster.
func unregisterLog(session *gocql.Session, entry *LogEntry) error {
	// Validate input arguments.
	if session == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to unregister a log:", err, ".")
		return err
	}
	if entry == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to unregister a log:", err, ".")
		return err
	}

	// Remove a log entry.
	var err error
	if err = session.Query(`DELETE FROM "LogEntry" WHERE time_id = ? AND file_name = ?`,
		entry.TimeID, entry.FileName).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return err
	}
	if err = session.Query(`DELETE FROM "LogOwner" WHERE time_id = ? AND owner = ?`,
		entry.TimeID, entry.Owner).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return err
	}
	if err = session.Query(`DELETE FROM "LogSize" WHERE time_id = ? AND size = ?`,
		entry.TimeID, entry.Size).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return err
	}
	if err = session.Query(`DELETE FROM "LogTimestamp" WHERE time_id = ? AND create_date = ?`,
		entry.TimeID, entry.CreateDate).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return err
	}

	return nil
}

// parseDate parses the specified date stamp and returns it as a Time structure.
func parseDate(dateStr string) (*time.Time, error) {
	var date time.Time
	var str string
	var err error

	// Validate input arguments.
	if dateStr == "" {
		err = errors.New("empty date string")
		return nil, err
	}

	// The string to parse is expected to be in the format "mm-dd-yy-HH-MM"
	// with either "AM" or "PM" following.
	last2 := dateStr[len(dateStr)-2:]
	if last2 == "AM" {
		str = strings.TrimSuffix(dateStr, "AM")
	} else if last2 == "PM" {
		str = strings.TrimSuffix(dateStr, "PM")
	} else {
		err = errors.New("illegal date format")
		log.Println("[LOGSERVER-Error]", err)
		return nil, err
	}

	// Parse out date components.
	parts := strings.Split(str, "-")
	if len(parts) != 5 {
		err = errors.New("illegal date format")
		log.Println("[LOGSERVER-Error]", err)
		return nil, nil
	}
	month := parts[0]
	day := parts[1]
	year := parts[2]
	hour := parts[3]
	minutes := parts[4]

	// Convert date components to integers.
	var yyyy, mm, dd int
	yyyy, err = strconv.Atoi("20" + year)
	if err != nil {
		return nil, err
	}
	mm, err = strconv.Atoi(month)
	if err != nil {
		return nil, err
	}
	dd, err = strconv.Atoi(day)
	if err != nil {
		return nil, err
	}

	// Convert time components to integers (using military time).
	var HH, MM int
	HH, err = strconv.Atoi(hour)
	if err != nil {
		return nil, err
	}
	if last2 == "PM" {
		if HH >= 1 && HH < 12 {
			HH = HH + 12
		}
	} else {
		if HH == 12 {
			// Assuming 12:00 AM is beginning of the day, not the next.
			HH = 0
		}
	}
	MM, err = strconv.Atoi(minutes)
	if err != nil {
		return nil, err
	}

	// Translate to Time structure.
	date = time.Date(
		yyyy, time.Month(mm), dd, HH, MM, 00, 000, time.UTC)

	return &date, nil
}

// parseFilename parses the specified filename and returns the owner and createdDate components.
func parseFilename(name string) (string, *time.Time, error) {
	var owner string
	var createDate *time.Time
	var err error

	// Validate input arguments.
	if name == "" {
		err = errors.New("empty filename string")
		return "", nil, err
	}

	// The string to parse is expected to be in the format "owner_Logs_createdDate.tgz".
	// For example "B827EBEADCAB_Logs_03-31-20-09-55PM.tgz"
	parts := strings.Split(name, "_")
	if len(parts) == 3 {
		owner = parts[0]
		sDate := parts[2]
		sDate = strings.TrimSuffix(sDate, filepath.Ext(sDate))

		// Parse the date component.
		createDate, err = parseDate(sDate)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
		}
	} else {
		err = errors.New("illegal filename format")
		log.Println("[LOGSERVER-Error]", err)
	}

	return owner, createDate, err
}

/*
func createQuery(filter *LogEntry) (string, error) {
	var query string
	var parts []string
	var firstItem bool = false

	parts = make([]string, 0)
	parts = append(parts, "SELECT time_id, file_name, owner, size, create_date, contact, description, location FROM \"LogEntry\"")
	if filter.FileName != "" {
		parts = append(parts, " WHERE file_name = '")
		parts = append(parts, filter.FileName+"'")
		firstItem = true
	}
	if filter.Owner != "" {
		if firstItem {
			parts = append(parts, " AND owner = '")
			parts = append(parts, filter.Owner+"'")
		} else {
			parts = append(parts, " WHERE owner = '")
			parts = append(parts, filter.Owner+"'")
			firstItem = true
		}
	}
	if !filter.CreateDate.IsZero() {
		createDate := filter.CreateDate.Format(time.RFC3339)
		if firstItem {
			parts = append(parts, " AND create_date = '")
			parts = append(parts, createDate+"'")
		} else {
			parts = append(parts, " WHERE create_date = '")
			parts = append(parts, createDate+"'")
			firstItem = true
		}
	}
	if filter.Size != 0 {
		var fileSize string = strconv.FormatInt(filter.Size, 10)
		if firstItem {
			parts = append(parts, " AND size = ")
			parts = append(parts, fileSize)
		} else {
			parts = append(parts, " WHERE size = ")
			parts = append(parts, fileSize)
			firstItem = true
		}
	}
	parts = append(parts, " ALLOW FILTERING")

	for _, value := range parts {
		query = query + value
	}

	return query, nil
}
*/

func filterIsEmpty(filter *LogFilter) bool {
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		return false
	}

	if (filter.FileName == "") && (filter.Owner == "") && (filter.SizeLower < 0) && (filter.SizeUpper < 0) &&
		(filter.CreateDateLower.IsZero()) && (filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func retrieveLogInfo(session *gocql.Session, filter *LogFilter) ([]LogEntry, error) {
	// Validate input arguments.
	if session == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		return nil, err
	}
	if filter == nil {
		err := errors.New("invalid input argument")
		log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		return nil, err
	}

	var values []LogEntry
	if filterIsEmpty(filter) || filterContainsFilenameOnly(filter) {
		var err error
		values, err = processLogEntryQuery(session, filter)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}
	} else if filterContainsSizeOnly(filter) || filterContainsSizeRangeOnly(filter) {
		var err error
		values, err = processSizeQuery(session, filter.SizeLower, filter.SizeUpper)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}
	} else if filterContainsOwnerOnly(filter) {
		var err error
		values, err = processOwnerQuery(session, filter)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}
	} else if filterContainsCreateDateOnly(filter) {
		var err error
		values, err = processCreateDateQuery(session, filter)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
			return nil, err
		}
	} else {
		err := errors.New("filter not supported")
		return nil, err
	}

	return values, nil
}
