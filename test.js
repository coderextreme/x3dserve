var convertXML = require('./convertXML.js');
var outstr = convertXML(["flipper.x3d"], [
	{ 
	serializer : './DOM2JSONSerializer.js'
	}
	]);

for (s in outstr) {
	console.log(outstr[s]);
}
