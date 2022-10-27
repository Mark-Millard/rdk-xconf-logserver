// COPYRIGHT_BEGIN
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

	"errors"
	"io/ioutil"
	"net/url"
	"os"
	"path/filepath"

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
