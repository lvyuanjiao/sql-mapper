'use strict';

var Mapper = require('./lib/mapper');

var cache = {};

function factory(namespace) {
	if (!namespace) {
        namespace = Object.keys(cache)[0];
    }

    if (!cache[namespace]) {
        throw new Error('Mapper' + (namespace ? (' namespace : ' + namespace) : '') + ' is not exist');
    }

    return cache[namespace];
}

factory.create = function(opts, done) {

	opts.namespace = opts.namespace || 'DEFAULT_NAME_SPACE';
    var mapper = new Mapper(opts.namespace);

    if(!opts.mappers) {
        return done(mapper);
    }

    mapper.build(opts.mappers, function(err) {
        if (err) {
            return done(err);
        }

        cache[opts.namespace] = mapper;
        done(null, mapper);

    });

};

module.exports = factory;