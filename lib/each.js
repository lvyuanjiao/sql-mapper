'use strict';

module.exports = function each (arr, fn, callback) {
    
    var len = arr.length;
    var results = [];
    var completed = 0;
    var iterate = function () {
        
        fn(arr[completed], function(err, result) {

            if (err) {
                return callback(err, results);
            }

            results.push(result);

            if (++completed >= len) {
                callback(null, results);
            } else {
                iterate();
            }

        });

    };

    iterate();

};