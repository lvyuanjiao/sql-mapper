'use strict';

var Context = require('./context');

function _where(ctx, params, processBlock, done) {
    processBlock(ctx, function(sql, values) {
        sql = sql.trim();
        if (sql) {
            sql = 'WHERE ' + sql.replace(/^(and|or)/i, ' ');
        }
        done(sql, values);
    });
}

function _set(ctx, params, processBlock, done) {
    processBlock(ctx, function(sql, values) {
        sql = sql.trim();
        if (sql) {
            sql = 'SET ' + sql.replace(/,$/, ' ');
        }
        done(sql, values);
    });
}

function _if(ctx, params, processBlock, done) {
    if (ctx.eval(params['test'])) {
        processBlock(ctx, done);
    } else {
        done('', []);
    }
}

function _each(ctx, params, processBlock, done) {
    var value = ctx.eval(params['value']);
    var key = params['key'] || 'key';
    var index = params['index'] || 'index';
    var item = params['item'] || 'item';
    var open = params['open'] || '';
    var close = params['close'] || '';

    var txt = '';
    params = [];
    var i = 0;

    function next(sql, values) {
        txt += (' ' + open + sql + close + ' ');
        params = [].concat(params, values);
    }

    for (var k in value) {
        
        var newCtx = new Context();
        newCtx.copy(ctx);
        newCtx.val(key, k);
        newCtx.val(index, i++);
        newCtx.val(item, value[k]);

        processBlock(newCtx, next);

    }
    done(txt, params);
}

function _trim(ctx, params, processBlock, done) {
    var pre = params['prefix'] || '';
    var suf = params['suffix'] || '';
    var po = params['prefixOverrides'];
    var so = params['suffixOverrides'];

    processBlock(ctx, function(sql, values) {
        sql = sql.trim();

        if (!sql) {
            return done(sql, values);
        }
        if (po) {
            sql = sql.replace(new RegExp('^(' + po + ')', 'i'), ' ');
        }
        if (so) {
            sql = sql.replace(new RegExp('(' + so + ')$', 'i'), ' ');
        }
        sql = pre + sql + suf;
        done(sql, values);
    });
}

function Section() {
    //built in sections
    this.sections = {
        'where': _where,
        'set': _set,
        'if': _if,
        'each': _each,
        'trim': _trim
    };
}

Section.prototype.set = function(name, callback) {
    this.sections[name] = callback;
};

Section.prototype.get = function(name) {
    return this.sections[name];
};

module.exports = Section;
