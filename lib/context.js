'use strict';

var clone = require('./util').clone;

function Context(namespace, filename, entry) {
    
    this.sql = '';
    this.values = [];
    this.prefix = '[' + namespace + '][' + filename + '][' + entry + ']';
    this.paramSignIndex = 0;
    this.states = [{
        '__namespace': namespace,
        '__filename': filename,
        '__entry': entry
    }];

}

Context.prototype.pushState = function() {
    this.states.push(clone(this.currentState()));
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

Context.prototype.nextParamSign = function() {
    var dialect = this.dialect();
    if(dialect === 'postgres' || dialect === 'sqlite') {
        return '$' + this.paramSignIndex++;
    } else if(dialect === 'mssql') {
        return '@' + this.paramSignIndex++;
    } else if(dialect === 'oracel') {
        return ':' + this.paramSignIndex++;
    } else {
        return '?';
    }
};

Context.prototype.mapper = function() {
    return require('../index')(this.namespace);
};

Context.prototype.dialect = function() {
    return this.mapper().dialect.toLowerCase();
};

Context.prototype.args = function(map) {
    var self = this;
    var args = [];
    map.forEach(function(arg) {
        if(arg.type === 'var') {
            args.push(self.val(arg.value));
        } else {
            args.push(arg.value);
        }
    });
    return args;
};

Context.prototype.val = function(key, value) {
    if (value !== undefined) {
        this.currentState()[key] = value;
    } else {
        if (typeof key === 'string') {
            key = key.split('.');
        }
        return eval('this.currentState()["' + key.join('"]["') + '"]');
    }
};

Context.prototype.value = function(path, type) {
    var val = this.val(path);
    if (val === undefined) {
        throw new Error('#' + this.prefix + ' ' + path.join('.') + ' is unavailable in context.');
    }

    if (!type) {
        return val;
    }

    var handler = this.mapper().typeHandler.get(type);
    if (!handler) {
        throw new Error('#' + this.prefix + ' handler ' + type + ' is unavailable.');
    }

    try {
        return handler(val);
    } catch (e) {
        throw new Error('#' + this.prefix + ' ' + path.join('.') + ' ' + e.message);
    }
};

Context.prototype.eval = function(expression) {
    return eval(expression.replace(/#([\w.]+)/g, 'this.val("$1")'));
};

module.exports = Context;