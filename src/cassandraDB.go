// COPYRIGHT_BEGIN
// Copyright 2020 Alticast Inc.
// Copyright 2022 Auteur Art & Technology, LLC.
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
	"fmt"
	"logserver/logger"

	"errors"
	"log"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gocql/gocql"
	"github.com/spf13/viper"
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

// CassandraConfig defines the Cluster configuration parameters.
type CassandraConfig struct {
	Hosts                []string
	ReconnectionRetries  int
	ReconnectionInterval int64
	//Keyspace             string
}

// Opens a session with the Cassandra cluster.
func openSession(config CassandraConfig) (*gocql.Session, error) {
	msg := fmt.Sprintf("Opening Cassandra session with hosts: %s", config.Hosts)
	logger.XconfLogDebug(msg, true)

	// Validate input arguments.
	if len(config.Hosts) == 0 {
		err := errors.New("invalid input argument")
		msg := fmt.Sprintf("Unable to open a Cassandra session: %s.", err)
		logger.XconfLogError(msg, true)
		return nil, err
	}

	// Connect to the cluster.
	cluster := gocql.NewCluster(config.Hosts[0])

	/* Todo: Enable Cassandra authentication.
	   cluster.Authenticator = gocql.PasswordAuthenticator {
	           Username: "user",
	           Password: "password" }
	*/
	/* Todo: Enable Transport Layer Security
	   cluster.SslOpts = &gocql.SslOptions{
	           EnableHostVerification: true,
	   }
	*/

	//cluster.Keyspace = "LogDataService"
	cluster.Consistency = gocql.Quorum
	cluster.ReconnectionPolicy = &gocql.ConstantReconnectionPolicy{
		MaxRetries: config.ReconnectionRetries,
		Interval:   time.Duration(config.ReconnectionInterval) * time.Second}

	session, err := cluster.CreateSession()
	if err != nil {
		//log.Println("[LOGSERVER-Error] Unable to create a cassandra session:", err, ".")
		logger.XconfLogError("Unable to open a cassandra session: "+err.Error()+".", true)
	}

	return session, err
}

// closeSession will close the specified session.
func closeSession(session *gocql.Session) error {
	logger.XconfLogDebug("Closing Cassandra session.", true)

	// Validate input arguments.
	if session == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to close a cassandra session:", err, ".")
		logger.XconfLogError("Unable to close a cassandra session: "+err.Error()+".", true)
		return err
	}

	session.Close()

	return nil
}

// InitializeDB is used to initialize the Log Server Cassandra DB schema.
func (server *LogServerStruct) InitializeDB() error {
	logger.XconfLogInfo("Initializing Cassandra DB Log Server meta-data.", true)

	var err error
	var msg string

	// Cassandra session must be already open in order to initialize DB Schema.
	if server.Session == nil {
		err = fmt.Errorf("invalid session: not open")
		logger.XconfLogError(err.Error(), true)
		return err
	}

	// Initialize ASUD Server keyspace.
	query := "CREATE KEYSPACE IF NOT EXISTS \"LogDataService\" WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true"
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE TABLE IF NOT EXISTS "LogDataService"."LogEntry" (
		time_id timeuuid,
		file_name text,
		location text,
		contact text,
		description text,
		PRIMARY KEY ((time_id), file_name, contact, description, location)
	);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE TABLE IF NOT EXISTS "LogDataService"."LogOwner" (
		time_id timeuuid,
		owner text,
		PRIMARY KEY ((time_id), owner)
	);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE TABLE IF NOT EXISTS "LogDataService"."LogSize" (
		time_id timeuuid,
		size bigint,
		PRIMARY KEY ((time_id), size)
	);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE TABLE IF NOT EXISTS "LogDataService"."LogTimestamp" (
		time_id timeuuid,
		create_date timestamp,
		modify_date timestamp,
		PRIMARY KEY ((time_id), create_date)
	);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE TABLE IF NOT EXISTS "LogDataService"."LogDeviceIndex" (
		uuid timeuuid,
		device_id text,
		logs set<timeuuid>,
		PRIMARY KEY ((uuid), device_id)
	);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE INDEX IF NOT EXISTS ON "LogDataService"."LogEntry" (file_name);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE INDEX IF NOT EXISTS ON "LogDataService"."LogOwner" (owner);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE INDEX IF NOT EXISTS ON "LogDataService"."LogTimestamp" (create_date);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE INDEX IF NOT EXISTS ON "LogDataService"."LogSize" (size);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	query = `CREATE INDEX IF NOT EXISTS ON "LogDataService"."LogDeviceIndex" (device_id);`
	msg = fmt.Sprintf("Cassandra DB query: %s", query)
	logger.XconfLogDebug(msg, true)
	err = server.Session.Query(query).Exec()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return err
	}

	return err
}

