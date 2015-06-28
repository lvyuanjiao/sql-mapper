'use strict';

var fs = require('fs');
var path = require('path');
var Query = require('./query');
var parser = require('./parser');
var each = require('./each');

function Provider(namespace, dir) {
    this.namespace = namespace;
    this.dir = dir;
    this.mappers = {};
}

Provider.prototype.build = function(done) {

    var self = this;
    var ns = self.namespace;

    if(!self.mappers[ns]) {
        self.mappers[ns] = {};
    }

    fs.readdir(self.dir, function(err, files){

        if(err) {
            return done(err);
        }

        each(files, function(file, next){

            // table
            var table = path.basename(file, path.extname(file));
            var smpFile = self.dir + path.sep + file;

            fs.lstat(smpFile, function(err, stat) {

                if(err) {
                    return next(err);
                }

                
                if(stat.isFile() && /.smp$/i.test(file)) {

                    fs.readFile(smpFile, function(err, data){

                        if(err) {
                            return next(err);
                        }
                        if(!self.mappers[ns][table]) {
                            self.mappers[ns][table] = {};
                        }
                        var ast = parser.parse(data.toString());
                        for (var entry in ast) {
                            self.mappers[ns][table][entry] = new Query(ns, table, ast[entry]);
                        }
                        next();

                    });

                } else  {
                    next();
                }


            });

        }, done);

    });

};

Provider.prototype.query = function(queryName) {

    var paths = queryName.split('.');
    var ns = this.namespace;
    var table = paths[0];
    var entry = paths[1];

    return this.mappers[ns][table][entry];

};

module.exports = Provider;