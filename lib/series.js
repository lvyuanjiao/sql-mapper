'use strict';

module.exports = function series (conn, fns, callback) {
    callback = callback || function(err) {};

    var isArr = Array.isArray(fns);
    var len = isArr ? fns.length : Object.keys(fns).length;
    var keys = isArr ? null : Object.keys(fns);
    var results = isArr ? [] : {};

    var completed = 0;
    var iterate = function () {

        var key = isArr ? completed : keys[completed];
        fns[key](conn, function(err, result) {
            if (err) {
                return callback(err, results);
            }

            if (isArr) {
                results.push(result);
            } else {
                results[key] = result;
            }

            if (++completed >= len) {
                callback(null, results);
            } else {
                iterate();
            }

        });

    };

    iterate();

};