// COPYRIGHT_BEGIN
// COPYRIGHT_END

// Declare package.
package main

// Declare imported packages.
import (
	"bytes"
	b64 "encoding/base64"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"mime/multipart"
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

// Declare global variables.
var gUseCassandra = false

// Encode the file as base64 string.
func encode(buf *bytes.Buffer) string {
	sEnc := b64.StdEncoding.EncodeToString(buf.Bytes())
	return sEnc
}

// Create a directory if it doesn't already exist.
func createDirectory(dirName string) bool {
	src, err := os.Stat(dirName)

	if os.IsNotExist(err) {
		errDir := os.MkdirAll(dirName, 0755)
		if errDir != nil {
			log.Println("[LOGSERVER-Error] Unable to create directory " + dirName + ".")
			return false
		}
		return true
	}

	if src.Mode().IsRegular() {
		log.Println("[LOGSERVER-Error] " + dirName + " already exists as a file.")
		return false
	}

	// Directory already exists, ok to return true.
	return true
}

// Save the log to a local directory.
func saveLogToDirectory(data []byte, dirName string, fileName string) error {
	log.Println("[LOGSERVER-Info] Saving log to " + dirName + "/" + fileName + ".")

	// Make sure that the path exists and logs can be stored there.
	status := createDirectory(dirName)
	if !status {
		log.Println("[LOGSERVER-Error] Unable to save log to " + dirName + ".")
		return errors.New("unable to create directory")
	}

	// Write log to directory.
	dst := dirName + "/" + fileName
	err := ioutil.WriteFile(dst, data, 0644)

	return err
}

// Save the log encapsulated in the 'data' byte array.
func saveLog(data []byte, fileName string) error {
	// Retrieve destination from logserver configuration.
	dst := viper.GetString("logserver.destination")
	log.Println("[LOGSERVER-Info] Saving log to " + dst + ".")

	// The expectation is that the desination is specified as a formal URL.
	u, err := url.Parse(dst)
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to parse destination URL " + dst + ".")
		return err
	}

	if u.Scheme == "file" {
		if err = saveLogToDirectory(data, u.Path, fileName); err != nil {
			log.Println("[LOGSERVER-Error] Unable to save log to " + u.Path + ".")
			return err
		}
	} else if u.Scheme == "http" {
		log.Println("[LOGSERVER-Info] Uploading log to " + u.Path + ".")
		// Todo: upload file to HTTP server.
	} else {
		log.Println("[LOGSERVER-Error] Unsupported destination URL " + dst + ".")
		return errors.New("unable to upload file")
	}

	return nil
}

// Delete the specified file.
func deleteLog(fileName string) error {
	// Retrieve destination from logserver configuration.
	dst := viper.GetString("logserver.destination")
	log.Println("[LOGSERVER-Info] Deleting log from " + dst + ".")

	// The expectation is that the desination is specified as a formal URL.
	u, err := url.Parse(dst)
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to parse destination URL " + dst + ".")
		return err
	}

	if u.Scheme == "file" {
		fullPath := filepath.Join(u.Path, fileName)

		if err = os.Remove(fullPath); err != nil {
			log.Println("[LOGSERVER-Error] Unable to delete log from " + u.Path + ".")
			return err
		}
	} else if u.Scheme == "http" {
		log.Println("[LOGSERVER-Info] Uploading log to " + u.Path + ".")
		// Todo: upload file to HTTP server.
	} else {
		log.Println("[LOGSERVER-Error] Unsupported destination URL " + dst + ".")
		return errors.New("unable to upload file")
	}

	return nil
}

// Upload the file.
func upload(context *gin.Context, file *multipart.FileHeader) error {
	// Open the file for
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	// Read file into buffer.
	buf := bytes.NewBuffer(nil)
	if _, err = io.Copy(buf, src); err != nil {
		return err
	}

	// Encode file into base64.
	useEncode := viper.GetBool("logserver.encode")
	var content []byte
	if useEncode {
		sEnc := encode(buf)
		if sEnc == "" {
			return errors.New("unable to encode file")
		}
		content = []byte(sEnc)
	} else {
		content = buf.Bytes()
	}

	// Send encoded buffer to output URL (specified in config file)
	filename := filepath.Base(file.Filename)
	if err = saveLog(content, filename); err != nil {
		return err
	}

	return nil
}

