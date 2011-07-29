$(document).ready(function() {
	var STATE_NOT_LOADING = 'not loading';
	var STATE_LOADING = 'loading';
	var STATE_LOADED_AND_PAUSED = 'paused';
	var STATE_PLAYING = 'playing';
	var STATE_ENDED = 'ended';
	var STATE_SEEKING = 'seeking';

	var client_id;

	showStatus("Loading video metadata.");

	// Start loading the video. Apparently .load() doesn't work.
	video = $('#video')[0];
	video.load(); video.play(); video.pause();
	$('#video').one('loadedmetadata', function() {
		showStatus("Connecting to Synchrotron");
		DNode.connect(function (server) {
			showStatus("Connected. Registering with Synchrotron");
			server.register(window.location.hash, new Client(), function(id, video_id) {
				window.location.hash = '#'+video_id;
				showStatus("Registered with id " + id);
				client_id = id;
			})

			// REMOVEME
			$('#pause').click(function() {
				server.pause(client_id, $('#goal_time').val());
			});
			$('#play').click(function() {
				server.play(client_id, $('#goal_time').val());
			});
		});
	})

	function Client() {
		// TODO make these into getters that calculate this shit.
		var goalState = STATE_NOT_LOADING;
		var goalTime = 0;

		this.setGoal = function(state, time) {
			showStatus("Going for goal " + state + ", " + time);
			goalState = state;
			goalTime = time;
			if (tryForGoal[goalState]) {
				tryForGoal[goalState](time);
			}
		}
	}

	var PLAY_THEN_PAUSE_THRESHOLD = 5;
	var CLOSE_ENOUGH_THRESHOLD = 2;
	var tryForGoal = {};
	tryForGoal[STATE_LOADED_AND_PAUSED] = function(time) {
		video = $('#video')[0];
		$(video).unbind('.aoeu');
		if (video.currentTime < time && time-video.currentTime < PLAY_THEN_PAUSE_THRESHOLD && !video.paused) {
			// Wait until we catch up to the time, then pause.
			log("Goal time is only " + (time-video.currentTime) + " seconds away. Waiting to catch up, then pausing");
			$(video).bind('timeupdate.aoeu', function() {
				if (video.currentTime > time) {
					$(video).unbind('timeupdate.aoeu');
					video.pause();
					reportWhenReady();
				}
			});
		} else if (Math.abs(video.currentTime - time) < CLOSE_ENOUGH_THRESHOLD) {
			// Close enough. Just pause here.
			video.pause();
			reportWhenReady();
		} else {
			// We'll need to seek.
			video.currentTime = time;
			video.pause();
			$(video).one('seeked.aoeu', function() {
				reportWhenReady();
			});
		}
	}

	tryForGoal[STATE_PLAYING] = function(time) {
		video = $('#video')[0];
		if (video.currentTime < time && time-video.currentTime < PLAY_THEN_PAUSE_THRESHOLD && !video.paused) {
			// Wait until we catch up to the time, then report.
			log("Goal time is only " + (time-video.currentTime) + " seconds away. Waiting to catch up.");
			$(video).bind('timeupdate.aoeu', function() {
				if (video.currentTime > time) {
					$(video).unbind('timeupdate.aoeu');
					reportWhenPlaying();
				}
			});
		} else if (Math.abs(video.currentTime - time) < CLOSE_ENOUGH_THRESHOLD) {
			// Close enough, just play here.
			if (video.readyState < video.HAVE_FUTURE_DATA) {
				log("Not good. I can't play yet. You shouldn't be asking me to.");
			}
			video.play();
			reportWhenPlaying();
		} else {
			// We're far away. We'll need to seek.
			video.currentTime = time;
			video.play();
			$(video).one('seeked.aoeu', function() {
				reportWhenPlaying();
			});
		}
	}

	function reportWhenReady() {
		// When we have enough data to play through to the end, call reportState.
		video=$('#video')[0];
		if (video.readyState < video.HAVE_ENOUGH_DATA) {
			$(video).one('canplaythrough.aoeu', function() {
				reportState();
			});
		} else {
			reportState();
		}
	}

	function reportWhenPlaying() {
		// When we start playing, reportState.
		video=$('#video')[0];
		if (!isPlaying(video)) {
			$(video).one('playing.aoeu', function() {
				reportState();
			});
		} else {
			reportState();
		}
	}

	function reportState() {

	}

	function calculateState() {
		video = $('#video')[0];
		if (video.ended) {
			return STATE_ENDED;
		}
		if (video.readyState < video.HAVE_FUTURE_DATA) {
			if (networkState === video.NETWORK_LOADING) {
				return STATE_LOADING;
			} else {
				return STATE_NOT_LOADING;
			}
		} else {
			if (video.paused) {
				return STATE_LOADED_AND_PAUSED;
			} else if (video.seeking) {
				return STATE_SEEKING;
			} else {
				return STATE_PLAYING;
			}
		}
	}

	function isPlaying(video) {
		return !(video.paused || video.ended || video.seeking || video.readyState < video.HAVE_FUTURE_DATA);
	}

	function showStatus(status) {
		$('#status').text(status);
		log(status);
	}

	function log(message) {
		$('#log').append($('<div class="logmessage"></div>').text(message))
	}
});
