'use strict';

function _int(val) {
  var ret = parseInt(val, 10);
  if (isNaN(ret)) {
    throw new Error(val + ' could not convert to int');
  }
  return ret;
}

function _float(val) {
  var ret = parseFloat(val);
  if (isNaN(ret)) {
    throw new Error(val + ' could not convert to float');
  }
  return ret;
}

module.exports = function typeHandler(dialect) {
  var handlers = {
    'int': _int,
    'float': _float
  };
  return {
    get: function(name) {
      return handlers[name];
    },
    set: function(name, handler) {
      handlers[name] = handler;
    }
  };
}

