// COPYRIGHT_BEGIN
// Copyright 2022 Auteur Art & Technology, LLC.
// COPYRIGHT_END

// Declare package.
package logger

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/spf13/viper"
)

// Initialize logger module.
func init() {
	// Set the default file for capturing Xconf Server logs.
	viper.SetDefault("logserver.log.enable", false)
	viper.SetDefault("logserver.log.file", "/var/log/logserver.log")
}

// GXconfLogger is the singleton instance of the Xconf Server logger.
var GXconfLogger *XconfLog

// XconfLog is a convenience class for Xconf Server logging.
type XconfLog struct {
	// The logger's buffer.
	mBuf bytes.Buffer
	// The logger.
	mLogger *log.Logger
	// File handle if also logging to a file.
	mFileHandle  *os.File
	mFileEnabled bool
	// Log levels.
	mDebug bool
	mInfo  bool
	mWarn  bool
	mError bool
}

// NewXconfLog is a default constructor that will allocate a singleton
// instance of the Xconf Server logger.
//
// Return
//   A reference to the global Xconf logger is returned.
func NewXconfLog() *XconfLog {
	if GXconfLogger == nil {
		p := new(XconfLog)
		//p.mLogger = log.New(&p.mBuf, "[XCONFLOGSERVER] ", log.Ldate|log.Ltime|log.Lshortfile)
		p.mLogger = log.New(&p.mBuf, "[XCONFLOGSERVER] ", log.Ldate|log.Ltime)
		p.mFileHandle = nil
		p.mFileEnabled = false
		p.mDebug = false
		p.mInfo = false
		p.mWarn = false
		p.mError = true
		GXconfLogger = p
	}

	return GXconfLogger
}

// Log may be used to log a generic string with the logger. The message is written
// into the XconfLog buffer.
//
// Parameters
//   msg - The message to log.
func (l *XconfLog) Log(msg string) {
	l.mLogger.Print(msg)
}

// Debug may be used to log informational messages with the logger. The message is written
// into the XconfLog buffer. It is commonly used to place trace statements into the log.
//
// Parameters
//   msg - The message to log.
func (l *XconfLog) Debug(msg string) {
	if !l.mDebug {
		return
	}

	str := "DEBUG: " + msg
	l.mLogger.Print(str)
}

// Info may be used to log informational messages with the logger. The message is written
// into the XconfLog buffer.
//
// Parameters
//   msg - The message to log.
func (l *XconfLog) Info(msg string) {
	if !l.mInfo {
		return
	}

	str := "INFO: " + msg
	l.mLogger.Print(str)
}

// Warn may be used to log warning messages with the logger. The message is written
// into the XconfLog buffer.
//
// Parameters
//   msg - The message to log.
func (l *XconfLog) Warn(msg string) {
	if !l.mWarn {
		return
	}

	str := "WARN: " + msg
	l.mLogger.Print(str)
}

// Error may be used to log error messages with the logger. The message is written
// into the XconfLog buffer.
//
// Parameters
//   msg - The message to log.
func (l *XconfLog) Error(msg string) {
	if !l.mError {
		return
	}

	str := "ERROR: " + msg
	l.mLogger.Print(str)
}

// Flush will reset the XconfLog buffer to be empty.
func (l *XconfLog) Flush() {
	l.mBuf.Reset()
}

// XconfLogDebug may be used to log informational messages with the
// global XCONF Server logger.
//
// Parameters
//   msg - The message to log.
//   print - If true, then print the full log to the screen.
func XconfLogDebug(msg string, print bool) {
	var logger = NewXconfLog()
	logger.Flush()
	logger.Debug(msg)

	if print && logger.mDebug {
		fmt.Print(logger.mBuf.String())
	}
}

// XconfLogInfo may be used to log informational messages with the
// global XCONF Server logger.
//
// Parameters
//   msg - The message to log.
//   print - If true, then print the full log to the screen.
func XconfLogInfo(msg string, print bool) {
	var logger = NewXconfLog()
	logger.Flush()
	logger.Info(msg)

	if print && logger.mInfo {
		fmt.Print(logger.mBuf.String())
	}
}

// XconfLogWarn may be used to log warning messages with the
// global Xconf Server logger.
//
// Parameters
//   msg - The message to log.
//   print - If true, then print the full log to the screen.
func XconfLogWarn(msg string, print bool) {
	var logger = NewXconfLog()
	logger.Flush()
	logger.Warn(msg)

	if print && logger.mWarn {
		fmt.Print(logger.mBuf.String())
	}
}

// XconfLogError may be used to log informational messages with the
// global XCONF Server logger.
//
// Parameters
//   msg - The message to log.
//   print - If true, then print the full log to the screen.
func XconfLogError(msg string, print bool) {
	var logger = NewXconfLog()
	logger.Flush()
	logger.Error(msg)

	if print && logger.mError {
		fmt.Print(logger.mBuf.String())
	}
}

// EnableFileOutput will enable writing to a file. The file is specified
// as a configuration parameter.
//
// Parameters
//   enable - If true, then enable output to the file, If false, then disable
//            output to the file.
func (l *XconfLog) EnableFileOutput(enable bool) {
	// Retrieve name of file we will be logging to.
	logFile := viper.GetString("logserver.log.file")

	// Todo: add a filename parameter to this function to override the default
	// obtained from the viper configuration.

	if enable {
		// Check if logging to file is already enabled.
		if GXconfLogger.mFileEnabled {
			return
		}

		// Log to console and file.
		f, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			//GXconfLogger.mLogger.Fatalf("Error opening file: %v", err)
			msg := fmt.Sprintf("Error opening file: %v\n", err)
			XconfLogWarn(msg, true)
			return
		}
		wrt := io.MultiWriter(&l.mBuf, f)

		GXconfLogger.mLogger.SetOutput(wrt)
		GXconfLogger.mFileHandle = f
		GXconfLogger.mFileEnabled = true

		//defer f.Close()
	} else {
		// Check if logging to file is already disabled.
		if !GXconfLogger.mFileEnabled {
			return
		}

		err := GXconfLogger.mFileHandle.Close()
		if err != nil {
			GXconfLogger.mLogger.Printf("Error closing file: %v", err)
		}
		GXconfLogger.mFileHandle = nil

		// Just log to the buffer.
		GXconfLogger.mLogger.SetOutput(&l.mBuf)
		GXconfLogger.mFileEnabled = false
	}
}

// SetLogLevel will configure which type of messages will be displayed
// during runtime.
//
// Parameters
//   debug - If true, then enable DEBUG messages, If false, then disable
//           debug output messages.
//   info - If true, then enable INFO messages, If false, then disable
//          info output messages.
//   warn - If true, then enable WARN messages, If false, then disable
//          warn output messages.
//   err - If true, then enable ERROR messages, If false, then disable
//         error output messages.
func (l *XconfLog) SetLogLevel(debug bool, info bool, warn bool, err bool) {
	l.mDebug = debug
	l.mInfo = info
	l.mWarn = warn
	l.mError = err
}