// LogDownloadEntry provides information for a log asset,
// one that is being downloaded from the log server.
type LogDownloadEntry struct {
	Name string      // The name of the log.
	Path string      // The URL for the log.
	File os.FileInfo // A reference to the downloaded file.
}

// Retrieve the logs from the server.
func getLogs(src string) ([]LogDownloadEntry, error) {
	var logs []LogDownloadEntry
	log.Println("[LOGSERVER-Info] Reading logs from " + src + ".")

	// The expectation is that the source is specified as a formal URL.
	u, err := url.Parse(src)
	if err != nil {
		log.Println("[LOGSERVER-Error] Unable to parse source URL " + src + ".")
		return nil, err
	}

	if u.Scheme == "file" {
		// Logs are stored locally on the server.
		files, err := ioutil.ReadDir(u.Path)
		if err != nil {
			log.Println("[LOGSERVER-Error] Unable to read directory " + u.Path + ".")
			return nil, err
		}

		logs = []LogDownloadEntry{}

		for _, f := range files {
			log.Println("[LOGSERVER-Info] Found log file " + f.Name() + ".")
			entry := LogDownloadEntry{Name: f.Name(), Path: u.Path, File: f}
			logs = append(logs, entry)
		}

	} else if u.Scheme == "http" {
		log.Println("[LOGSERVER-Info] Retrieving logs from " + u.Path + ".")
		// Todo: retrieve logs from HTTP server.
	} else {
		log.Println("[LOGSERVER-Error] Unsupported source URL " + src + ".")
		return nil, errors.New("unable to upload file")
	}

	return logs, nil
}

