var smp = require('../index');
var mapper = smp.mapper;
var path = require('path');
var should = require('should');

var mappersDir = 'mappers';

var post = {
	id: 123456,
	title: 'Post title',
	content: 'post test test test.',
	created_at: 1396068524019
};

var fields = ['id', 'title', 'content', 'created_at'];

function beauty(sql){
	return sql.replace(/\s+/g, ' ').trim();
};

describe('Test', function() {
	
	before(function(done) {		
		smp.build(path.join(__dirname, mappersDir), function(err) {
			done();
		});
	});
	
	describe('#mapper', function(){
		
		
		it('post#selectAll()', function(done) {
		
			mapper('post').selectAll(function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT * FROM post');
				values.should.eql([]);
				done();
			});
		
		});
		
		it('post#selectById()', function(done) {
		
			mapper('post').selectById(null, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT * FROM post');
				values.should.eql([]);
				done();
			});
		
		});
		
		it('post#selectById(id)', function(done) {
		
			mapper('post').selectById(123456, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT * FROM post WHERE id = ?');
				values.should.eql([123456]);
				done();
			});
		
		});
		
		it('post#update(obj)', function(done) {
		
			mapper('post').update(post, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('UPDATE post SET id = ? , title = ? , content = ? , created_at = ? WHERE id = ?');
				values.should.eql([ 123456, 'Post title', 'post test test test.', 1396068524019, 123456 ]);
				done();
			});
		
		});
		
		it('post#select()', function(done) {
		
			mapper('post').select(fields, 'create_at', function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT id , title , content , created_at FROM post ORDER BY create_at DESC');
				values.should.eql([]);
				done();
			});
		
		});		
		
		it('post#loop(test)', function(done) {
			var test = {
				'a': {'a':'b', 'c': 'd', 'e': 'f'},
				'b': ['a','b','c','d','e', 'f'],
			};
			mapper('post').loop(test, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('key = a i = 0 ( a i = 0 , k = ? , t= b ) ( a i = 1 , k = ? , t= d ) ( a i = 2 , k = ? , t= f ) i = 0 , key = b i = 1 ( b i = 0 , k = ? , t= a ) ( b i = 1 , k = ? , t= b ) ( b i = 2 , k = ? , t= c ) ( b i = 3 , k = ? , t= d ) ( b i = 4 , k = ? , t= e ) ( b i = 5 , k = ? , t= f ) i = 1 ,');
				values.should.eql([ 'a', 'c', 'e', '0', '1', '2', '3', '4', '5' ]);
				done();
			});
		
		});
		
		it('post#fragment()', function(done) {
		
			mapper('post').fragment(function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT id , title , content , created_at FROM post');
				values.should.eql([]);
				done();
			});
		
		});
		
		/**/
		
	});
	
	
});
