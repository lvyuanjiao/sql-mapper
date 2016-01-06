'use strict';

exports.spliceQueryName = function(queryName, defaultNamespace) {
  var paths = queryName.split('.');
  var ns = paths[1] ? paths[0] : defaultNamespace;
  var entry = paths[1] || paths[0];
  return [ns, entry];
};

exports.ensure = function() {
  var args = Array.prototype.slice.call(arguments);
  var obj = args.shift();
  args.forEach(function(key) {
    obj = obj[key] = obj[key] || {};
  });
};

exports.clone = function(obj) {
  if (null === obj || 'object' !== typeof obj) {
    return obj;
  }
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
};

exports.uniqueArray = function(array) {
  return array.filter(function(item, pos) {
    return array.indexOf(item) === pos;
  });
};

exports.filterNilInArray = function(array) {
  return array.filter(function(item) {
    return !(item === null || item === undefined);
  });
};

exports.idArray = function(id1, id2) {
  return exports.filterNilInArray(exports.uniqueArray([].concat(id1, id2)));
};

exports.idValue = function(ids, data) {
  return ids.map(function(id) {
    return data && data[id];
  }).join('-');
};

exports.indexOfIdValue = function(list, ids, val) {
  return list.map(function(e) {
    return exports.idValue(ids, e);
  }).indexOf(val);
};

exports.mapSchema = function() {
  return {
    id: [],
    result: {},
    association: {},
    collection: {}
  };
};

exports.dummyMap = function() {
  return {
    expand: function (done) {
      done();
    },
    mapping: function(rows, done) {
      done(null, rows);
    }
  };
};

exports.each = function(arr, iterator, callback) {
  var isArr = Array.isArray(arr);
  var keys = isArr ? null : Object.keys(arr);
  var len = isArr ? arr.length : keys.length;

  var results = isArr ? [] : {};
  var completed = 0;

  if (len === 0) {
    return callback(null, results);
  }

  var iterate = function() {
    var key = isArr ? completed : keys[completed];
    iterator(arr[key], function(err, result) {
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
        process.nextTick(iterate);
      }
    }, key, completed);
  };
  iterate();
};

exports.tx = function(tasks, callback, connection) {
  callback = callback || function(err) {};

  var isArr = Array.isArray(tasks);
  var keys = isArr ? null : Object.keys(tasks);
  var len = isArr ? tasks.length : keys.length;
  var results = isArr ? [] : {};

  if (len === 0) {
    return callback(null, results);
  }

  var completed = 0;
  var iterate = function() {
    var key = isArr ? completed : keys[completed];
    tasks[key](function(err, result) {
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
        process.nextTick(iterate);
      }
    }, connection, results);
  };
  iterate();
};
