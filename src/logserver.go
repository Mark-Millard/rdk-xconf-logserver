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
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

type LogUploadEntry struct {
	name  string // The name of the source (i.e. author)
	email string // An email address for ths source
	data  string // The encoded base64 contents of the file to upload
}

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
			fmt.Println("[LOGSERVER] Unable to create directory " + dirName + ".")
			return false
		}
		return true
	}

	if src.Mode().IsRegular() {
		fmt.Println("[LOGSERVER] " + dirName + " already exists as a file.")
		return false
	}

	// Directory already exists, ok to return true.
	return true
}

// Save the log to a local directory.
func saveLogToDirectory(data []byte, dirName string, fileName string) error {
	fmt.Println("[LOGSERVER] Saving log to " + dirName + "/" + fileName + ".")

	// Make sure that the path exists and logs can be stored there.
	status := createDirectory(dirName)
	if !status {
		fmt.Println("[LOGSERVER] Unable to save log to " + dirName + ".")
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
	dst := viper.GetString("Destination")
	fmt.Println("[LOGSERVER] Saving log to " + dst + ".")

	// The expectation is that the desination is specified as a formal URL.
	u, err := url.Parse(dst)
	if err != nil {
		fmt.Println("[LOGSERVER] Unable to parse destination URL " + dst + ".")
		return err
	}

	if u.Scheme == "file" {
		if err = saveLogToDirectory(data, u.Path, fileName); err != nil {
			fmt.Println("[LOGSERVER] Unable to save log to " + u.Path + ".")
			return errors.New("unable to upload file")
		}
	} else if u.Scheme == "http" {
		fmt.Println("[LOGSERVER] Uploading log to " + u.Path + ".")
		// Todo: upload file to HTTP server.
	} else {
		fmt.Println("[LOGSERVER] Unsupported destination URL " + dst + ".")
		return errors.New("unable to upload file")
	}

	return nil
}

// Upload the file.
func upload(context *gin.Context, file *multipart.FileHeader) error {
	/*
		filename := filepath.Base(file.Filename)
		if err := context.SaveUploadedFile(file, filename); err != nil {
			context.String(http.StatusBadRequest, fmt.Sprintf("upload file err: %s", err.Error()))
			return err
		}
	*/
	src, err := file.Open()
	if err != nil {
		context.String(http.StatusBadRequest, fmt.Sprintf("upload file err: %s", err.Error()))
		return err
	}
	defer src.Close()

	// Read file into buffer.
	buf := bytes.NewBuffer(nil)
	if _, err = io.Copy(buf, src); err != nil {
		context.String(http.StatusBadRequest, fmt.Sprintf("upload file err: %s", err.Error()))
		return err
	}

	// Encode file into base64.
	useEncode := viper.GetBool("encode")
	var content []byte
	if useEncode {
		sEnc := encode(buf)
		if sEnc == "" {
			context.String(http.StatusBadRequest, fmt.Sprintf("upload file err: %s", "unable to encode file"))
			return errors.New("unable to encode file")
		}
		content = []byte(sEnc)
	} else {
		content = buf.Bytes()
	}

	// Send encoded buffer to output URL (specified in config file)
	filename := filepath.Base(file.Filename)
	if err = saveLog(content, filename); err != nil {
		context.String(http.StatusBadRequest, fmt.Sprintf("upload file err: %s", err.Error()))
		return errors.New("unable to save file")
	}

	return nil
}

type LogDownloadEntry struct {
	Name string      // The name of the log.
	File os.FileInfo // A reference to the downloaded file.
}

// Retrieve the logs from the server.
func getLogs(src string) ([]LogDownloadEntry, error) {
	var logs []LogDownloadEntry
	fmt.Println("[LOGSERVER] Reading logs from " + src + ".")

	// The expectation is that the source is specified as a formal URL.
	u, err := url.Parse(src)
	if err != nil {
		fmt.Println("[LOGSERVER] Unable to parse source URL " + src + ".")
		return nil, err
	}

	if u.Scheme == "file" {
		// Logs are stored locally on the server.
		files, err := ioutil.ReadDir(u.Path)
		if err != nil {
			fmt.Println("[LOGSERVER] Unable to read directory " + u.Path + ".")
			return nil, errors.New("unable to read directory")
		}

		logs = []LogDownloadEntry{}

		for _, f := range files {
			fmt.Println("[LOGSERVER] Found log file " + f.Name() + ".")
			entry := LogDownloadEntry{Name: f.Name(), File: f}
			logs = append(logs, entry)
		}

	} else if u.Scheme == "http" {
		fmt.Println("[LOGSERVER] Retrieving logs from " + u.Path + ".")
		// Todo: retrieve logs from HTTP server.
	} else {
		fmt.Println("[LOGSERVER] Unsupported source URL " + src + ".")
		return nil, errors.New("unable to upload file")
	}

	return logs, nil
}

func main() {
	// Initialize configuration.
	// Set default to save logs to the local file system.
	viper.SetDefault("destination", "file:///var/log/logserver")
	viper.SetDefault("encode", false)
	viper.SetDefault("port", 8080)

	viper.SetConfigName("config")
	viper.AddConfigPath("/etc/logserver")
	viper.AddConfigPath("$HOME/.logserver")
	viper.ReadInConfig()

	// Todo: configure logging.

	// Initialize gin HTTP server.
	router := gin.Default()

	// Set a lower memory limit for multipart forms (default is 32 MiB)
	//router.MaxMultipartMemory = 8 << 20 // 8 MiB
	//router.Static("/", "./public")

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	router.POST("/upload", func(c *gin.Context) {
		name := c.PostForm("name")
		email := c.PostForm("email")

		// Retrieve the file from the field "file".
		file, err := c.FormFile("file")
		if err != nil {
			c.String(http.StatusBadRequest, fmt.Sprintf("get form err: %s", err.Error()))
			return
		}

		// Upload the file.
		err = upload(c, file)
		if err != nil {
			return
		}

		c.String(http.StatusOK, fmt.Sprintf("File %s uploaded successfully with fields name=%s and email=%s.", file.Filename, name, email))
	})

	router.LoadHTMLGlob("templates/*")
	router.GET("/index", func(c *gin.Context) {
		dst := viper.GetString("destination")

		// Retrieve the logs from the configured destination.
		logs, err := getLogs(dst)
		if err != nil {
			c.String(http.StatusBadRequest, fmt.Sprintf("get logs err: %s", err.Error()))
			return
		}

		// Build up a list of log names for the template.
		entries := []string{}
		for _, f := range logs {
			entry := dst + "/" + f.Name
			entries = append(entries, entry)
		}

		c.HTML(http.StatusOK, "index.tmpl", gin.H{
			"title":   "Alticast Log Server",
			"loglist": entries,
		})
	})

	// Extract port from viper configuration.
	port := ":" + viper.GetString("port")
	router.Run(port)
}
