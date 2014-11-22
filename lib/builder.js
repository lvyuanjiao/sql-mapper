var path = require('path');
var fs = require('fs');
var series = require('./series');
var compiler = require('./compiler');
var Query = require('./query');

exports.build = function(dir, done) {
	
	var mappers = {};
	        
	fs.readdir(dir, function(err, files) {
		if(err) {
			return done(err, mappers);
		};
		
		series(files, function(file, next) {        			
		
			// skip
			if(!(/.smp$/i.test(file))) {
				return next();
			}
			
			// namespace
			var namespace = file.substring(0, file.lastIndexOf('.')).replace(/[^a-zA-Z0-9_]+/g, '_');
			fs.readFile(path.join(dir, file), function(err, data) {
				if(err) {
					return next(err);
				}
				
				// parse
				var ast = compiler.compile(data.toString());
				
				for(var queryName in ast) {
					mappers[namespace + '.' + queryName] = new Query(namespace, ast[queryName]);
				}
				next();
			});
			
		}, function(err){
			done(err, err ? mappers = {} : mappers);
		});
		
	});

}
