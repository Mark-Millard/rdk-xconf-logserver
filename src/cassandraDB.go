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

// LogEntry provides information for a log asset,
// one that is being uploaded/downloaded to/from the log server.
type LogEntry struct {
	timeID      gocql.UUID // A unique identifier based on a timestamp.
	fileName    string     // The name of the file.
	location    string     // The location of the file (i.e. URL).
	size        uint32     // The size of the file (in MB).
	createDate  time.Time  // A date stamp indicating when the file file was created.
	owner       string     // The owner of the file.
	contact     string     // Contact information for the file owner.
	description string     // A textual desciption of the file contents.
}

// Opens a session with the Cassandra cluster.
func openSession() (*gocql.Session, error) {
	// Connect to the cluster.
	cluster := gocql.NewCluster("172.18.0.2")
	cluster.Keyspace = "LogDataService"
	cluster.Consistency = gocql.Quorum
	session, err := cluster.CreateSession()
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to create a cassandra session:", err, ".")
	}

	return session, err
}

// Close the specified session.
func closeSession(session *gocql.Session) {
	// Todo: validate session.
	session.Close()
}

// Insert the log meta-data to the Cassandra cluster.
func registerLog(session *gocql.Session, entry LogEntry) error {
	// Todo: validate session.

	// Insert a log entry.
	var err error
	if err = session.Query(`INSERT INTO "LogEntry" (time_id, file_name, location) VALUES (?, ?, ?)`,
		gocql.TimeUUID(), entry.fileName, entry.location).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}

	return err
}

// Remove the log meta-data from the Cassandra cluster.
func unregisterLog(session *gocql.Session, entry LogEntry) error {
	// Todo: validate session.

	// Remove a log entry.
	var err error
	if err = session.Query(`DELETE FROM "LogEntry" WHERE time_id = ?`,
		entry.timeID).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}

	return nil
}

// ParseDate parses the specified date stamp and returns it as a Time structure.
func ParseDate(dateStr string) (*time.Time, error) {
	var date time.Time
	var str string
	var err error

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
		return nil, nil
	}

	// Parse out date components.
	parts := strings.Split(str, "-")
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

// Parse the specified filename and return the owner and createdDate components.
func parseFilename(name string) (string, time.Time, error) {
	var owner string
	var createdDate *time.Time
	var err error

	// The string to parse is expected to be in the format "owner_Logs_createdDate.tgz".
	// For example "B827EBEADCAB_Logs_03-31-20-09-55PM.tgz"
	parts := strings.Split(name, "_")
	if len(parts) == 3 {
		owner = parts[0]
		sDate := parts[2]
		sDate = strings.TrimSuffix(sDate, filepath.Ext(sDate))

		// Parse the date component.
		createdDate, err = ParseDate(sDate)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
		}
	} else {
		err = errors.New("illegal filename format")
		log.Println("[LOGSERVER-Error]", err)
	}

	return owner, *createdDate, err
}
