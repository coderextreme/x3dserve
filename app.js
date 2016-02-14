var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
var config = require("./config");
var path = require('path');
var runsaxon = require('./runsaxon');

app.use(express.static(__dirname));

require("fs").symlink(
path.resolve(config.examples),
path.resolve(__dirname + "/examples"),
'junction',
 function (err) {
        if (err) {
                console.log( err.code === 'EEXIST' ? "Go to the link above!\n" : err);
        }
  }
);

function runAndSend(socket, infile, outfile) {
	runsaxon(infile, outfile, function(err, results) {
			if (err) throw err;
		fs.readFile(outfile, {}, function(err, content) {
			fs.unlink(outfile);
			if (err) throw err;
			console.log('sending back', content.toString());
			try {
				JSON.parse(content.toString());
				socket.emit('json', 'ok', content.toString());
			} catch (e) {
				console.log(e);
				socket.emit('json', e, content.toString());
			}
		});
	});
}

var count = 0;
io.on('connection', function(socket){
	socket.on('disconnect', function() {
	});
	socket.on('error', function(e) {
		console.log("socket error", e);
	});
	socket.on("x3d", function(infile) {
		console.log('receiving', infile);
		if (infile.match(/^[^<>&{} "'\[\]\$\\;]+\.x3d$/)) {
			var outfile = (count++)+".json";
			runAndSend(socket, infile, outfile);
		}
	});
});

io.on('error', function(e) {
	console.log("server error", e);
});

http.listen(port, function () {
    console.log('listening on http://localhost:' + port);
});

http.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('Address in use, exiting...');
  }
});
