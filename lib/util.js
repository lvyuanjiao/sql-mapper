'use strict';

exports.each = function(arr, fn, callback) {

    var isArr = Array.isArray(arr);
    var len = isArr ? arr.length : Object.keys(arr).length;
    var keys = isArr ? null : Object.keys(arr);

    var results = isArr ? [] : {};
    var completed = 0;

    if (len === 0) {
        return callback(null, results);
    }

    var iterate = function() {

        var key = isArr ? completed : keys[completed];
        fn(arr[key], function(err, result) {
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

        }, key, completed);

    };

    iterate();

};

exports.clone = function(obj) {
    if (null === obj || "object" !== typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
};