'use strict';

var path = require('path');
var fs = require('fs');
var compiler = require('./compiler');


exports.build = function(mapperFolder, process) {
	
	fs.readdirSync(mapperFolder).forEach(function(file){
		// namespace
		var namespace = file.substring(0, file.lastIndexOf('.')).replace(/[^a-zA-Z0-9_]+/g, '_');

		var smpFile = mapperFolder + path.sep + file;
		if(fs.lstatSync(smpFile).isFile() && /.smp$/i.test(file)) {
			var data = fs.readFileSync(smpFile);
			var ast = compiler.compile(data.toString());
			process(namespace, ast);
		}
	});

};
