var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
var config = require("./config");
var path = require('path');
var runsaxon = require('./allsaxon');
var externPrototypeExpander = require("./ServerPrototypeExpander");
var glob = require( 'glob' );  

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

function runAndSend(socket, infile) {
	runsaxon([infile]);
	var outfile = infile.substr(0, infile.lastIndexOf("."))+".json";
	var content = fs.readFileSync(outfile);
	var json = JSON.parse(content.toString());
	externPrototypeExpander(outfile, json);
	console.log('sending back', json);
	try {
		socket.emit('json', 'ok', JSON.stringify(json));
	} catch (e) {
		console.log(e);
		socket.emit('json', e, JSON.stringify(json));
	}
	return outfile;
}

var count = 0;
io.on('connection', function(socket){
	socket.on('disconnect', function() {
	});
	socket.on('error', function(e) {
		console.log("socket error", e);
	});
	socket.on("search", function(string) {
		console.log("searching", string);
		glob(config.examples+'**/*.x3d', function( err, files ) {
			 if (err) throw err;
			 files.forEach(function(file) {
				console.log("searching", string, "in", file);
				file = "examples/"+file.substr(config.examples.length);
				fs.readFile(file, 'utf-8', function(err, contents) {
		    		    if (err) throw err;
				    if (contents.indexOf(string) != -1) {
					console.log("found", string, "in", file);
					socket.emit('result', file);
				    }
				});
			 });
		});
	});
	socket.on("x3d", function(infile) {
		console.log('receiving', infile);
		if (infile.match(/^[^<>&{} "'\[\]\$\\;]+\.x3d$/)) {
			try {
				var outfile = runAndSend(socket, infile);
				fs.unlink(outfile);
			} catch (e) {
				console.log(e);
			}
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
