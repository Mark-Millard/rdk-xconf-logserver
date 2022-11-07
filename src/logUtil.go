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

	"bytes"
	b64 "encoding/base64"
	"errors"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/url"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

// Create a directory if it doesn't already exist.
func createDirectory(dirName string) bool {
	src, err := os.Stat(dirName)

	if os.IsNotExist(err) {
		errDir := os.MkdirAll(dirName, 0755)
		if errDir != nil {
			//log.Println("[LOGSERVER-Error] Unable to create directory " + dirName + ".")
			logger.XconfLogError("Unable to create directory "+dirName+".", true)
			return false
		}
		return true
	}

	if src.Mode().IsRegular() {
		//log.Println("[LOGSERVER-Error] " + dirName + " already exists as a file.")
		logger.XconfLogError(dirName+" already exists as a file.", true)
		return false
	}

	// Directory already exists, ok to return true.
	return true
}

// Save the log to a local directory.
func saveLogToDirectory(data []byte, dirName string, fileName string) error {
	//log.Println("[LOGSERVER-Info] Saving log to " + dirName + "/" + fileName + ".")
	logger.XconfLogDebug("Saving log to "+dirName+"/"+fileName+".", true)

	// Make sure that the path exists and logs can be stored there.
	status := createDirectory(dirName)
	if !status {
		//log.Println("[LOGSERVER-Error] Unable to save log to " + dirName + ".")
		logger.XconfLogError("Unable to save log to "+dirName+".", true)
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
	//log.Println("[LOGSERVER-Info] Saving log to " + dst + ".")
	logger.XconfLogDebug("Saving log to "+dst+".", true)

	// The expectation is that the desination is specified as a formal URL.
	u, err := url.Parse(dst)
	if err != nil {
		//log.Println("[LOGSERVER-Error] Unable to parse destination URL " + dst + ".")
		logger.XconfLogError("Unable to parse destination URL "+dst+".", true)
		return err
	}

	if u.Scheme == "file" {
		if err = saveLogToDirectory(data, u.Path, fileName); err != nil {
			//log.Println("[LOGSERVER-Error] Unable to save log to " + u.Path + ".")
			logger.XconfLogError("Unable to save log to "+u.Path+".", true)
			return err
		}
	} else if u.Scheme == "http" {
		//log.Println("[LOGSERVER-Info] Uploading log to " + u.Path + ".")
		logger.XconfLogInfo("Uploading log to "+u.Path+".", true)
		// Todo: upload file to HTTP server.
	} else {
		//log.Println("[LOGSERVER-Error] Unsupported destination URL " + dst + ".")
		logger.XconfLogError("Unsupported destination URL "+dst+".", true)
		return errors.New("unable to upload file")
	}

	return nil
}

// Delete the specified file.
func deleteLog(fileName string) error {
	// Retrieve destination from logserver configuration.
	dst := viper.GetString("logserver.destination")
	//log.Println("[LOGSERVER-Info] Deleting log from " + dst + ".")
	logger.XconfLogDebug("Deleting log from "+dst+".", true)

	// The expectation is that the desination is specified as a formal URL.
	u, err := url.Parse(dst)
	if err != nil {
		//log.Println("[LOGSERVER-Error] Unable to parse destination URL " + dst + ".")
		logger.XconfLogError("Unable to parse destination URL "+dst+".", true)
		return err
	}

	if u.Scheme == "file" {
		fullPath := filepath.Join(u.Path, fileName)

		if err = os.Remove(fullPath); err != nil {
			//log.Println("[LOGSERVER-Error] Unable to delete log from " + u.Path + ".")
			logger.XconfLogError("Unable to delete log from "+u.Path+".", true)
			return err
		}
	} else if u.Scheme == "http" {
		//log.Println("[LOGSERVER-Info] Uploading log to " + u.Path + ".")
		logger.XconfLogInfo("Uploading log to "+u.Path+".", true)
		// Todo: upload file to HTTP server.
	} else {
		//log.Println("[LOGSERVER-Error] Unsupported destination URL " + dst + ".")
		logger.XconfLogError("Unsupported destination URL "+dst+".", true)
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
	//log.Println("[LOGSERVER-Info] Reading logs from " + src + ".")
	logger.XconfLogDebug("Retrieving logs from "+src+".", true)

	// The expectation is that the source is specified as a formal URL.
	u, err := url.Parse(src)
	if err != nil {
		//log.Println("[LOGSERVER-Error] Unable to parse source URL " + src + ".")
		logger.XconfLogError("Unable to parse source URL "+src+".", true)
		return nil, err
	}

	if u.Scheme == "file" {
		// Logs are stored locally on the server.
		files, err := ioutil.ReadDir(u.Path)
		if err != nil {
			//log.Println("[LOGSERVER-Error] Unable to read directory " + u.Path + ".")
			logger.XconfLogError("Unable to read directory "+u.Path+".", true)
			return nil, err
		}

		logs = []LogDownloadEntry{}

		for _, f := range files {
			//log.Println("[LOGSERVER-Info] Found log file " + f.Name() + ".")
			logger.XconfLogDebug("Found log file "+f.Name()+".", true)
			entry := LogDownloadEntry{Name: f.Name(), Path: u.Path, File: f}
			logs = append(logs, entry)
		}

	} else if u.Scheme == "http" {
		//log.Println("[LOGSERVER-Info] Retrieving logs from " + u.Path + ".")
		logger.XconfLogInfo("Retrieving logs from "+u.Path+".", true)
		// Todo: retrieve logs from HTTP server.
	} else {
		//log.Println("[LOGSERVER-Error] Unsupported source URL " + src + ".")
		logger.XconfLogError("Unsupported source URL "+src+".", true)
		return nil, errors.New("unable to upload file")
	}

	return logs, nil
}

// Encode the file as base64 string.
func encode(buf *bytes.Buffer) string {
	sEnc := b64.StdEncoding.EncodeToString(buf.Bytes())
	return sEnc
}
