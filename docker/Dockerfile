# Download base image Ubuntu 16.04
FROM ubuntu:18.04

LABEL Maintaner="Mark Millard - mmillard@alticast.com"

# Set the working directory for build dependency commands.
WORKDIR /tmp

# Install the build environment dependencies.
RUN apt-get update && apt-get install -y \
    build-essential wget git && \
    rm -rf /var/lib/apt/lists/*

RUN wget https://dl.google.com/go/go1.14.linux-amd64.tar.gz && \
    tar -xf go1.14.linux-amd64.tar.gz && \
    mv go /usr/local

# Set the working directory for log server build.
WORKDIR /usr/src/xconf-logserver-build

ENV GOPATH /usr/src/xconf-logserver-build/xconf-logserver
ENV GOROOT /usr/local/go
ENV PATH $GOPATH/bin:$GOROOT/bin:$PATH

# Install the Go dependencies and build the logserver.
ARG user
ARG password
RUN git clone https://$user:$password@bitbucket.org/charter-rms/xconf-logserver.git && \
    cd xconf-logserver && \
    git checkout cassandra && \
    go get -u github.com/gin-gonic/gin && \
    go get -u github.com/spf13/viper && \
    go get -u github.com/gocql/gocql && \
    cd src && \
    go build -o logserver

# Install the log server and configure it.
RUN mkdir -p /opt/logserver/logs && \
    mkdir -p /opt/logserver/templates && \
    mkdir -p /etc/logserver && \
    cp $GOPATH/src/logserver /usr/bin/logserver && \
    cp $GOPATH/src/config/config.yml /etc/logserver && \
    cp $GOPATH/src/templates/* /opt/logserver/templates

# Set the working directory for Cassandra DB build.
WORKDIR /usr/src/cassandra

# Install Cassandra and configure it.
RUN mkdir -p /opt/logserver/cassandra

# Start Cassandra.

# Set the working directory where the log server will run.
WORKDIR /opt/logserver

# Execute the log server.
CMD /usr/bin/logserver
