#!/bin/bash

set -e

git pull --ff-only

if [[ -e server.pid ]]
then
	echo "Synchrotron is already running."
	exit 1
fi

node server.js &
jobs -p %% > server.pid
disown %%

