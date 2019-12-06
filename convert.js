var convertXML = require('./convertXML.js');
var outstr = convertXML(process.argv, [
	{ 
	serializer : './DOM2JSONSerializer.js'
	}
	]);

for (s in outstr) {
	console.log(outstr[s]);
}
