if (typeof require !== 'undefined') {
    var scope = exports;
} else {
    var scope = parser.yy;
}

scope.query = function(name, args, children) {
    return {
        'name': name, 
        'args': args, 
        'children': children
    };
};

scope.reference = function(value){
    return {'type': 'ref', 'value': value.split('.')};
};

scope.inline = function(value){
    return {'type': 'inl', 'value': value.split('.')};
};

scope.text = function(value){
    return {'type': 'text', 'value': value};
};

scope.section = function(name, params, children){
    return {'type': 'section', 'value': name, 'params': params, 'children': children}
};

scope.fragment = function(name, args){
    return {'type': 'frag', 'value': name, 'args': args};
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
