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

import (
	"errors"
	"fmt"
	"logserver/logger"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/spf13/viper"
)

// UploadLog is the handler for POST REST API, http://<ip_address>:<port>/api/v1/upload.
func UploadLog(c *gin.Context) {
	logger.XconfLogDebug("https://<ip_address>:<port>/v1/logs/upload POST Handler", true)

	// Retrieve form parameters.
	contact := c.PostForm("contact")
	description := c.PostForm("description")

	// Retrieve the file from the field "filename".
	file, err := c.FormFile("filename")
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"message": "GET Form error",
			"reason":  err.Error(),
		})
		return
	}

	// Upload the file.
	err = upload(c, file)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"message": "Upload file error",
			"reason":  err.Error(),
		})
		return
	}

	var entry LogEntry
	if gUseCassandra {
		// Update the Cassandra DB if we are using it.
		entry.FileName = file.Filename
		entry.Location = viper.GetString("logserver.destination")
		entry.Size = file.Size
		entry.Contact = contact
		entry.Description = description

		var owner string
		var createDate *time.Time
		owner, createDate, err = parseFilename(entry.FileName)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Meta-data registration error",
				"reason":  err.Error(),
			})
			return
		} else {
			entry.Owner = owner
			entry.CreateDate = *createDate
		}

		// Register the meta-data with the database.
		err = registerLog(gSession, &entry)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to register meta-data for log,", entry.FileName)
			logger.XconfLogError("Unable to register meta-data for log,"+entry.FileName, true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Meta-data registration error",
				"reason":  err.Error(),
			})
			return
		}
	}

	var interfaceSlice []interface{} = make([]interface{}, 1)
	interfaceSlice[0] = entry

	type UploadResponse struct {
		Message string        `json:"message"`
		Reason  string        `json:"reason"`
		Reply   []interface{} `json:"info"`
	}
	var response UploadResponse
	response.Message = "Log upload success"
	response.Reason = ""
	response.Reply = interfaceSlice

	c.JSON(http.StatusOK, response)
}

// Handler for GET REST API, http://<ip_address>:<port>/api/v1/download?name=<file_name>.
func DownloadLog(c *gin.Context) {
	logger.XconfLogDebug("https://<ip_address>:<port>/v1/logs/download GET Handler", true)

	fileName := c.Query("name")
	if fileName == "" {
		//log.Println("[LOGSERVER-Error] Query key name was not provided.")
		logger.XconfLogError("Query key name was not provided.", true)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"message": "Query error",
			"reason":  "name key required",
		})
		return
	}

	src := viper.GetString("logserver.destination")
	// The expectation is that the source is specified as a formal URL.
	u, err := url.Parse(src)
	if err != nil {
		//log.Println("[LOGSERVER-Error] Unable to parse source URL " + src + ".")
		logger.XconfLogError("Unable to parse source URL "+src+".", true)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "URL parse error",
			"reason":  err.Error(),
		})
		return
	}

	if u.Scheme == "file" {
		//log.Println("[LOGSERVER-Info] Attempting to download log from " + u.Path + ".")
		logger.XconfLogDebug("Downloading log from "+u.Path+".", true)

		// Validate that the log exists.
		//path := u.Path + "/" + fileName
		path := filepath.Join(u.Path, fileName)

		var info os.FileInfo
		if info, err = os.Stat(path); os.IsNotExist(err) {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{
				"message": "Download log error",
				"reason":  err.Error(),
			})
			return
		}
		len := info.Size()
		sLen := strconv.FormatInt(len, 10)

		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Transfer-Encoding", "binary")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
		c.Header("Content-Type", "application/octet-stream")
		c.Header("Content-Length", sLen)

		c.File(path)

		c.JSON(http.StatusOK, gin.H{
			"message": "Download success",
			"reason":  "",
		})
	} else if u.Scheme == "http" {
		//log.Println("[LOGSERVER-Info] Downloading log from " + u.Path + ".")
		logger.XconfLogInfo("Downloading log from "+u.Path+".", true)
		// Todo: retrieve logs from an HTTP server.

		c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
			"message": "URL parse error",
			"reason":  "HTTP protocol not supported",
		})
	} else {
		//log.Println("[LOGSERVER-Error] Unsupported source URL " + src + ".")
		logger.XconfLogError("Unsupported source URL "+src+".", true)

		c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
			"message": "URL parse error",
			"reason":  "protocol not supported",
		})
	}
}

