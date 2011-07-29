#!/bin/bash
set -e # Exit on errors.

function redecho() {
	echo $'\e[1;31m'"$@"$'\e[0m'
}

function greenecho() {
	echo $'\e[1;32m'"$@"$'\e[0m'
}

function blueecho() {
	echo $'\e[1;34m'"$@"$'\e[0m'
}

trap "redecho Failure" EXIT

function stop() {
	blueecho "Stopping Synchrotron..."
	if [[ -e server.pid ]]
	then
		kill "$(< server.pid)" || true
		rm server.pid
	else
		echo "Synchrotron not running."
	fi
}

function checkrunning() {
	if [[ -e server.pid ]]
	then
		redecho "Error: Synchrotron is already running."
		exit 1
	fi
}


function runserver() (
	checkrunning
	bash <<-END
		echo "\$\$" > server.pid
		node server.js
		rm server.pid
	END
)

function start() {
	checkrunning
	blueecho "Starting Synchrotron..."
	runserver &
	sleep 1
	jobs %% >/dev/null # Check that our background job is still running.
}

function debug() {
	runserver
}

case "$1" in
	"start") checkrunning; start;;
	"stop") stop;;
	"restart") stop; start;;
	"debug") checkrunning; debug;;
	*) redecho "Invalid command $1"; exit 1;;
esac

trap "" EXIT
greenecho Success