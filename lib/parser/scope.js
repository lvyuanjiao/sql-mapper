'use strict';

if (typeof require !== 'undefined') {
    var scope = exports;
} else {
    var scope = parser.yy;
}

scope.query = function(name, args, interceptors, block) {
    return {
        'name': name,
        'args': args,
        'interceptors': interceptors,
        'block': block
    };
};

scope.reference = function(value) {
    var ref = value.split(':');
    return {
        'type': 'reference',
        'value': ref[0].split('.'),
        'handler': ref[1]
    };
};

scope.inline = function(value) {
    var inl = value.split(':');
    return {
        'type': 'inline',
        'value': inl[0].split('.'),
        'handler': inl[1]
    };
};

scope.text = function(value) {
    return {
        'type': 'text',
        'value': value
    };
};

scope.section = function(type, params, block) {
    return {
        'type': 'section',
        'value': type,
        'params': params,
        'block': block
    };
};

scope.interceptor = function(type, args) {
    return {
        'type': 'interceptor',
        'value': type,
        'args': args
    };
};

scope.fragment = function(type, args) {
    return {
        'type': 'fragment',
        'value': type.split('.'),
        'args': args
    };
};

scope.argVar = function(val) {
    return {
        'type': 'var',
        'value': val
    };
};

scope.argConst = function(val) {
    return {
        'type': 'const',
        'value': val
    };
};

scope.appendNode = function(nodes, node) {
    var index = nodes.length - 1;
    var last = nodes[index];
    if (node.type === 'text' && last.type === 'text') {
        last.value += node.value;
        nodes[index] = last;
        return nodes;
    } else {
        return [].concat(nodes, node);
    }
};