// OpenSession() will open a session for the Log Server.
func (server LogServerStruct) OpenSession() (*gocql.Session, error) {
	logger.XconfLogInfo("Opening Cassandra DB session for Log Server meta-data.", true)

	var session *gocql.Session
	var err error

	// If the Session has already been opened, return it.
	if server.Session != nil {
		// Todo: validate that we can still reach the opened server?
		// Is there a way to do this without making a query to the server?
		return server.Session, nil
	}

	// Get the Cassandra DB configuration to open.
	cassandraHosts := viper.GetStringSlice("cassandra.hosts")
	if len(cassandraHosts) == 0 {
		server.Session = nil

		err = fmt.Errorf("cassandra configuration not found")
		logger.XconfLogError(err.Error(), true)
		return nil, err
	}

	// Open a cassandra session for Log meta-data.
	var config CassandraConfig
	config.Hosts = cassandraHosts
	//config.Keyspace = viper.GetString("logserver.cassandra.keyspace")
	config.ReconnectionRetries = viper.GetInt("cassandra.reconnection.tries")
	config.ReconnectionInterval = viper.GetInt64("cassandra.reconnection.interval")

	connectionRetry := 0
	for {
		msg := fmt.Sprintf("Cassandra connection attempt: %d", connectionRetry)
		logger.XconfLogDebug(msg, true)
		session, err = openSession(config)
		if err == nil {
			break
		}

		if connectionRetry <= config.ReconnectionRetries {
			// Attempt to open the session again after waiting.
			connectionRetry++
			time.Sleep(time.Duration(config.ReconnectionInterval) * time.Second)
		} else {
			// Give up after config.ReconectionRetries attempts.
			break
		}
	}
	if err != nil {
		server.Session = nil

		logger.XconfLogError(err.Error(), true)
		return nil, err
	}
	server.Session = session

	return session, nil
}

// CloseSession will close the active Cassandra DB session for the Log Server.
func (server *LogServerStruct) CloseSession() error {
	logger.XconfLogInfo("Closing Cassandra DB session fore Log Server.", true)

	// Check if the session is already closed.
	if server.Session == nil {
		return nil
	}

	// Close the cassandra session.
	err := closeSession(server.Session)
	if err != nil {
		// An error occurred while closing the session.
		logger.XconfLogError(err.Error(), true)
		return err
	}

	server.Session = nil
	return nil
}

// GetSession will get the active Cassandra DB session for the Log Server.
func (server *LogServerStruct) GetSession() (*gocql.Session, error) {
	session, err := server.OpenSession()
	return session, err
}

// RegisterLog will insert the log meta-data to the Cassandra cluster.
func (server *LogServerStruct) RegisterLog(entry *LogEntry) error {
	logger.XconfLogDebug("Registering log.", true)

	// Validate input arguments.
	if server.Session == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		logger.XconfLogError("Unable to register a log: "+err.Error()+".", true)
		return err
	}
	if entry == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		logger.XconfLogError("Unable to register a log: "+err.Error()+".", true)
		return err
	}

	// Insert a log entry.
	var err error
	uuid := gocql.TimeUUID()

	if err = server.Session.Query(`INSERT INTO "LogDataService"."LogEntry" (time_id, file_name, location, contact, description) VALUES (?, ?, ?, ?, ?)`,
		uuid, entry.FileName, entry.Location, entry.Contact, entry.Description).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	if err = server.Session.Query(`INSERT INTO "LogDataService"."LogOwner" (time_id, owner) VALUES (?, ?)`,
		uuid, entry.Owner).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	if err = server.Session.Query(`INSERT INTO "LogDataService"."LogSize" (time_id, size) VALUES (?, ?)`,
		uuid, entry.Size).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	if err = server.Session.Query(`INSERT INTO "LogDataService"."LogTimestamp" (time_id, create_date) VALUES (?, ?)`,
		uuid, entry.CreateDate).Exec(); err != nil {
		log.Println("[LOGSERVER-Error]", err)
	}
	entry.TimeID = uuid

	return err
}

