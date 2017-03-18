var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
var config = require("./config");
var path = require('path');
var runsaxon = require('./allsaxon');
var glob = require( 'glob' );  
var gpg = require( 'gpg' );  

var X3DJSONLD = require('./X3DJSONLD.js');
var loadURLs = X3DJSONLD.loadURLs;
var PE = require('./PrototypeExpander')
PE.setLoadURLs(loadURLs);
var prototypeExpander = PE.prototypeExpander;
var externPrototypeExpander = PE.externPrototypeExpander;

app.use(express.static(__dirname));

require("fs").symlink(
path.resolve(config.examples),
path.resolve(__dirname + "/examples"),
'junction',
 function (err) {
        if (err) {
                console.log( err.code === 'EEXIST' ? "Link exists!\n" : err);
        }
  }
);

function runAndSend(socket, infile) {
	runsaxon([infile]);
	var outfile = infile.substr(0, infile.lastIndexOf("."))+".json";
	var content = fs.readFileSync(outfile);
	var json = JSON.parse(content.toString());
	json = externPrototypeExpander(outfile, json);
	console.log('sending back', json);
	try {
		socket.emit('json', 'ok', JSON.stringify(json), outfile);
	} catch (e) {
		console.log(e);
		socket.emit('json', e, JSON.stringify(json), outfile);
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
			 if (err) return;
			 files.forEach(function(file) {
				console.log("searching", string, "in", file);
				file = "examples/"+file.substr(config.examples.length);
				fs.readFile(file, 'utf-8', function(err, contents) {
		    		    if (err) return;
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
	socket.on("gpg", function(input, args) {
		console.log("calling", "gpg", args);
		try {
			gpg.call(input, args, function(err, output) {
				if (err) {
					console.log("error", err);
					socket.emit('gpgerror', err);
					if (args[0] === '--decrypt') {
						socket.emit('json', err, '');
					}
				} else {
					console.log("sending back", output.toString());
					socket.emit('gpgdata', output.toString());
					if (args[0] === '--decrypt') {
						socket.emit('json', 'ok', output.toString());
					}
				}
			});
		} catch (e) {
			socket.emit('gpgerror', e);
		}
	});
});

io.on('error', function(e) {
	console.log("server error", e);
});

http.listen(port);

http.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('Address in use, exiting...');
  }
});
