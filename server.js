var express = require('express');
var app = express.createServer();
app.use(express.static(__dirname+'/htdocs'));

app.listen(8080);
console.log('http://localhost:8080/');

var dnode = require('dnode');

var clients = {};
var video_id_by_client_id = {};
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

function Video(firstClient) {
	var clients = firstClient? [firstClient] : [];
	// List of 2-tuples containing the state and the goal time.
	var plan = [[STATE_PLAYING, 0]];
	var planNum = 0;

	this.addClient = function(client) {
		clients.append(client);
	};

	this.setPlan = function(_plan) {
		planNum++;
		plan = _plan;
		setGoal(plan[0].state, plan[0].time);
	};

	function setGoal(goal, time) {
		myPlanNum = planNum;
		for (var i=0; i<clients.length; i++) {
			clients[i].setGoal(goal, time);
		}
	}
}

var server = dnode(function(connection) {
	return {
		register : function(video_id, client, callback) {
			id = makeId();
			client.id = id;
			clients[id] = client;
			if (! video_id) {
				video_id = makeId();
			}
			videos[video_id] = new Video(client);
			callback(id, video_id);
			setTimeout(function() {client.setGoal('paused', 20);}, 1000);
			setTimeout(function() {client.setGoal('playing', 20);}, 5000);
			setTimeout(function() {client.setGoal('paused', 25);}, 9000);
			setTimeout(function() {client.setGoal('playing', 25);}, 12000);
			setTimeout(function() {client.setGoal('playing', 10);}, 15000);
		},
		stateChange : function(id, state) {
			console.log("stateChange", name, state);
		},
		// reportEvent : function(id, event_type, status) {
		// 	console.log("reportEvent", id, event_type, status);
		// },
		ping : function(callback) {
			callback();
		},
	};
});

server.listen(app);
