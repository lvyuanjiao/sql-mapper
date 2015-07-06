'use strict';

function Context(namespace, table, entry) {
    this.namespace = namespace;
    this.table = table;
    this.entry = entry;
    this.values = {};
}

Context.prototype.copy = function(ctx) {
    this.namespace = ctx.namespace;
    this.table = ctx.table;
    this.entry = ctx.entry;
    for (var k in ctx.values) {
        this.values[k] = ctx.values[k];
    }
};

Context.prototype.val = function(key, value) {
    if (value !== undefined) {
        this.values[key] = value;
    } else {
        if (typeof key === 'string') {
            key = key.split('.');
        }
        return eval('this.values["' + key.join('"]["') + '"]');
    }
};

Context.prototype.value = function(path, type) {
    var val = this.val(path);
    if (val === undefined) {
        throw new Error('#' + this.namespace + '.' + this.table + '.' + this.entry + ' ' + path.join('.') + ' is unavailable in context.');
    }

    if (!type) {
        return val;
    }

    var mapper = require('../index')(this.namespace);
    var handler = mapper.typeHandler.get(type);
    if (!handler) {
        throw new Error('#' + this.namespace + '.' + this.table + '.' + this.entry + ' handler ' + type + ' is unavailable.');
    }

    try {
        return handler(val);
    } catch (e) {
        throw new Error('#' + this.namespace + '.' + this.table + '.' + this.entry + ' ' + path.join('.') + ' ' + e.message);
    }
};

Context.prototype.eval = function(expression) {
    return eval(expression.replace(/#([\w.]+)/g, 'this.val("$1")'));
};

module.exports = Context;
