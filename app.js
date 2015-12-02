var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
var config = require("./config");
var path = require('path');

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

io.on('connection', function(socket){
	socket.on("x3d", function(file) {
		console.log('receiving', file);
		var x3d = fs.readFileSync(file);
		console.log('read', x3d.toString());
		var terminal = require('child_process').spawn('/Users/johncarlson/Downloads/xmlsh_1_2_5/unix/xmlsh');
		socket.on('disconnect', function() {
			console.log('killing');
			terminal.kill("SIGINT");
		});
		socket.on('error', function(e) {
			console.log("socket error", e);
		});

		var content = '';

		terminal.stdout.on('data', function (data) {
			var d = data.toString();
			content += d;
		});

		terminal.on('exit', function (code) {
			console.log('exited', code);
		});

		if (file.match(/^[^<>&{} "'\[\]\$\\]+\.x3d$/)) {
			terminal.stdin.write('xslt -f X3dToJson.xslt -cf '+file+'\n');
			console.log('processing sent', file);
			terminal.stdin.end();
		} else {
			console.log('file doesn\'t match', "'"+file+"'");
		}

		terminal.stdout.on('end', function() {
			var br = content.indexOf('{');
			if (br >= 0) {
				content = content.substr(br);
			}
			br = content.lastIndexOf('}');
			if (br >= 0) {
				content = content.substr(0, br+1);
			}
			console.log('sending back', content);
			try {
				JSON.parse(content);
				socket.emit('json', 'ok', content);
			} catch (e) {
				socket.emit('json', e, content);
			}
			content = '';
		});
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
