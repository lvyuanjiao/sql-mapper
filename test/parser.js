'use strict';

var should = require('should');
var parser = require('../lib/parser');

describe('Test Parser', function() {

    describe('#Empty()', function() {
        it('AST should be empty when the input is not present', function() {
            var ast = parser.parse('');
            ast.should.be.empty();
        });
    });

    describe('#Node()', function() {
        it('Text nodes', function() {
            var ast = parser.parse('{#node}text{/node}');
            //console.log(JSON.stringify(ast));
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "text",
                value: "text"
            });
        });

        it('Text nodes whth interceptor', function() {
            var ast = parser.parse('{#node|filter}text{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "text",
                value: "text"
            });

            ast.node.interceptors[0].should.have.properties({
                'type': 'interceptor',
                'value': 'filter'
            });
            ast.node.interceptors[0].args.should.be.instanceof(Array).and.have.lengthOf(0);

        });

        it('Text nodes whth interceptors', function() {
            var ast = parser.parse('{#node|filter var obj.var 123 "test" | filter2}text{/node}');
            //console.log(JSON.stringify(ast));
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "text",
                value: "text"
            });

            ast.node.interceptors.should.be.instanceof(Array).and.have.lengthOf(2);
            ast.node.interceptors[0].should.have.properties({
                'type': 'interceptor',
                'value': 'filter'
            });
            ast.node.interceptors[0].args.should.be.instanceof(Array).and.have.lengthOf(4);

            ast.node.interceptors[0].args[0].should.have.properties({
                type: "var",
                value: "var"
            });
            ast.node.interceptors[0].args[1].should.have.properties({
                type: "var",
                value: "obj.var"
            });
            ast.node.interceptors[0].args[2].should.have.properties({
                type: "const",
                value: Number(123)
            });
            ast.node.interceptors[0].args[3].should.have.properties({
                type: "const",
                value: "test"
            });

            ast.node.interceptors[1].should.have.properties({
                'type': 'interceptor',
                'value': 'filter2'
            });
            ast.node.interceptors[1].args.should.be.instanceof(Array).and.have.lengthOf(0);

        });


        it('Reference nodes', function() {
            var ast = parser.parse('{#node val obj}#val #obj.val{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(3);
            ast.node.block[0].should.have.properties({
                type: "reference",
                value: ["val"]
            });
            ast.node.block[1].should.have.properties({
                type: "text",
                value: ' '
            });
            ast.node.block[2].should.have.properties({
                type: "reference",
                value: ["obj", "val"]
            });
        });

        it('Reference nodes with type handler', function() {
            var ast = parser.parse('{#node val}#val:string{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "reference",
                value: ["val"],
                handler: "string"
            });
        });

        it('Inline nodes', function() {
            var ast = parser.parse('{#node val obj}$val $obj.val{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(3);
            ast.node.block[0].should.have.properties({
                type: "inline",
                value: ["val"]
            });
            ast.node.block[1].should.have.properties({
                type: "text",
                value: ' '
            });
            ast.node.block[2].should.have.properties({
                type: "inline",
                value: ["obj", "val"]
            });
        });

        it('Inline nodes with type handler', function() {
            var ast = parser.parse('{#node val}$val:string{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "inline",
                value: ["val"],
                handler: "string"
            });
        });


        it('Fragment nodes', function() {
            var ast = parser.parse('{#node}{<frag/}{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "fragment",
                value: ["frag"]
            });
        });

        it('Fragment nodes with args', function() {
            var ast = parser.parse('{#node}{<frag var obj.var 123 -123 123.5 -123.5 "const" /}{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "fragment",
                value: ["frag"]
            });

            ast.node.block[0].args.should.be.instanceof(Array).and.have.lengthOf(7);
            ast.node.block[0].args[0].should.have.properties({
                type: "var",
                value: "var"
            });
            ast.node.block[0].args[1].should.have.properties({
                type: "var",
                value: "obj.var"
            });
            ast.node.block[0].args[2].should.have.properties({
                type: "const",
                value: Number(123)
            });
            ast.node.block[0].args[3].should.have.properties({
                type: "const",
                value: Number(-123)
            });
            ast.node.block[0].args[4].should.have.properties({
                type: "const",
                value: Number(123.5)
            });
            ast.node.block[0].args[5].should.have.properties({
                type: "const",
                value: Number(-123.5)
            });
            ast.node.block[0].args[6].should.have.properties({
                type: "const",
                value: "const"
            });
        });

        it('Section nodes', function() {
            var ast = parser.parse('{#node}{@section /}{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "section",
                value: "section"
            });
        });

        it('Section nodes with params', function() {
            var ast = parser.parse('{#node}{@section p1="value"/}{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "section",
                value: "section",
                params: {
                    p1: 'value'
                }
            });
        });

        it('Section nodes with block', function() {
            var ast = parser.parse('{#node}{@section p1="value"}text node{/section}{/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "section",
                value: "section",
                params: {
                    p1: 'value'
                }
            });

            ast.node.block[0].block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].block[0].should.have.properties({
                type: "text",
                value: "text node"
            });
        });

    });

    describe('#Escape()', function() {

        it('# $', function() {
            var ast = parser.parse('{#node}this is a left brace char : \\{, this is a pound char : \\#, this is a dollar char : \\${/node}');
            ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
            ast.node.block[0].should.have.properties({
                type: "text",
                value: "this is a left brace char : {, this is a pound char : #, this is a dollar char : $"
            });
        });

    });

    describe('#Nest()', function() {
        it('AST should equal', function() {
            var ast = parser.parse('{#nest}1{@nest1}2{@nest2}3{@nest3}4{/nest3}5{/nest2}6{/nest1}7{/nest}');
            ast.should.have.property('nest', {
                "name": "nest",
                "args": [],
                "interceptors": [],
                "block": [{
                    "type": "text",
                    "value": "1"
                }, {
                    "type": "section",
                    "value": "nest1",
                    "params": {},
                    "block": [{
                        "type": "text",
                        "value": "2"
                    }, {
                        "type": "section",
                        "value": "nest2",
                        "params": {},
                        "block": [{
                            "type": "text",
                            "value": "3"
                        }, {
                            "type": "section",
                            "value": "nest3",
                            "params": {},
                            "block": [{
                                "type": "text",
                                "value": "4"
                            }]
                        }, {
                            "type": "text",
                            "value": "5"
                        }]
                    }, {
                        "type": "text",
                        "value": "6"
                    }]
                }, {
                    "type": "text",
                    "value": "7"
                }]
            });
        });
    });

});