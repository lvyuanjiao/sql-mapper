'use strict';
var builder = require('./builder');
var Query = require('./query');
var path = require('path');

function Provider(engine, dir){
	this.engine = engine;
	this.dir = dir;
	var mappers = this.mappers = {};

	if(!/^js$|^smp$/i.test(engine)) {
		throw new Error('Invalid engine :' + engine);
	}

	if(/^smp$/i.test(engine)) {

		builder.build(dir, function(namespace, ast){

			for(var entry in ast) {
				mappers[namespace] = mappers[namespace] || {};
				mappers[namespace][entry] = new Query(namespace, ast[entry]);
			}

		});

	}

}

Provider.prototype.query = function(queryName) {

	var paths = queryName.split('.');
	var query;
	
	if(/^smp$/i.test(this.engine)) {

		query = this.mappers[paths[0]][paths[1]];

	} else if(/^js$/i.test(this.engine)) {

		query = require(this.dir + path.sep + paths[0])[paths[1]];

	}	

	return query;

};

module.exports = Provider;