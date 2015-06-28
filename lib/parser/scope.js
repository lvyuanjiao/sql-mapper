'use strict';

if (typeof require !== 'undefined') {
    var scope = exports;
} else {
    var scope = parser.yy;
}

scope.query = function(name, args, filters, block) {
    return {
        'name': name,
        'args': args,
        'filters': filters,
        'block': block
    };
};

scope.reference = function(value) {
    var ref = value.split(':');
    return {
        'name': 'reference',
        'value': ref[0].split('.'),
        'type': ref[1]
    };
};

scope.inline = function(value) {
    var inl = value.split(':');
    return {
        'name': 'inline',
        'value': inl[0].split('.'),
        'type': inl[1]
    };
};

scope.text = function(value) {
    return {
        'name': 'text',
        'value': value
    };
};

scope.section = function(name, params, block) {
    return {
        'name': 'section',
        'value': name,
        'params': params,
        'block': block
    };
};

scope.fragment = function(name, args) {
    return {
        'name': 'fragment',
        'value': name.split('.'),
        'args': args
    };
};

scope.fargVar = function(val) {
    return {
        'name': 'var',
        'value': val
    };
};

scope.fargConst = function(val) {
    return {
        'name': 'const',
        'value': val
    };
};

scope.appendNode = function(nodes, node) {
    var index = nodes.length - 1;
    var last = nodes[index];
    if (node.name === 'text' && last.name === 'text') {
        last.value += node.value;
        nodes[index] = last;
        return nodes;
    } else {
        return [].concat(nodes, node);
    }
};