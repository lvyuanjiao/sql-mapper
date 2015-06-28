'use strict';

var parser = require("./grammar").parser;

// Set yy scope
parser.yy = require("./scope");

exports.parse = function(input) {
    return parser.parse(input);
};