This file contains information on how to build and run the Xconf Log Server components using Docker.

# Build Cassandra DB Docker Image

Use the following command line to build the Cassandra DB Docker image:

```
$ docker build -f Dockerfile.cassandra --no-cache --network=host --rm -t dbserver:v0.1.0 .
```

To check whether the image was created successfully, use:

```
$ docker image ls -a
```

You should see a REPOSITORY image listing for "dbserver" with the build TAG "v0.1.0".

# Build Xconf Log Server Docker Image

Use the following command line to build the Xconf Log Server Docker image:

```
$ docker build --no-cache --network=host --rm -t logserver:v0.1.0 .
```

To check whether the image was created successfully, use:

```
$ docker image ls -a
```

You should see a REPOSITORY image listing for "logserver" with the build TAG "v0.1.0".

# Log Server Configuration

This build uses the default configuration, config.yaml. Logs will be stored locally under "/opt/logserver/logs".

# Run Docker Container

To run the Docker container, and thus the Xconf Log Server, use:

```
$ docker run --network xconf-logserver-network -p 8080:8080 -v /opt/logserver/logs:/opt/logserver/logs -t -i logserver:v0.1.0
```

The __xconf-logserver-network__ is a Docker network configured to work with the
Cassandra DB Docker container (see XXX) that manages the log server's meta-data.
If the log server is configured to use a different Cassandra server, then the
__--network__ option may be dropped.

The logserver Docker port __8080__ is mapped to the Docker host platform
running the log server. If the log server is configured to use a different port
(see config.yml), then this port should be modified appropriately to map the
correct value.

The logserver Docker directory, __/opt/logserver/logs__ is mapped to the Docker
host platform directory __/opt/logserver/logs__. If the confil.yml file
specifies a different directory, then this volume specification should be
modified appropriately to map the correct location.

To run a bash shell against this image, use:

```
docker run --network xconf-logserver-network -p 8080:8080 -v /opt/logserver/logs:/opt/logserver/logs -t -i logserver:v0.1.0 bash
```
