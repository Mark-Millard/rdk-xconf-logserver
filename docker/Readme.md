This file contains information on how to build and run the Alticast Xconf Log Server using Docker.

# Build Docker Image

Use the following command line to build the Xconf Log Server Docker image:

```
$ docker build --no-cache --build-arg user=<user> --build-arg password=<password> --rm -t logserver:v0.1.0 .
```

Where "__<user>__" is the user name for the private Bitbucket repository where the log server source will be retrieved, and "__<password>__" is the user's password.

```
__Note__: that this is a temporary solution until the code is pushed to a public repo on Github.
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
$ docker run -t -i logserver:v0.1.0
```

To run a bash shell against this image, use:

```
$ docker run -t -i logserver:v0.1.0 bash
```
