"use strict";

var fs = require('fs');
var mapToMethod = require('./mapToMethod.js');
var mapToMethod2 = require('./mapToMethod2.js');
var fieldTypes = require('./fieldTypes.js');
var DOMParser = require('@xmldom/xmldom').DOMParser;

if (typeof mapToMethod2 !== 'undefined') {
	for (var map in mapToMethod2) {
		Object.assign(mapToMethod[map], mapToMethod2[map]);
	}
}
/*
for (var par in mapToMethod2) {
	for (var child in mapToMethod2[par]) {
		mapToMethod[par][child] = mapToMethod2[par][child];
	}
}
*/

function serializeXML(str, serializer, co, mapToMethod, fieldTypes) {
	var doc = null;
	try {  
		var domParser = new DOMParser();
		doc = domParser.parseFromString (str, 'application/xml');

	} catch (e) {
		throw e;
	}
	var element = doc.documentElement;
	str = new serializer().serializeToString(str, element, co, mapToMethod, fieldTypes)
	return str;
}

function convertXML(files, options) {

	var outstr = [];

	for (var f in files) {
		var file = files[f];
		if (file.match(/node_modules|package.json|JSONSchema/)) {
			continue;
		}
		var basefile = file.substr(0, file.lastIndexOf("."));
		var file = basefile+".x3d";
		var str = fs.readFileSync(file).toString();
		if (typeof str === 'undefined') {
			throw("Read nothing, or possbile error");
		}
		basefile = basefile.replace(/^C:\//, "")
		basefile = basefile.replace(/^\.\.\//, "")
		basefile = basefile.replace(/-|\.| /g, "_")
		basefile = basefile.replace(/^(.*[\\\/])([0-9].*|default|switch|for)$/, "$1_$2")

		for (var ser in options) {
			var serializer = require(options[ser].serializer);
			try {
				str = serializeXML(str, serializer, basefile, mapToMethod, fieldTypes);
				outstr.push(str);
			} catch (e) {
				console.error("================================================================================");
				console.error("File:", file);
				console.error("Error:", e);
			}
		}
	}
	return outstr;
}

if (typeof module === 'object')  {
	module.exports = convertXML
}