func main() {
	// Initialize configuration.
	// Set default to save logs to the local file system.
	viper.SetDefault("logserver.destination", "file:///opt/logserver/logs")
	viper.SetDefault("logserver.encode", false)
	viper.SetDefault("logserver.port", 8080)

	viper.SetConfigName("config")
	viper.AddConfigPath("/etc/logserver")
	viper.AddConfigPath("/opt/logserver/config")
	viper.AddConfigPath("$HOME/.logserver")
	viper.ReadInConfig()

	// Todo: configure server logging. Currently, all server output is directed
	// towards the Go "log" package via log.Println().

	log.Print("[LOGSERVER-info] Server Configuration\n")
	log.Printf("\tLog Destination: %s\n", viper.GetString("logserver.destination"))
	log.Printf("\tEncoding: %t\n", viper.GetBool("logserver.encode"))
	log.Printf("\tServer Port: %d", viper.GetInt("logserver.port"))

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
	router.POST("/api/v1/logs/upload", func(c *gin.Context) {
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
				log.Println("[LOGSERVER-Error] Unable to register meta-data for log,", entry.FileName)
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
	})

	// Handler for GET REST API, http://<ip_address>:<port>/api/v1/download?name=<file_name>.
	router.GET("/api/v1/logs/download", func(c *gin.Context) {
		log.Println("[LOGSERVER-Info] In download handler.")

		fileName := c.Query("name")
		if fileName == "" {
			log.Println("[LOGSERVER-Error] Query key name was not provided.")
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
			log.Println("[LOGSERVER-Error] Unable to parse source URL " + src + ".")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "URL parse error",
				"reason":  err.Error(),
			})
			return
		}

		if u.Scheme == "file" {
			log.Println("[LOGSERVER-Info] Attempting to download log from " + u.Path + ".")

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
			log.Println("[LOGSERVER-Info] Downloading log from " + u.Path + ".")
			// Todo: retrieve logs from an HTTP server.

			c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
				"message": "URL parse error",
				"reason":  "HTTP protocol not supported",
			})
		} else {
			log.Println("[LOGSERVER-Error] Unsupported source URL " + src + ".")

			c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
				"message": "URL parse error",
				"reason":  "protocol not supported",
			})
		}
	})

	// Handler for DELETE REST API, http://<ip_address>:<port>/api/v1/logs/<name>.
	router.DELETE("/api/v1/logs/:name", func(c *gin.Context) {
		log.Println("[LOGSERVER-Info] In delete handler.")

		fileName := c.Params.ByName("name")
		if fileName == "" {
			log.Println("[LOGSERVER-Error] Log key name was not provided.")

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
			log.Println("[LOGSERVER-Error] Unable to parse source URL " + src + ".")

			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"message": "URL parse error",
				"reason":  err.Error(),
			})
			return
		}

		if u.Scheme == "file" {
			log.Println("[LOGSERVER-Info] Attempting to delete log from " + u.Path + ".")

			// Validate that the log exists.
			//path := u.Path + "/" + fileName
			path := filepath.Join(u.Path, fileName)

			if _, err = os.Stat(path); os.IsNotExist(err) {
				log.Println("[LOGSERVER-Error] Log does not exist.")

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
					log.Println("[LOGSERVER-Error] Unable to unregister log.")
					c.AbortWithStatusJSON(http.StatusNotFound, gin.H{
						"message": "Delete error",
						"reason":  err.Error(),
					})
					return
				}
			}

			// Delete the log.
			if err = deleteLog(fileName); err != nil {
				log.Println("[LOGSERVER-Error] Unable to delete log.")

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
			log.Println("[LOGSERVER-Info] Deleting log from " + u.Path + ".")
			// Todo: retrieve logs from HTTP server.

			c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
				"message": "URL parse error",
				"reason":  "HTTP protocol not supported",
			})
		} else {
			log.Println("[LOGSERVER-Error] Unsupported source URL " + src + ".")

			c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
				"message": "URL parse error",
				"reason":  "protocol not supported",
			})
		}
	})

	// Handler for GET REST API, http://<ip_address>:<port>/api/v1/logs/info.
	router.GET("/api/v1/logs/info", func(c *gin.Context) {
		log.Println("[LOGSERVER-Info] In info handler.")

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
				log.Println("[LOGSERVER-Error] Unable to parse id", timeID, ".")
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
				log.Println("[LOGSERVER-Error] Unable to parse size.gt", sizeLowerBound, ".")
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
				log.Println("[LOGSERVER-Error] Unable to parse size.lt", sizeUpperBound, ".")
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
				log.Println("[LOGSERVER-Error] Unable to parse size", fileSize, ".")
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
			log.Printf("[LOGSERVER-Info] createDateLowerBound = %s", t)
			filter.CreateDateLower, err = time.Parse(time.RFC3339, createDateLowerBound)
			if err != nil {
				log.Println("[LOGSERVER-Error] Unable to parse create_data.gt", createDateLowerBound, ".")
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"message": "Info retrieval error",
					"reason":  err.Error(),
				})
				return
			}
		}
		if createDateUpperBound != "" {
			t, _ := time.Parse(time.RFC3339, createDateUpperBound)
			log.Printf("[LOGSERVER-Info] createDateUpperBound = %s", t)
			filter.CreateDateUpper, err = time.Parse(time.RFC3339, createDateUpperBound)
			if err != nil {
				log.Println("[LOGSERVER-Error] Unable to parse create_data.lt", createDateUpperBound, ".")
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"message": "Info retrieval error",
					"reason":  err.Error(),
				})
				return
			}
		}
		if createDate != "" {
			t, _ := time.Parse(time.RFC3339, createDate)
			log.Printf("[LOGSERVER-Info] createDate = %s", t)
			filter.CreateDateLower, err = time.Parse(time.RFC3339, createDate)
			filter.CreateDateUpper = filter.CreateDateLower
			if err != nil {
				log.Println("[LOGSERVER-Error] Unable to parse create_data", createDate, ".")
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
	})

	// Handler for REST API, http://<ip_address>:<port>/index. Web UI.
	router.LoadHTMLGlob("templates/*")
	router.GET("/index", func(c *gin.Context) {
		dst := viper.GetString("logserver.destination")

		// Retrieve the logs from the configured destination.
		logs, err := getLogs(dst)
		if err != nil {
			c.String(http.StatusBadRequest, fmt.Sprintf("get logs err: %s", err.Error()))
			return
		}

		// Build up a list of log names for the template.
		entries := logs

		c.HTML(http.StatusOK, "index.tmpl", gin.H{
			"title":   "Alticast Xconf Log Server",
			"loglist": entries,
		})
	})

	// Open Cassandra session.
	var session *gocql.Session
	cassandraHosts := viper.GetStringSlice("cassandra.hosts")
	if len(cassandraHosts) == 0 {
		log.Println("[LOGSERVER-Info] No cassandra configuration found. Skipping database registration.")
		gUseCassandra = false
	} else {
		var err error

		// Open a cassandra session.
		session, err = openSession(cassandraHosts)
		if err != nil {
			log.Println("[LOGSERVER-Error]", err)
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
