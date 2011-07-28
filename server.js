var dnode = require('dnode');

var server = dnode({
    helloworld : function(callback) { callback("Hello, world!"); }
});

server.listen(8888);