var express = require('express');
var app = express.createServer();
app.use(express.static(__dirname+'/htdocs'));

app.listen(8080);
console.log('http://localhost:8080/');

var dnode = require('dnode');
var server = dnode({
    helloworld : function(callback) { callback("Hello, world!"); }
});

server.listen(app);