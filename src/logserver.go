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
	viper.ReadInConfig()

	// Configure server logging.
	if viper.GetBool("logserver.log.enable") {
		xconflog := logger.NewXconfLog()

		// Set the log levels.
		logDebug := viper.GetBool("logserver.log.debug")
		logInfo := viper.GetBool("logserver.log.info")
		logWarn := viper.GetBool("logserver.log.warn")
		logError := viper.GetBool("logserver.log.error")
		logger.GXconfLogger.SetLogLevel(logDebug, logInfo, logWarn, logError)

		// Enable output to a file.
		xconflog.EnableFileOutput(true)
	}

	// Log Xconf Server configuration.
	logger.XconfLogInfo("Server Configuration\n", true)
	msg := fmt.Sprintf("\tLog Destination: %s\n", viper.GetString("logserver.destination"))
	logger.XconfLogInfo(msg, true)
	msg = fmt.Sprintf("\tEncoding: %t\n", viper.GetBool("logserver.encode"))
	logger.XconfLogInfo(msg, true)
	msg = fmt.Sprintf("\tServer Port: %d", viper.GetInt("logserver.port"))
	logger.XconfLogInfo(msg, true)

	// Validate the destination for the logs.
	//err := validateDestination(viper.GetString("logserver.destination"))

	// Initialize gin HTTP server.
	router := gin.Default()

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
	router.GET("/api/v1/logs/info", GetInfo)

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

	// Extract port from viper configuration.
	port := ":" + viper.GetString("logserver.port")

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
}