// DeleteLog is the handler for DELETE REST API, http://<ip_address>:<port>/api/v1/logs/<name>.
func DeleteLog(c *gin.Context) {
	logger.XconfLogDebug("https://<ip_address>:<port>/v1/logs/name DELETE Handler", true)

	fileName := c.Params.ByName("name")
	if fileName == "" {
		//log.Println("[LOGSERVER-Error] Log key name was not provided.")
		logger.XconfLogError("Log key name was not provided.", true)

		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"message": "Delete error",
			"reason":  "name key required",
		})
		return
	}

	src := viper.GetString("logserver.destination")
	// The expectation is that the source is specified as a formal URL.
	u, err := url.Parse(src)
	if err != nil {
		//log.Println("[LOGSERVER-Error] Unable to parse source URL " + src + ".")
		logger.XconfLogError("Unable to parse source URL "+src+".", true)

		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "URL parse error",
			"reason":  err.Error(),
		})
		return
	}

	if u.Scheme == "file" {
		//log.Println("[LOGSERVER-Info] Attempting to delete log from " + u.Path + ".")
		logger.XconfLogDebug("Deleting log from "+u.Path+".", true)

		// Validate that the log exists.
		//path := u.Path + "/" + fileName
		path := filepath.Join(u.Path, fileName)

		if _, err = os.Stat(path); os.IsNotExist(err) {
			//log.Println("[LOGSERVER-Error] Log does not exist.")
			logger.XconfLogError("Log does not exist.", true)

			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{
				"message": "Delete error",
				"reason":  err.Error(),
			})
			return
		}

		if gUseCassandra {
			// Remove Cassandra data base entry.

			// Retrieve info for named file.
			var filter LogFilter
			filter.FileName = fileName
			filter.SizeLower = -1
			filter.SizeUpper = -1

			var info []LogEntry
			info, err = retrieveLogInfo(gSession, &filter)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"message": "Info retrieval error",
					"reason":  err.Error(),
				})
				return
			}

			// Unregister the database entry.
			err = unregisterLog(gSession, &info[0])
			if err != nil {
				//log.Println("[LOGSERVER-Error] Unable to unregister log.")
				logger.XconfLogError("Unable to unregister log.", true)
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{
					"message": "Delete error",
					"reason":  err.Error(),
				})
				return
			}
		}

		// Delete the log.
		if err = deleteLog(fileName); err != nil {
			//log.Println("[LOGSERVER-Error] Unable to delete log.")
			logger.XconfLogError("Unable to delete log.", true)

			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{
				"message": "Delete error",
				"reason":  err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Delete success",
			"reason":  "",
		})
	} else if u.Scheme == "http" {
		//log.Println("[LOGSERVER-Info] Deleting log from " + u.Path + ".")
		logger.XconfLogDebug("Deleting log from "+u.Path+".", true)
		// Todo: retrieve logs from HTTP server.

		c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
			"message": "URL parse error",
			"reason":  "HTTP protocol not supported",
		})
	} else {
		//log.Println("[LOGSERVER-Error] Unsupported source URL " + src + ".")
		logger.XconfLogError("Unsupported source URL "+src+".", true)

		c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
			"message": "URL parse error",
			"reason":  "protocol not supported",
		})
	}
}

