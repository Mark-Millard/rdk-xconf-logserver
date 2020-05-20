# COPYRIGHT_BEGIN
# Copyright 2020 Alticast Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http:#www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# COPYRIGHT_END

# Script Dependencies
#   To use this script, you will need to install the 'requests' module:
#       pip install requests

# Import libraries.
import os.path
import os
import requests

# Global verbosity flag.
verbose = False

# Retrieve the list of logs for the specified directory.
def get_logs(dir):
    global verbose
    logs = []

    for file in os.listdir(dir):
        if file.endswith(".tgz"):
            path =  os.path.join(dir, file)
            if (verbose):
                print("INFO: Found log: " + path)
            logs.append(path)

    return logs

# Upload log file to specified host.
def upload_log(host, port, file):
    global verbose

    # url = "http://{{ip_address}}:8080/api/{{version}}/logs/upload"
    url = ''.join(["http://", host, ":", port, "/api/v1/logs/upload"])
    if (verbose):
        print("INFO: Log server URL: ", url)

    payload = {'description': 'Xconf Client Log File',
               'contact': 'mmillard@alticast.com'}
    files = [
        ('filename', open(file,'rb'))
    ]
    # headers = {
    #    'Content-Type': 'multipart/form-data'
    #}
    #response = requests.request("POST", url, headers = headers, data = payload, files = files)

    response = requests.request("POST", url, data = payload, files = files)

    if (verbose):
        print(response.text.encode('utf8'))

# Main program entry point.
def main():
    # Parse input arguments.
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default="192.168.1.26", help='IP address for log server host')
    parser.add_argument('--port', default="8080", help='port for log server host')
    parser.add_argument('--src', default=".", help='source directory for locating logs')
    parser.add_argument('--verbosity', help='increase output verbosity', action='store_true')
    args = parser.parse_args()

    # Validate input arguments.
    isdir = os.path.isdir(args.src)
    if not isdir:
        print("ERROR: Source directory does not exist.")
        return

    global verbose
    verbose = args.verbosity

    if (verbose):
        print("INFO: Log Server Host: " + args.host + ":" + args.port)

    # Retrieve log files.
    logs = get_logs(args.src)

    # Upload log files to the server.
    for next in logs:
        if (verbose):
            print("INFO: Uploading log: " + next)
        upload_log(args.host, args.port, next)

if __name__ == '__main__':
    main()
