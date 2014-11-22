var mapper = require('../lib/mapper');
var path = require('path');
var should = require('should');

var post = {
	id: 123456,
	title: 'Post title',
	content: 'post content',
	created_at: 1396068524019
};

var fields = ['id', 'title', 'content', 'created_at'];

function beauty(sql) {
	return sql.replace(/\s+/g, ' ').trim();
};

describe('SQL', function() {
	
	before(function(done) {
		mapper.build({
			namespace: 'test',
			mappers: path.join(__dirname, 'mappers')
		}, function(err) {
			done();
		});
	});
	
	describe('#basic usage', function(){
				
		it('post#selectAll()', function(done) {
		
			mapper.namespace('test').sql('post.selectAll', function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT * FROM post');
				values.should.eql([]);
				done();
			});
		
		});
		
		it('post#selectById(id)', function(done) {
			mapper.sql('post.selectById', 123456, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT * FROM post WHERE id = ?');
				values.should.eql([123456]);
				done();
			});
		});
		
		it('post#selectById() ignore parameters', function(done) {
			mapper.sql('post.selectById', function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT * FROM post');
				values.should.eql([]);
				done();
			});
		});
		
		it('post#select() with inline parameter', function(done) {
			mapper.sql('post.select', [fields, 'create_at'], function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT id , title , content , created_at FROM post ORDER BY create_at DESC');
				values.should.eql([]);
				done();
			});
		});
		
		it('post#update(obj)', function(done) {
			mapper.sql('post.update', post, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('UPDATE post SET id = ? , title = ? , content = ? , created_at = ? WHERE id = ?');
				values.should.eql([ 123456, 'Post title', 'post content', 1396068524019, 123456 ]);
				done();
			});
		});
		
		it('post#fragment(obj), fragment with parameter', function(done) {
			mapper.sql('post.fragment', 'created', function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT id , title , content , created_at AS created FROM post');
				values.should.eql([]);
				done();
			});
		});
		
		it('post#loop(obj)', function(done) {
			var test = {
				'a': {'a':'b', 'c': 'd', 'e': 'f'},
				'b': ['a','b','c','d','e', 'f'],
			};
			mapper.sql('post.loop', test, function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('key = a i = 0 ( a i = 0 , k = ? , t= b ) ( a i = 1 , k = ? , t= d ) ( a i = 2 , k = ? , t= f ) i = 0 , key = b i = 1 ( b i = 0 , k = ? , t= a ) ( b i = 1 , k = ? , t= b ) ( b i = 2 , k = ? , t= c ) ( b i = 3 , k = ? , t= d ) ( b i = 4 , k = ? , t= e ) ( b i = 5 , k = ? , t= f ) i = 1 ,');
				values.should.eql([ 'a', 'c', 'e', '0', '1', '2', '3', '4', '5' ]);
				done();
			});
		});		
		
	});
	
	describe('#custom section', function(){
		before(function() {
			mapper.section.set('case', function(params, ctx, next, done){
				var c = params['type'];
				if(c === 'upper') {
					next(ctx, function(sql, values){
						done(sql.toUpperCase(), values);
					});
				} else if(c === 'lower') {
					next(ctx, function(sql, values){
						done(sql.toLowerCase(), values);
					});
				} else {
					next(ctx, done);
				}
			});
		});
		
		it('post#uppercase()', function(done) {
			
			mapper.sql('post.uppercase', function(sql, values) {
				sql = beauty(sql);
				sql.should.equal('SELECT ID , TITLE , CONTENT , CREATED_AT FROM post');
				values.should.eql([]);
				done();
			});
		
		});
		
	});	
	
});
