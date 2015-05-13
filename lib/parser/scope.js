'use strict';

if (typeof require !== 'undefined') {
    var scope = exports;
} else {
    var scope = parser.yy;
}

scope.query = function(name, args, filters, children) {
    return {
        'name': name, 
        'args': args, 
        'filters': filters,
        'children': children
    };
};

scope.reference = function(value){
    return {'type': 'reference', 'value': value.split('.')};
};

scope.inline = function(value){
    return {'type': 'inline', 'value': value.split('.')};
};

scope.text = function(value){
    return {'type': 'text', 'value': value};
};

scope.section = function(name, params, children){
    return {'type': 'section', 'value': name, 'params': params, 'children': children};
};

scope.fragment = function(name, args){
    return {'type': 'fragment', 'value': name, 'args': args};
};

scope.fargVar = function(val) {
    return {'type': 'var', 'value': val};
};

scope.fargInl = function(val) {
    return {'type': 'inl', 'value': val};  
};

scope.appendNode = function(nodes, node){
    var index = nodes.length - 1;
	var last = nodes[index];
	if(node.type === 'text' && last.type === 'text') {
		last.value += node.value;
		nodes[index] = last;
		return nodes;
	} else {
		return [].concat(nodes, node);
	}
};
