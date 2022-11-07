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
	"logserver/logger"

	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/spf13/viper"
)

// LogServerStruct holds information concerning a Cassandra session.
type LogServerStruct struct {
	Session *gocql.Session
}

// LogServer is the global log server handle.
var LogServer LogServerStruct

// Declare global variables.
var gUseCassandra = false

// Initialize Xconf Server application.
func init() {
	// Todo: Initialize global server logging here.
	log.Println("[XCONFLOGSERVER] Initializing Xconf Log Server")
}

func main() {
	// Initialize configuration.

	// Set default logging output to include INFO/WARN/DEBUG/ERROR levels.
	viper.SetDefault("logserver.log.enable", true)
	viper.SetDefault("logserver.log.info", true)
	viper.SetDefault("logserver.log.warn", true)
	viper.SetDefault("logserver.log.debug", true)
	viper.SetDefault("logserver.log.error", true)

	// Set default to save logs to the local file system.
	viper.SetDefault("logserver.destination", "file:///opt/logserver/logs")
	viper.SetDefault("logserver.encode", false)
	viper.SetDefault("logserver.port", 8080)

	viper.SetConfigName("config")
	viper.AddConfigPath("/etc/logserver")
	viper.AddConfigPath("/opt/logserver/config")
	viper.AddConfigPath("$HOME/.logserver")
	err := viper.ReadInConfig()
	if err != nil {
		msg := fmt.Sprintf("Unable to read configuration file %v.", err)
		logger.XconfLogWarn(msg, true)
	}

	// Configure server logging.
	var logDebug, logInfo, logWarn, logError bool
	if viper.GetBool("logserver.log.enable") {
		xconflog := logger.NewXconfLog()

		// Set the log levels.
		logDebug = viper.GetBool("logserver.log.debug")
		logInfo = viper.GetBool("logserver.log.info")
		logWarn = viper.GetBool("logserver.log.warn")
		logError = viper.GetBool("logserver.log.error")
		logger.GXconfLogger.SetLogLevel(logDebug, logInfo, logWarn, logError)

		// Enable output to a file.
		xconflog.EnableFileOutput(true)
	}

	// Log Xconf Server configuration.
	logger.XconfLogDebug("Server Configuration\n", true)
	msg := fmt.Sprintf("    Log Destination: %s\n", viper.GetString("logserver.destination"))
	logger.XconfLogDebug(msg, true)
	msg = fmt.Sprintf("    Encoding: %t\n", viper.GetBool("logserver.encode"))
	logger.XconfLogDebug(msg, true)
	msg = fmt.Sprintf("    Server Port: %d", viper.GetInt("logserver.port"))
	logger.XconfLogDebug(msg, true)
	msg = fmt.Sprintf("    Cassandra Hosts: %s", viper.GetStringSlice("cassandra.hosts"))
	logger.XconfLogDebug(msg, true)
	msg = fmt.Sprintf("    Log Output: %v", viper.GetBool("logserver.log.enable"))
	logger.XconfLogDebug(msg, true)
	msg = fmt.Sprintf("    Log Output File: %s", viper.GetString("logserver.log.file"))
	logger.XconfLogDebug(msg, true)
	msg = fmt.Sprintf("    Log Output Levels: Debug = %v, Info = %v, Warn = %v, Error = %v", logDebug, logInfo, logWarn, logError)

	// Todo: Validate the destination for the logs.
	//err := validateDestination(viper.GetString("logserver.destination"))

	// Todo: Initialize gin HTTPS server.
	//useHTTPS := viper.GetBool("logserver.https.enable")
	useHTTPS := false

	// Initialize gin HTTP server.
	router := gin.Default()
	//if useHTTPS {
	//		router.Use(LoadTls())
	//}

	// Set a lower memory limit for multipart forms (default is 32 MiB)
	//router.MaxMultipartMemory = 8 << 20 // 8 MiB
	//router.Static("/", "./public")

	// Handler for GET REST API, http://<ip_address>:<port>/ping.
	router.GET("/api/v1/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Handler for POST REST API, http://<ip_address>:<port>/api/v1/upload.
	router.POST("/api/v1/logs/upload", UploadLog)

	// Handler for GET REST API, http://<ip_address>:<port>/api/v1/download?name=<file_name>.
	router.GET("/api/v1/logs/download", DownloadLog)

	// Handler for DELETE REST API, http://<ip_address>:<port>/api/v1/logs/<name>.
	router.DELETE("/api/v1/logs/:name", DeleteLog)

	// Handler for GET REST API, http://<ip_address>:<port>/api/v1/logs/info.
	router.GET("/api/v1/logs/info", GetLogInfo)

	// Handler for REST API, http://<ip_address>:<port>/index. Web UI.
	router.LoadHTMLGlob("templates/index.html")
	router.Static("/css", "templates/css")
	router.Static("/font", "templates/font")
	router.Static("/js", "templates/js")
	router.Static("/resource", "templates/resource")
	router.GET("/index", func(c *gin.Context) {
		// Display Web UI.
		c.HTML(http.StatusOK, "index.html", nil)
	})

	// Open Cassandra session for ASUD Server meta-data.
	session, err := LogServer.OpenSession()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return
	}
	gUseCassandra = true
	LogServer.Session = session

	/*
		// Open Cassandra session.
		var session *gocql.Session
		cassandraHosts := viper.GetStringSlice("cassandra.hosts")
		if len(cassandraHosts) == 0 {
			//log.Println("[LOGSERVER-Info] No cassandra configuration found. Skipping database registration.")
			logger.XconfLogWarn("No cassandra configuration found. Skipping database registration.", true)
			gUseCassandra = false
		} else {
			var err error

			// Open a cassandra session.
			session, err = openSession(cassandraHosts)
			if err != nil {
				//log.Println("[LOGSERVER-Error]", err)
				logger.XconfLogError(err.Error(), true)
				return
			}
			gUseCassandra = true
			gSession = session

			// Defer closing the session until the program is ready to exit.
			defer closeSession(session)
		}
	*/

	// Initialize the Cassandra DB.
	err = LogServer.InitializeDB()
	if err != nil {
		logger.XconfLogError(err.Error(), true)
		return
	}

	// Defer closing the session until the program is ready to exit.
	// Currently this means that the Cassandra DB session will remain open
	// until the ASUD Server is shut down.
	defer LogServer.CloseSession()

	// Extract port from viper configuration.
	port := ":" + viper.GetString("logserver.port")

	/*
		// Start the server.
		//router.Run(port)
		s := &http.Server{
			Addr:           port,
			Handler:        router,
			ReadTimeout:    10 * time.Second,
			WriteTimeout:   10 * time.Second,
			MaxHeaderBytes: 1 << 20,
		}
		s.ListenAndServe()
	*/

	// Start the server.
	if useHTTPS {
		// Extract certFile from viper configuration.
		httpsPath := viper.GetString("logserver.https.path")
		certFile := httpsPath + "/" + viper.GetString("logserver.https.certificateFile")
		// Extract keyFile from viper configuration.
		keyFile := httpsPath + "/" + viper.GetString("logserver.https.keyFile")

		//http.ListenAndServeTLS(":8080", "conf/localhost.pem", "conf/localhost-key.pem", nil)
		router.RunTLS(port, certFile, keyFile)
	} else {
		//router.Run(port)

		//readTimeOut := 30 * time.Second
		readTimeOut := 0 * time.Second
		//writeTimeOut := 30 * time.Second
		writeTimeOut := 0 * time.Second
		s := &http.Server{
			Addr:           port,
			Handler:        router,
			ReadTimeout:    readTimeOut,
			WriteTimeout:   writeTimeOut,
			MaxHeaderBytes: 1 << 20,
		}
		s.ListenAndServe()
	}

}

/* Uncomment to support HTTPS.
// LoadTls is a handler used to process HTTPS requests and redirect them to HTTP for action.
func LoadTls() gin.HandlerFunc {
	return func(c *gin.Context) {
		middleware := secure.New(secure.Options{
			SSLRedirect: true,
			SSLHost:     "localhost:8000",
		})
		err := middleware.Process(c.Writer, c.Request)
		if err != nil {
			// If an error occrs, do not continue.
			logger.XconfLogError(err.Error(), true)
			return
		}

		// Continue processing.
		c.Next()
	}
}
*/
