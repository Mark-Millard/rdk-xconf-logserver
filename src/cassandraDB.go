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
	timeID      gocql.UUID // A unique identifier based on a timestamp.
	fileName    string     // The name of the file.
	location    string     // The location of the file (i.e. URL).
	size        int64      // The size of the file (in MB).
	createDate  time.Time  // A date stamp indicating when the file file was created.
	owner       string     // The owner of the file.
	contact     string     // Contact information for the file owner.
	description string     // A textual desciption of the file contents.
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
	//cluster := gocql.NewCluster("172.18.0.2")
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
	if err = session.Query(`INSERT INTO "LogEntry" (time_id, file_name, location, size, contact, description, owner, create_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		uuid, entry.fileName, entry.location, entry.size, entry.contact, entry.description, entry.owner, entry.createDate).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	entry.timeID = uuid

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
	if err = session.Query(`DELETE FROM "LogEntry" WHERE time_id = ?`,
		entry.timeID).Exec(); err != nil {
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
		yyyy, time.Month(mm), dd, HH, MM, 00, 000, time.Local)

	return &date, nil
}

// parseFilename parses the specified filename and returns the owner and createdDate components.
func parseFilename(name string) (string, *time.Time, error) {
	var owner string
	var createdDate *time.Time
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
		createdDate, err = parseDate(sDate)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
		}
	} else {
		err = errors.New("illegal filename format")
		log.Println("[LOGSERVER-Error]", err)
	}

	return owner, createdDate, err
}

func retrieveLogInfo(session *gocql.Session, filter *LogEntry) ([]LogEntry, error) {
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

	// Retrieve a log entry.
	var id gocql.UUID
	var fileName string
	var fileSize int64
	var owner string
	var contact string
	var description string
	var location string
	var createDate time.Time

	/* Search for a specific set of records whose 'file_name' column matches the value in the filter*/
	if err := session.Query(`SELECT time_id, file_name, owner, size, create_date, contact, description, location FROM "LogEntry" WHERE file_name = ? LIMIT 1 ALLOW FILTERING`,
		filter.fileName).Consistency(gocql.One).Scan(&id, &fileName, &owner, &fileSize, &createDate, &contact, &description, &location); err != nil {
		log.Println("[LOGSERVER-Error]", err)
		return nil, err
	}

	// Populate the return value.
	size := 1
	values := make([]LogEntry, size)
	values[0].timeID = id
	values[0].fileName = fileName
	values[0].owner = owner
	values[0].size = fileSize
	values[0].createDate = createDate
	values[0].contact = contact
	values[0].description = description
	values[0].location = location

	return values, nil
}
