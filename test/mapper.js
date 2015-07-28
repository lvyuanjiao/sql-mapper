'use strict';

var path = require('path');
var should = require('should');
var mapper = require('../index');

function beauty(sql) {
    return sql.replace(/\s+/g, ' ').trim();
}

var post = {
    id: 123456,
    title: 'SQL-MAPPER',
    tags: 'sql,mapper,template',
    content: 'You should try this lib.',
    created: 1435307533417,
    category: 'nodejs',
    author: 'johnny'
};

describe('SQL Mapper', function() {

    before(function(done) {

        mapper.build({
            namespace: 'test',
            dialect: 'mysql',
            mappers: path.join(__dirname, 'mappers')
        }, function(err, mapper) {

            should.not.exist(err);
            should.exist(mapper);
            done();

        });

    });


    describe('#Simple query', function() {

        it('Query', function() {
            mapper('test').sql('post.select', function(sql, values) {
                beauty(sql).should.be.equal('SELECT * FROM post');
                values.should.be.empty();
            });
        });


        it('Query with built in args', function() {
            mapper('test').sql('post.builtInArgs', [], function(sql, values) {
                beauty(sql).should.be.equal('SELECT \'test, post, builtInArgs\'');
                values.should.be.empty();
            });
        });


        it('Query with empty args', function() {
            mapper('test').sql('post.select', [], function(sql, values) {
                beauty(sql).should.be.equal('SELECT * FROM post');
                values.should.be.empty();
            });
        });


        it('Query with inline', function() {
            mapper('test').sql('post.selectAll', ['created', 'ASC'], function(sql, values) {
                //console.log(beauty(sql), values);
                beauty(sql).should.be.equal('SELECT * FROM post ORDER BY created ASC');
                values.should.be.empty();
            });
        });


        it('Query with references', function() {
            mapper('test').sql('post.insert', post, function(sql, values) {
                beauty(sql).should.be.equal('INSERT INTO post(title, tags, content, created, category, author) VALUES(?, ?, ?, ?, ?, ?)');
                values.should.eql(['SQL-MAPPER', 'sql,mapper,template', 'You should try this lib.', 1435307533417, 'nodejs', 'johnny']);
            });
        });

    });


    describe('#Built in sections', function() {

        it('@if', function() {
            mapper('test').sql('post.search', ['johnny', 'nodejs'], function(sql, values) {
                beauty(sql).should.be.equal('SELECT * FROM post WHERE author = ? AND category = ?');
                values.should.eql(['johnny', 'nodejs']);
            });
        });

        it('@where', function() {
            mapper('test').sql('post.searchIfNotNull', ['johnny', 'nodejs'], function(sql, values) {
                beauty(sql).should.be.equal('SELECT * FROM post WHERE author = ? AND category = ?');
                values.should.eql(['johnny', 'nodejs']);
            });
        });

        it('@set', function() {
            mapper('test').sql('post.update', post, function(sql, values) {
                beauty(sql).should.be.equal('UPDATE post SET title = ?, tags = ?, description = ?, category = ? WHERE id = ?');
                values.should.eql(['SQL-MAPPER', 'sql,mapper,template', 'You should try this lib.', 'nodejs', 123456]);
            });
        });

        it('@each', function() {
            mapper('test').sql('post.updateIfNotNull', post, function(sql, values) {
                beauty(sql).should.be.equal('UPDATE post SET id = ?, title = ?, tags = ?, content = ?, created = ?, category = ?, author = ? WHERE id = ?');
                values.should.eql([123456, 'SQL-MAPPER', 'sql,mapper,template', 'You should try this lib.', 1435307533417, 'nodejs', 'johnny', 123456]);
            });
        });

        it('@each 2', function() {
            var test = {
                'a': {
                    'a': 'b',
                    'c': 'd',
                    'e': 'f'
                },
                'b': ['a', 'b', 'c', 'd', 'e', 'f'],
            };
            mapper('test').sql('post.loop', test, function(sql, values) {
                beauty(sql).should.be.equal('key = a i = 0 (a i = 0, k = ?, t=b) (a i = 1, k = ?, t=d) (a i = 2, k = ?, t=f) i = 0, key = b i = 1 (b i = 0, k = ?, t=a) (b i = 1, k = ?, t=b) (b i = 2, k = ?, t=c) (b i = 3, k = ?, t=d) (b i = 4, k = ?, t=e) (b i = 5, k = ?, t=f) i = 1,');
                values.should.eql(['a', 'c', 'e', '0', '1', '2', '3', '4', '5']);
            });
        });

    });


    describe('#Custom section', function() {

        before(function() {
            mapper('test').section.set('case', function(ctx, params, processBlock, callback) {
                var c = params['type'];
                var fn = (c === 'upper') ? 'toUpperCase' : 'toLowerCase';

                if (c !== 'upper' && c != 'lower') {
                    return processBlock(ctx, callback);
                }

                processBlock(ctx, function(sql, values) {
                    callback(sql[fn](), values);
                });
            });
        });

        it('@uppercase', function() {

            mapper('test').sql('post.uppercase', function(sql, values) {
                sql = beauty(sql);
                sql.should.equal('SELECT ID, TITLE, CONTENT, CREATED_AT FROM post');
                values.should.eql([]);
            });

        });

    });


    describe('#Fragment', function() {

        it('Query with fragment', function() {
            mapper('test').sql('post.selectByOffset', 12, function(sql, values) {
                beauty(sql).should.be.equal('SELECT title, tags, content, created, category, author FROM post LIMIT 12, 10');
                values.should.be.empty();
            });
        });

    });


    describe('#Built in type handler', function() {

        it('to int', function() {
            mapper('test').sql('post.limit', ["12", "10"], function(sql, values) {
                beauty(sql).should.be.equal('LIMIT 12, 10');
                values.should.be.empty();
            });
        });

    });

});




describe('SQL Mapper no namespace', function() {

    before(function(done) {

        mapper.build({
            dialect: 'mysql',
            mappers: __dirname + '/mappers'
        }, function(err, mapper) {

            should.not.exist(err);
            should.exist(mapper);
            done();

        });

    });


    describe('#Simple query', function() {

        it('Query', function() {
            mapper().sql('post.select', function(sql, values) {
                beauty(sql).should.be.equal('SELECT * FROM post');
                values.should.be.empty();
            });
        });
    });


});
