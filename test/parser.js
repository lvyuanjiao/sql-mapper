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
				name:"text",
				value:"text"
			});
        });


        it('Reference nodes', function() {
			var ast = parser.parse('{#node val obj}#val #obj.val{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(3);
			ast.node.block[0].should.have.properties({
				name: "reference",
				value: ["val"]
			});
			ast.node.block[1].should.have.properties({
				name: "text",
				value: ' '
			});
			ast.node.block[2].should.have.properties({
				name: "reference",
				value: ["obj","val"]
			});
        });

        it('Reference nodes with type handler', function() {
			var ast = parser.parse('{#node val}#val:string{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name: "reference",
				value: ["val"],
				type: "string"
			});
        });

        it('Inline nodes', function() {
			var ast = parser.parse('{#node val obj}$val $obj.val{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(3);
			ast.node.block[0].should.have.properties({
				name: "inline",
				value: ["val"]
			});
			ast.node.block[1].should.have.properties({
				name: "text",
				value: ' '
			});
			ast.node.block[2].should.have.properties({
				name: "inline",
				value: ["obj","val"]
			});
        });

        it('Inline nodes with type handler', function() {
			var ast = parser.parse('{#node val}$val:string{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name: "inline",
				value: ["val"],
				type: "string"
			});
        });


        it('Fragment nodes', function() {
			var ast = parser.parse('{#node}{<frag/}{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name: "fragment",
				value: ["frag"]
			});
        });

        it('Fragment nodes with args', function() {
			var ast = parser.parse('{#node}{<frag var 123 "const" /}{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name: "fragment",
				value: ["frag"]
			});

			ast.node.block[0].args.should.be.instanceof(Array).and.have.lengthOf(3);
			ast.node.block[0].args[0].should.have.properties({
				name: "var",
				value: "var"
			});
			ast.node.block[0].args[1].should.have.properties({
				name: "const",
				value: 123
			});
			ast.node.block[0].args[2].should.have.properties({
				name: "const",
				value: "const"
			});
        });

        it('Section nodes', function() {
			var ast = parser.parse('{#node}{@section /}{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name: "section",
				value: "section"
			});
        });

        it('Section nodes with params', function() {
			var ast = parser.parse('{#node}{@section p1="value"/}{/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name: "section",
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
				name: "section",
				value: "section",
				params: {
					p1: 'value'
				}
			});

			ast.node.block[0].block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].block[0].should.have.properties({
				name:"text",
				value:"text node"
			});
        });

    });

	describe('#Escape()', function() {

		it('# $', function() {
			var ast = parser.parse('{#node}this is a left brace char : \\{, this is a pound char : \\#, this is a dollar char : \\${/node}');
			ast.node.block.should.be.instanceof(Array).and.have.lengthOf(1);
			ast.node.block[0].should.have.properties({
				name:"text",
				value:"this is a left brace char : {, this is a pound char : #, this is a dollar char : $"
			});
		});

    });

    describe('#Nest()', function() {
        it('AST should equal', function() {
			var ast = parser.parse('{#nest}1{@nest1}2{@nest2}3{@nest3}4{/nest3}5{/nest2}6{/nest1}7{/nest}');
			ast.should.have.property('nest', {"name":"nest","args":[],"filters":[],"block":[{"name":"text","value":"1"},{"name":"section","value":"nest1","params":{},"block":[{"name":"text","value":"2"},{"name":"section","value":"nest2","params":{},"block":[{"name":"text","value":"3"},{"name":"section","value":"nest3","params":{},"block":[{"name":"text","value":"4"}]},{"name":"text","value":"5"}]},{"name":"text","value":"6"}]},{"name":"text","value":"7"}]});
        });
    });

});