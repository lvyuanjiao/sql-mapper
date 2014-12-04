var parser = require("./parser").parser;

// Set yy scope
parser.yy = require("./parser/scope");

exports.compile = function(input) {
    return parser.parse(input);
};
