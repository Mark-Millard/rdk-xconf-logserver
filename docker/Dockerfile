# Download base image Ubuntu 18.04
FROM ubuntu:18.04

LABEL Maintaner="Mark Millard - mmillard@alticast.com"

# Set the working directory for build dependency commands.
WORKDIR /tmp

# Install the build environment dependencies.
RUN apt-get update && apt-get install -y \
    build-essential wget git iputils-ping iproute2 && \
    rm -rf /var/lib/apt/lists/*

RUN wget https://dl.google.com/go/go1.16.linux-amd64.tar.gz && \
    tar -xf go1.16.linux-amd64.tar.gz && \
    mv go /usr/local

# Set the working directory for log server build.
WORKDIR /usr/src/xconf-logserver-build

ENV PATH /usr/local/go/bin:$PATH

# Install the Go dependencies and build the logserver.
RUN git clone https://github.com/alticast/rdk-xconf-logserver.git && \
    cd rdk-xconf-logserver && \
    git checkout module-refactor && \
    go build -o logserver ./...

# Install the log server and configure it.
RUN mkdir -p /opt/logserver/logs && \
    mkdir -p /opt/logserver/templates && \
    mkdir -p /etc/logserver && \
    cp rdk-xconf-logserver/logserver /usr/bin/logserver && \
    cp rdk-xconf-logserver/src/config/config.yml /etc/logserver && \
    cp -r rdk-xconf-logserver/src/templates/* /opt/logserver/templates

# Set the working directory for Cassandra DB build.
WORKDIR /usr/src/cassandra

# Install Cassandra and configure it.
RUN mkdir -p /opt/logserver/cassandra

# Start Cassandra.

# Set the working directory where the log server will run.
WORKDIR /opt/logserver

# Execute the log server.
CMD /usr/bin/logserver
