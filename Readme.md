# Alticast Xconf Log Server

The Alticast Xconf logserver is a simple file server written in the Go Language.
It may be used to upload files to the server and stored to the local file
system. Uploaded files may also be downloaded via the Web UI or a REST API.

## Build Instructions

### Dependencies

1. Ubuntu 18.04 LTS 64-bit platform
2. gcc (required by cgo)
3. Git
4. Go Language tools

### Detail

To build the logserver for the Linux Ubuntu 18.04 LTS 64-bit platform,
follow these instructions:

1. Download the source code from the Github repository.

        $ git clone git@github.com:alticast/rdk-xconf-logserver.git

2. Set the GOPATH to the downloaded source code directory:

        $ cd <project>
        $ export GOPATH=`pwd`

3. Install the Go gin package:

        $ go get -u github.com/gin-gonic/gin

4. Install the Go viper package:

        $ go get -u github.com/spf13/viper

5. Install the Go gocql package:

        $ go get -u github.com/gocql/gocql

6. Build the source:

        $ cd src
        $ go build -o logserver

The executable, *logserver*, will be created.

## Run the Executable

To run the logserver, simply

```
$ cd <project>
$ ./logserver &
```

### Smoke Test

To validate that the server is running correctly, use curl:

```
$ curl -X GET http://localhost:8080/api/v1/ping
```

The JSON message **{"message":"pong"}** will be returned upon success.

## Configuration

The Alticast logserver uses a ***config.yml*** file to configure its behavior.
The configuration file may be located in either the */etc/logserver*,
*/opt/logserver/config*, or *$HOME/.logserver* directory.

If the configuration file is not accessible, then the logserver will use the
following defaults:

* Destination URL: file:///opt/logserver/logs
* Encoding: false
* Server Port: 8080

## Web User Interface

The logserver provides a simple Web UI. Type the following into a browser:

```
http://<server_ip_address>:8080/index
```
Where *<server_ip_address>* is the IP Address for the logserver.

## REST API Examples

### Upload a Log to the Server

To upload a file to the logserver, you can use the following curl command:

```
$ curl -X POST http://localhost:8080/api/v1/logs/upload -F "file=@<file_path>" -H "Content-Type: multipart/form-data"

For example:

$ curl -X POST http://localhost:8080/api/v1/logs/upload -F "file=@/home/msm/tmp/logserverTest_v1.txt" -H "Content-Type: multipart/form-data"
```
### Download a Log from the Server

To download a file from the logserver, you can use the following curl command:

```
$ curl -X GET http://localhost:8080/api/v1/logs/download?name=<file_name>

For example:

$ curl -X GET http://localhost:8080/api/v1/logs/download?name=logserverTest_v1.txt
```

### Delete a Log on the Server

To delete a file from the logserver, you can use the following curl command:

```
$ curl -X DELETE http://localhost:8080/api/v1/logs/<file_name>

For example:

$ curl -X DELETE http://localhost:8080/api/v1/logs/logserverTest_v1.txt
```
