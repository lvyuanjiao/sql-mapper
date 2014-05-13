var parser = require("./parser").parser;

// set yy scope
parser.yy = require("./parser/scope");

exports.compile = function (input) {
    return parser.parse(input);
};
