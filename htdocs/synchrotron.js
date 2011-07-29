$(document).ready(function() {
	showStatus("Connecting to Synchrotron");

	DNode.connect(function (remote) {
		showStatus("Connected. Registering with Synchrotron");
		remote.register(window.location.hash, new Client(), function(id) {
			showStatus("Registered with id " + id);
		})
	});

	function Client() {
		this.log = log;
	}

	function showStatus(status) {
		$('#status').text(status);
		log(status);
	}

	function log(message) {
		$('#log').append($('<div class="logmessage"></div>').text(message))
	}
});


