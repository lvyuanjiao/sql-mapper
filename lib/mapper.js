
var path = require('path');
var fs = require('fs');
var async = require('async');
var compiler = require('./compiler');
var Query = require('./query');
var setDialect = require('./dialect').set;

module.exports = (function() {

	var mappers = {};
	
	return {
		
		'build': function(dir, dialect, done){
		    
		    if(typeof dialect === 'function') {
		        done = dialect;
		        dialect = 'mysql';
	        }
	        
	        setDialect(dialect);
	        
	        fs.readdir(dir, function(err, files) {
        		if(err) throw err;
        		
        		async.each(files, function(file, next){        		    
        		    // get namespace
			        var namespace = file.substring(0, file.lastIndexOf('.')).replace(/[^a-zA-Z0-9_]+/g, '_');
			        fs.readFile(path.join(dir, file), function(err, data) {
			            if(err){
			                return next(err);
			            }
			            
			            // parse
			            var ast = compiler.compile(data.toString());
			            
			            // if namespace not exist, create it
		                if(!(namespace in mappers)) {
			                mappers[namespace] = {};
		                }
			            for(var queryName in ast) {			                			
			                mappers[namespace][queryName] = adapter().toSql(new Query(namespace, ast[queryName]));
			            }
			            next();
			        });
        		    
        		}, done);
        		
    		});
	        
		},
		
		'get': function(namespace) {
			return mappers[namespace];
		}
		
	};
	
})();

function adapter() {
	return {
		'toSql': function(query) {
			return function() {
				query.sql.apply(query, arguments);
			}
		}
	};
};