func contains(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

// GetLogInfo is the handler for GET REST API, http://<ip_address>:<port>/api/v1/logs/info.
func GetLogInfo(c *gin.Context) {
	logger.XconfLogDebug("https://<ip_address>:<port>/v1/logs/info GET Handler", true)

	// Check for unknown queries.
	validQueries := []string{"id", "file_name", "size", "size.gt", "size.lt", "owner", "create_date", "create_date.gt", "create_date.lt"}
	queries := c.Request.URL.Query()
	//fmt.Println("queries:", queries)
	for k, _ := range queries {
		if !contains(validQueries, k) {
			//fmt.Printf("%s -> %s\n", k, v)
			err := errors.New("Invalid query " + k)
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}

	// Parse filter input.
	timeID := c.Query("id")
	fileName := c.Query("file_name")
	fileSize := c.Query("size")
	sizeLowerBound := c.Query("size.gt")
	sizeUpperBound := c.Query("size.lt")
	//location := c.Query("location")
	owner := c.Query("owner")
	createDate := c.Query("create_date")
	createDateLowerBound := c.Query("create_date.gt")
	createDateUpperBound := c.Query("create_date.lt")
	//contact := c.Query("contact")
	//description := c.Query("description")

	var err error
	var filter LogFilter

	// Set filter parameters.
	if timeID != "" {
		var id gocql.UUID
		id, err = gocql.ParseUUID(timeID)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse id", timeID, ".")
			logger.XconfLogError("Unable to parse id "+timeID+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
		filter.TimeID = id
	}
	filter.FileName = fileName
	filter.SizeLower = -1
	filter.SizeUpper = -1
	if sizeLowerBound != "" {
		filter.SizeLower, err = strconv.ParseInt(sizeLowerBound, 10, 64)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse size.gt", sizeLowerBound, ".")
			logger.XconfLogError("Unable to parse size.gt "+sizeLowerBound+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}
	if sizeUpperBound != "" {
		filter.SizeUpper, err = strconv.ParseInt(sizeUpperBound, 10, 64)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse size.lt", sizeUpperBound, ".")
			logger.XconfLogError("Unable to parse size.lt "+sizeUpperBound+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}
	if fileSize != "" {
		filter.SizeLower, err = strconv.ParseInt(fileSize, 10, 64)
		filter.SizeUpper = filter.SizeLower
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse size", fileSize, ".")
			logger.XconfLogError("Unable to parse size "+fileSize+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}
	//filter.Location = location
	filter.Owner = owner
	if createDateLowerBound != "" {
		t, _ := time.Parse(time.RFC3339, createDateLowerBound)
		//log.Printf("[LOGSERVER-Info] createDateLowerBound = %s", t)
		msg := fmt.Sprintf("createDateLowerBound = %s", t)
		logger.XconfLogDebug(msg, true)
		filter.CreateDateLower, err = time.Parse(time.RFC3339, createDateLowerBound)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse create_data.gt", createDateLowerBound, ".")
			logger.XconfLogError("Unable to parse create_data.gt "+createDateLowerBound+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}
	if createDateUpperBound != "" {
		t, _ := time.Parse(time.RFC3339, createDateUpperBound)
		//log.Printf("[LOGSERVER-Info] createDateUpperBound = %s", t)
		msg := fmt.Sprintf("createDateUpperBound = %s", t)
		logger.XconfLogDebug(msg, true)
		filter.CreateDateUpper, err = time.Parse(time.RFC3339, createDateUpperBound)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse create_data.lt", createDateUpperBound, ".")
			logger.XconfLogError("Unable to parse create_data.lt "+createDateUpperBound+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}
	if createDate != "" {
		t, _ := time.Parse(time.RFC3339, createDate)
		//log.Printf("[LOGSERVER-Info] createDate = %s", t)
		msg := fmt.Sprintf("createDate = %s", t)
		logger.XconfLogDebug(msg, true)
		filter.CreateDateLower, err = time.Parse(time.RFC3339, createDate)
		filter.CreateDateUpper = filter.CreateDateLower
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to parse create_data", createDate, ".")
			logger.XconfLogError("Unable to parse create_data "+createDate+".", true)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "Info retrieval error",
				"reason":  err.Error(),
			})
			return
		}
	}
	//filter.Contact = contact
	//filter.Description = description

	var info []LogEntry
	info, err = retrieveLogInfo(gSession, &filter)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": "Info retrieval error",
			"reason":  err.Error(),
		})
		return
	}

	var interfaceSlice []interface{} = make([]interface{}, len(info))
	for i, entry := range info {
		interfaceSlice[i] = entry
	}

	type InfoResponse struct {
		Message string        `json:"message"`
		Reason  string        `json:"reason"`
		Reply   []interface{} `json:"info"`
	}
	var response InfoResponse
	response.Message = "Info retrieval success"
	response.Reason = ""
	response.Reply = interfaceSlice

	c.JSON(http.StatusOK, response)
}