// unregisterLog removes the log meta-data from the Cassandra cluster.
func (server *LogServerStruct) UnregisterLog(entry *LogEntry) error {
	// Validate input arguments.
	if server.Session == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to unregister a log:", err, ".")
		logger.XconfLogError("Unable to unregister a log: "+err.Error()+".", true)
		return err
	}
	if entry == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to unregister a log:", err, ".")
		logger.XconfLogError("Unable to unregister a log: "+err.Error()+".", true)
		return err
	}

	// Remove a log entry.
	var err error
	if err = server.Session.Query(`DELETE FROM "LogDataService"."LogEntry" WHERE time_id = ? AND file_name = ?`,
		entry.TimeID, entry.FileName).Exec(); err != nil {
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
		return err
	}
	if err = server.Session.Query(`DELETE FROM "LogDataService"."LogOwner" WHERE time_id = ? AND owner = ?`,
		entry.TimeID, entry.Owner).Exec(); err != nil {
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
		return err
	}
	if err = server.Session.Query(`DELETE FROM "LogDataService"."LogSize" WHERE time_id = ? AND size = ?`,
		entry.TimeID, entry.Size).Exec(); err != nil {
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
		return err
	}
	if err = server.Session.Query(`DELETE FROM "LogDataService"."LogTimestamp" WHERE time_id = ? AND create_date = ?`,
		entry.TimeID, entry.CreateDate).Exec(); err != nil {
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
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
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
		return nil, err
	}

	// Parse out date components.
	parts := strings.Split(str, "-")
	if len(parts) != 5 {
		err = errors.New("illegal date format")
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
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
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
		}
	} else {
		err = errors.New("illegal filename format")
		//log.Println("[LOGSERVER-Error]", err)
		logger.XconfLogError(err.Error(), true)
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
		//log.Println("[LOGSERVER-Error] Invalid log filter:", err, ".")
		logger.XconfLogError("Invalid log filter: "+err.Error()+".", true)
		return false
	}

	if (filter.FileName == "") && (filter.Owner == "") && (filter.SizeLower < 0) && (filter.SizeUpper < 0) &&
		(filter.CreateDateLower.IsZero()) && (filter.CreateDateUpper.IsZero()) {
		return true
	}

	return false
}

func (server LogServerStruct) RetrieveLogInfo(filter *LogFilter) ([]LogEntry, error) {
	// Validate input arguments.
	if server.Session == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		logger.XconfLogError("Unable to register a log: "+err.Error()+".", true)
		return nil, err
	}
	if filter == nil {
		err := errors.New("invalid input argument")
		//log.Println("[LOGSERVER-Error] Unable to register a log:", err, ".")
		logger.XconfLogError("Unable to register a log: "+err.Error()+".", true)
		return nil, err
	}

	var values []LogEntry
	if filterIsEmpty(filter) || filterContainsFilenameOnly(filter) {
		var err error
		values, err = processLogEntryQuery(server.Session, filter)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else if filterContainsSizeOnly(filter) || filterContainsSizeRangeOnly(filter) {
		var err error
		values, err = processSizeQuery(server.Session, filter.SizeLower, filter.SizeUpper)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else if filterContainsOwnerOnly(filter) {
		var err error
		values, err = processOwnerQuery(server.Session, filter)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else if filterContainsCreateDateOnly(filter) || filterContainsCreateDateRangeOnly(filter) {
		var err error
		values, err = processCreateDateQuery(server.Session, filter.CreateDateLower, filter.CreateDateUpper)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else if filterContainsFilenameAndSizeRange(filter) {
		var err error
		values, err = processFilenameAndSizeQuery(server.Session, filter)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else if filterContainsFilenameAndDateRange(filter) {
		var err error
		values, err = processFilenameAndCreateDateQuery(server.Session, filter)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else if filterContainsFilenameAndSizeRangeAndDateRange(filter) {
		var err error
		values, err = processFilenameAndSizeAndCreateDateQuery(server.Session, filter)
		if err != nil {
			//log.Println("[LOGSERVER-Error]", err)
			logger.XconfLogError(err.Error(), true)
			return nil, err
		}
	} else {
		err := errors.New("filter not supported")
		return nil, err
	}

	return values, nil
}
