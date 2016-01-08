'use strict';

var util = require('./util');

function Context(dialect, database, namespace, entry) {
  this.dialect = dialect;
  this.database = database;
  this.namespace = namespace;
  this.entry = entry;
  this.states = [{
    '__database': database,
    '__namespace': namespace,
    '__entry': entry
  }];
  this.paramSignIndex = 0;
  this.queryName = namespace + '.' + entry;
  this.prefix = dialect + '-' + database + '#' + namespace + '.' + entry;
  this.mapper = null;
}

Context.prototype.init = function(args, params) {
  var self = this;
  params = [].concat(params || []);
  this.states = [{
    '__database': this.database,
    '__namespace': this.namespace,
    '__entry': this.entry
  }];
  self.paramSignIndex = 0;
  args.forEach(function(arg, i) {
    self.set(arg, params[i]);
  });
};

Context.prototype.pushState = function() {
  this.states.push(util.clone(this.currentState()));
};

Context.prototype.popState = function() {
  this.states.pop();
};

Context.prototype.topState = function() {
  return this.states[0];
};

Context.prototype.currentState = function() {
  return this.states[this.states.length - 1];
};

Context.prototype.args = function(map) {
  var self = this;
  var params = [];
  map.forEach(function(arg) {
    if (arg.type === 'var') {
      params.push(self.get(arg.value));
    } else {
      params.push(arg.value);
    }
  });
  return params;
};

Context.prototype.set = function (key, value) {
  this.currentState()[key] = value;
};

Context.prototype.get = function (key) {
  if (typeof key === 'string') {
    key = key.split('.');
  }
  return eval('this.currentState()["' + key.join('"]["') + '"]');
};

Context.prototype.eval = function(expression) {
  return eval(expression.replace(/#([\w.]+)/g, 'this.get("$1")'));
};

Context.prototype.nextSign = function() {
  if (this.dialect === 'postgres' || this.dialect === 'sqlite') {
    return '$' + this.paramSignIndex++;
  } else if (this.dialect === 'mssql') {
    return '@' + this.paramSignIndex++;
  } else if (this.dialect === 'oracel') {
    return ':' + this.paramSignIndex++;
  } else {
    return '?';
  }
};

Context.prototype.value = function(node) {
  var val = this.get(node.value);
  if (val === undefined) {
    throw new Error(this.prefix + ' ' + node.value.join('.') + ' is unavailable in context.');
  }
  if (!node.handler) {
    return val;
  }
  var handler = this.getMapper().typeHandler.get(node.handler);
  if (!handler) {
    throw new Error(this.prefix + ' handler ' + node.handler + ' is unavailable.');
  }
  return handler(val);
};

// lazy load
Context.prototype.getMapper = function() {
  if(!this.mapper) {
    this.mapper = require('../index')(this.database);
  }
  return this.mapper;
};

module.exports = Context;
