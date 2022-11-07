# Xconf Log Server

The Xconf logserver is a simple file server written in the Go Language.
It may be used to upload files to the server and stored to the local file
system. Uploaded files may also be downloaded via the Web UI or a REST API.

## Build Instructions

The preferred way to build the Xconf Log Server is to use Docker. Instructions
for this appraoch may be found on the [Docker Build Instructions](https://github.com/Mark-Millard/rdk-xconf-logserver/wiki/Docker-Build-Instructions) project
wiki page.

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

2. Do NOT set GOPATH. Setting GOPATH will conflict with using go modules (as defined by the _go.mod_ and _go.sum_ files).

3. There is no need to explicitly install go library dependencies. They are handled by the go modules files.

6. Build the source:

        $ go build -o logserver ./...

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

The logserver uses a ***config.yml*** file to configure its behavior.
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
$ curl --location -g --request POST 'http://localhost:8080/api/v1/logs/upload' --header 'Content-Type: multipart/form-data' --form 'filename=@"<file_name>"' --form 'description="<description>"' --form 'contact="<email_address>"'

For example:

$ curl --location -g --request POST 'http://localhost:8080/api/v1/logs/upload' --header 'Content-Type: multipart/form-data' --form 'filename=@"./BACDDEADBEEF_Logs_05-19-20-04-13PM.tgz"' --form 'description="Xconf Log Files Package"' --form 'contact="mark.s.millard@gmail.com.com"'
```

### Download a Log from the Server

To download a file from the logserver, you can use the following curl command:

```
$ curl --location -g --request GET 'http://localhost:8080/api/v1/logs/download?name=<file_name>' --output <local_file_name>

For example:

$ curl --location -g --request GET 'http://localhost:8080/api/v1/logs/download?name=BACDAEBE728B_Logs_04-12-20-06-35PM.tgz' --output BACDAEBE728B_Logs_04-12-20-06-35PM.tgz
```

### Delete a Log on the Server

To delete a file from the logserver, you can use the following curl command:

```
$ curl --location -g --request DELETE 'http://localhost:8080/api/v1/logs/<file_name>' --data-raw ''

For example:

$ curl --location -g --request DELETE 'http://localhost:8080/api/v1/logs/BACDAEBE728B_Logs_04-12-20-06-35PM.tgz' --data-raw ''
```

### Get Information about the Log

To retrieve information about the log on the logserver, you can use the
following curl command:

```
curl --location -g --request GET 'http://localhost:8080/api/v1/logs/info?file_name=<file_name>'

For example:

curl --location -g --request GET 'http://localhost:8080/api/v1/logs/info?file_name=BACDDEADBEEF_Logs_05-19-20-04-13PM.tgz'
```
