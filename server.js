var express = require('express');
var app = express.createServer();
app.use(express.static(__dirname+'/htdocs'));

app.listen(8080);
console.log('http://localhost:8080/');

var dnode = require('dnode');

var clients = {};
var video_by_client_id = {};
var videos = {};

function makeId() {
	// Generate a UUID.
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

var STATE_NOT_LOADING = 'not loading';
var STATE_LOADING = 'loading';
var STATE_PAUSED = 'paused';
var STATE_PLAYING = 'playing';

var THRESHOLD = 5; // The maximum timedelta in seconds that we can tolerate between where we are and where the server is.

function Video() {
	var myClients = [];
	// List of 2-tuples containing the state and the goal time.
	var plan = [[STATE_PLAYING, 0]];

	this.addClient = function(client) {
		myClients.push(client);
	};

	this.setPlan = function(_plan) {
		plan = _plan;
		if (plan.length > 0) {
			setGoal(plan[0].state, plan[0].time);
		}
	};

	function setGoal(goal, time) {
		console.log('setGoal', goal, time);
		for (var i=0; i<myClients.length; i++) {
			console.log('Setting goal for client ' + myClients[i].id + ' ' + goal + ' ' + time);
			myClients[i].setGoal(goal, time);
		}
	}

	this.clientStateChanged = function(client_id, state) {
		clients[client_id].currentState = state;
		for (var i=0; i<myClients.length; i++) {
			if (myClients[i].currentState !== state) {
				return;
			}
		}
		// All of the clients are in the same state.
		console.log("All clients are in state "+ state);
		this.setPlan(plan.slice(1));
	}
}

var server = dnode(function(connection) {
	return {
		register : function(video_id, client, callback) {
			id = makeId();
			client.id = id;
			clients[id] = client;
			if (video_id) {
				video_id = video_id.replace(/^#/, '');
			} else {
				video_id = makeId();
			}
			videos[video_id] = videos[video_id] || new Video();
			videos[video_id].addClient(client);
			video_by_client_id[id] = videos[video_id];
			callback(id, video_id);
		},
		stateChange : function(id, state) {
			console.log("stateChange", id, state);
			video_by_client_id[id].clientStateChanged(id, state);
		},
		// reportEvent : function(id, event_type, status) {
		// 	console.log("reportEvent", id, event_type, status);
		// },
		ping : function(callback) {
			callback();
		},
		pause : function(client_id, time) {
			console.log('pause', client_id, time);
			video_by_client_id[client_id].setPlan([{state: STATE_PAUSED, time: time}]);
		},
		play : function(client_id, time) {
			console.log('play', client_id, time);
			video_by_client_id[client_id].setPlan([
				{state: STATE_PAUSED, time: time},
				{state: STATE_PLAYING, time: time}
			]);
		}
	};
});

server.listen(app);
