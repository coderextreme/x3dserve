import express from 'express';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';
import { globSync } from 'node:fs';
import gpg from 'gpg';  
import X3DJSONLD from './X3DJSONLD.js';
import convertXML from './convertXML.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server);
const PORT = process.env.PORT || 3000;


let examples = "C:/Users/jcarl/X3DJSONLD/src/main/data/";

var loadURLs = X3DJSONLD.loadURLs;
fs.symlink(
path.resolve(examples),
path.resolve(__dirname + "/examples"),
'junction',
 function (err) {
        if (err) {
                console.log( err.code === 'EEXIST' ? "Link exists!\n" : err);
        }
  }
);

app.use(express.static(__dirname));

// Basic route to serve your HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', function(socket) {
	console.log("got a socket io connection");
	socket.on('disconnect', function() {
	});
	socket.on('error', function(e) {
		console.log("socket error", e);
	});
	socket.on("search", function(string) {
		console.log("searching in", "examples/", "for", string);
		let files = globSync("examples/"+'**/*.x3d');
		console.log("Found", files.length, "files.");
		files.forEach(function(file) {
			console.log("searching", string, "in", file);
			// file = "examples/"+file.substr(examples.length);
			fs.readFile(file, 'utf-8', function(err, contents) {
			    if (err) {
				    console.error(err);
				    return;
			    }
			    if (contents.indexOf(string) != -1) {
				console.log("found", string, "in", file);
				socket.emit('result', file);
			    }
			});
		});
	});
	socket.on("x3d", function(infile) {
		infile = infile.replace(/\\/g, "/");
		console.log('receiving', infile);
		if (infile.match(/^[^<>&{} "'\[\]\$\\;]+\.x3d$/)) {
			try {
				runAndSend(socket, infile);
			} catch (e) {
				console.log(e);
			}
		} else {
			console.log('does not match', infile);
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

function runAndSend(socket, infile) {
	console.log(infile);
	// convert a single file with a single serializer
	var outstr = convertXML(infile,
		{ 
		serializer : 'DOM2JSONSerializer',
		folder : "./",
        	extension : ".x3dj",
		});

	
	if (outstr) {
		var json = JSON.parse(outstr);
		console.log('sending back', json);
		try {
			socket.emit('json', 'ok', JSON.stringify(json));
		} catch (e) {
			console.log(e);
			socket.emit('json', e, JSON.stringify(json));
		}
	} else {
		console.log(outstr);
	}
}

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}/`);
});
