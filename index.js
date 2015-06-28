'use strict';

var Mapper = require('./lib/mapper');

var cache = {};

function factory(namespace) {
	if (!namespace) {
        namespace = Object.keys(cache)[0];
    }
    return cache[namespace];
}

factory.build = function(opts, done) {

	opts.namespace = opts.namespace || 'DEFAULT_NAME_SPACE';

    var mapper = new Mapper(opts);

    mapper.build(function(err) {

        if (err) {
            return done(err);
        }

        cache[opts.namespace] = mapper;

        done(null, mapper);

    });

};

module.exports = factory;