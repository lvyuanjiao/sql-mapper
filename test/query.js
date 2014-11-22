var mapper = require('../lib/mapper');
var path = require('path');
var should = require('should');

var post = {
	id: 123456,
	title: 'Post title',
	content: 'post content',
	created_at: 1396068524019
};

function beauty(sql) {
	return sql.replace(/\s+/g, ' ').trim();
};

var fakeConnection = {
	'query': function(sql, values, done) {
		done(null, {'sql': sql, 'values': values});
	}
};

describe('QUERY', function() {
	
	before(function(done) {
		mapper.build({
			namespace: 'test',
			mappers: path.join(__dirname, 'mappers'),
			getConnection: function(callback){
				callback(null, fakeConnection);
			}
		}, function(err) {
			done();
		});
	});	
	
	describe('#query', function(){
		it('post#selectAll()', function(done) {
			
			mapper.query('post.selectAll', function(err, result) {
				result.sql = beauty(result.sql);
				result.sql.should.equal('SELECT * FROM post');
				result.values.should.eql([]);
				done();
			});
		
		});
	});
	
	describe('#transaction', function(){
		it('post#delete()', function(done) {
			
			// 1
			mapper.query('post.update', post, function(err, result) {
				result.sql = beauty(result.sql);
				result.sql.should.equal('UPDATE post SET id = ? , title = ? , content = ? , created_at = ? WHERE id = ?');
				result.values.should.eql([ 123456, 'Post title', 'post content', 1396068524019, 123456 ]);
				
				// 2				
				mapper.query('post.deleteById', post.id, function(err, result) {
					result.sql = beauty(result.sql);
					result.sql.should.equal('DELETE FROM post WHERE id = ?');
					result.values.should.eql([ 123456 ]);
					done();
				}, fakeConnection);
				
			}, fakeConnection);
		
		});
	});
	
});
