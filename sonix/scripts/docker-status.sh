#!/bin/bash

# check if we are running in WSL2
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null ; then
    echo "Running in WSL2 environment"
    # check if docker-compose is in the PATH
    if ! command -v docker-compose &> /dev/null ; then
        echo "The command `docker-compose` is not in the PATH. Please run Docker Desktop."
        exit 1
    fi

    docker-compose ps
else
    echo "Not running in WSL2 environment."
    # check if docker-compose is in the PATH
    if ! command -v docker-compose &> /dev/null ; then
        echo "The command `docker-compose` is not in the PATH. Please install it."
        exit 1
    fi

    docker-compose ps
fi