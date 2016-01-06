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

function TypeHandler() {
  this.handlers = {
    'int': _int,
    'float': _float
  };
}

TypeHandler.prototype.set = function(name, handler) {
  this.handlers[name] = handler;
};

TypeHandler.prototype.get = function(name) {
  return this.handlers[name];
};

module.exports = TypeHandler;
