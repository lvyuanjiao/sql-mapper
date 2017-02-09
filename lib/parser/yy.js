'use strict';

exports.query = function(name, args, map, plugins) {
  return {
    'name': name,
    'args': args,
    'plugins': plugins,
    'map': map
  };
};

exports.plugin = function(name, args) {
  return {
    'value': name,
    'args': args
  };
};

exports.argVar = function(val) {
  return {
    'type': 'var',
    'value': val.split('.')
  };
};

exports.argConst = function(val) {
  return {
    'type': 'const',
    'value': val
  };
};

exports.reference = function(value) {
  var arr = value.split(':');
  var ref = {
    'type': 'reference',
    'value': arr[0].split('.'),
  };
  if (arr[1]) {
    ref.handler = arr[1];
  }
  return ref;
};

exports.inline = function(value) {
  var arr = value.split(':');
  var inl = {
    'type': 'inline',
    'value': arr[0].split('.'),
  };
  if (arr[1]) {
    inl.handler = arr[1];
  }
  return inl;
};

exports.text = function(value) {
  return {
    'type': 'text',
    'value': value
  };
};

exports.fragment = function(name, args) {
  return {
    'type': 'fragment',
    'value': name,
    'args': args
  };
};

exports.section = function(name, params, block) {
  return {
    'type': 'section',
    'value': name,
    'params': params,
    'block': block
  };
};

exports.appendNode = function(nodes, node) {
  var last = nodes[nodes.length - 1];
  if (node.type === 'text' && last.type === 'text') {
    last.value += node.value;
    return nodes;
  } else {
    return [].concat(nodes, node);
  }
};

exports.column = function(property, column) {
  var tmp = column.split('|');
  var r = {
    'property': property,
    'type': 'result',
    'value': {
      'column': tmp[0].trim()
    }
  };
  if (tmp[1]) {
    var arr = tmp[1].trim().split(/\s+/);
    r.value.handler = arr.shift();
    r.value.params = arr;
  }
  if (property[0] === '*') {
    r.type = 'id';
    r.property = property.substr(1);
  }
  return r;
};

exports.association = function(property, association) {
  return {
    'property': property,
    'type': 'association',
    'value': association
  };
};

exports.collection = function(property, collection) {
  return {
    'property': property,
    'type': 'collection',
    'value': collection
  };
};

exports.schema = function() {
  return {
    id: [],
    result: {},
    association: {},
    collection: {}
  };
};

var table = {
  'id': 'result',
  'result': 'result',
  'association': 'association',
  'collection': 'collection'
};
exports.appendPair = function(pair, pairs) {
  var parent = pairs || exports.schema();
  if (pair.type === 'id') {
    parent.id.push(pair.property);
  }
  parent[table[pair.type]][pair.property] = pair.value;
  return parent;
};
