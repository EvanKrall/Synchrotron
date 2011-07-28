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

function updategit() {
	blueecho "Updating to the latest version of Synchrotron"
	git pull --ff-only
}

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

function start() {
	blueecho "Starting Synchrotron..."
	if [[ -e server.pid ]]
		then
		redecho "Error: Synchrotron is already running."
		exit 1
	fi
	node server.js &
	sleep 3
	jobs -p %% > server.pid
	disown %%
}

case "$1" in
	"start") updategit; start;;
	"stop") stop;;
	"restart") updategit; stop; start;;
esac

trap "" EXIT
greenecho Success