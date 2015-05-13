'use strict';

var series = require('./series');
var Section = require('./section');
var Provider = require('./provider');

function Mapper(){
	this.provider = null;
	this.adapter = null;
	this.section = new Section();
}

Mapper.prototype.build = function(opts, adapter) {
	this.provider = new Provider(opts.engine, opts.mappers);
	this.adapter = adapter;
};

Mapper.prototype.connect = function(callback) {
	this.adapter.connect(callback);
};

Mapper.prototype.sql = function(queryName, args, callback) {
	if(typeof args === 'function'){
		callback = args;
		args = [];
	}

	var query = this.provider.query(queryName);

	if(!query) {
		throw new Error('Query: ' + queryName + ' is not exist');
	}

	query.sql.apply(query, [].concat(args, callback));
};

Mapper.prototype.query = function(queryName, args, done, conn) {
	if(typeof args === 'function') {
		conn = done;
		done = args;
		args = [];
	}

	var adapter = this.adapter;
	var noConn = !conn;
	var exec = function(conn, sql, values) {
		conn.query(sql, values, function(err, results){
			if(err) {
				console.log('SQL Query Error: ', err);
			}
			if(noConn) {
				conn.release();
			}
			done(err, results);
		});
	};	

	this.sql(queryName, args, function(sql, values){

		console.log('SQL Query: ', beauty(sql), values);

		if(noConn) {
			adapter.connect(function(err, conn) {
				if(err) {
					return done(err);
				}
				exec(conn, sql, values);
			});
		} else {
			exec(conn, sql, values);
		}

	});
	
};

Mapper.prototype.proxy = function(method, queryName, args, done, conn) {
	var adapter = this.adapter;
	if(typeof args === 'function') {
		conn = done;
		done = args;
		args = [];
	}

	var fn = function(err, rows){
		adapter[method](err, rows, done);
	};	
	this.query(queryName, args, fn, conn);
};

Mapper.prototype.select = function(queryName, args, done, conn) {
	this.proxy('select', queryName, args, done, conn);
};

Mapper.prototype.selectOne = function(queryName, args, done, conn) {
	this.proxy('selectOne', queryName, args, done, conn);
};

Mapper.prototype.insert = function(queryName, args, done, conn) {
	this.proxy('insert', queryName, args, done, conn);
};

Mapper.prototype.update = function(queryName, args, done, conn) {
	this.proxy('update', queryName, args, done, conn);
};

Mapper.prototype.delete = function(queryName, args, done, conn) {
	this.proxy('delete', queryName, args, done, conn);
};

Mapper.prototype.transaction = function(tasks, done) {
	this.adapter.connect(function(err, conn) {
	    if (err) {
	        return done(err);
	    }
	    conn.begin(function(err) {
	        series(conn, tasks, function(err, results) {
	            if (err) {
	                return rollback(conn, function() {
	                    done(err, results);
	                });
	            }
	            conn.commit(function(err) {
	                if (err) {
	                    return rollback(conn, function() {
	                        done(err, results);
	                    });
	                }

	                conn.release();
	                done(err, results);
	            });
	        });
	    });
	});
};

var rollback = function(conn, callback) {
	conn.rollback(function() {
        conn.release();
        return callback && callback();
    });
};

function beauty(sql) {
	return sql.replace(/\s+/g, ' ').trim();
}

module.exports = new Mapper();