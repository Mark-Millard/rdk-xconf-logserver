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

# Import libraries.
from datetime import timezone
import datetime
import os.path
import random
import shutil
import time

# Function to generate a unique MAC Address.
def generate_mac(separator=False):
    if separator:
        return "%02x:%02x:%02x:%02x:%02x:%02x" % (
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255)
            )
    else:
        return "%02x%02x%02x%02x%02x%02x" % (
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255)
            )

# Function to generate a unique timestamp.
def generate_timestamp() :
    # Get the current date and time.
    dt = datetime.datetime.now()

    # Convert to UTC.
    utc_time = dt.replace(tzinfo = timezone.utc)

    return utc_time

# Main program entry point.
def main():
    # Parse input arguments.
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--num', default=1, help='number of unique files to generate', type=int)
    parser.add_argument('--tdir', default=".", help='temporary working directory for generated logs')
    parser.add_argument('--sleep', default=0, help='sleep (in minutes) between successive uploads', type=int)
    parser.add_argument('--verbosity', help='increase output verbosity', action='store_true')
    args = parser.parse_args()

    # Validate input arguments.
    isdir = os.path.isdir(args.tdir)
    if not isdir:
        print("Temporary working directory does not exist.")
        return

    # Generate file names.
    for i in range(args.num):
        # Delay successive uploads to create files that provide a larger
        # sampling of test data.
        if (args.sleep > 0):
            if (args.verbosity):
                print("    Waiting to upload...")
            time.sleep(args.sleep * 60)

        mac_address = generate_mac()
        utc_dt = generate_timestamp()
        timestamp = utc_dt.strftime ("%m-%d-%y-%I-%M%p")
        
        file_name = ''.join([mac_address.upper(), "_Logs_", timestamp, ".tgz"])

        # Copy template to new file.
        path = ''.join([args.tdir, "/", file_name])
        if (args.verbosity):
            print("Generating file: " + path)
        shutil.copyfile("B827EBEADCAB_Logs_03-31-20-09-55PM.tgz", path)

if __name__ == '__main__':
    main()
