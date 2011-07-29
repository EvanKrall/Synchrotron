var express = require('express');
var app = express.createServer();
app.use(express.static(__dirname+'/htdocs'));

app.listen(8080);
console.log('http://localhost:8080/');

var dnode = require('dnode');

var clients = {};
var videos = {};

function makeId() {
	// Generate a UUID.
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}


function Video(client) {
	this.clients = [client];
}

var server = dnode({
	register : function(video_id, client, callback) {
		id = makeId();
		client.id = id;
		clients[id] = client;
		if (! video_id) {
			video_id = makeId();
			videos[video_id] = new Video(client);
		}
		callback(id, video_id);
	},
	ping : function(id, status) {
		console.log("Ping", name, status);
	},
	reportEvent : function(id, event) {
		console.log("Event", name, event);
	}
});

server.listen(app);
