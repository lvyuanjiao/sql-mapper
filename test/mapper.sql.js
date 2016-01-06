'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

var post = {
  id: 123456,
  title: 'Lorem ipsum dolor sit amet',
  tags: 'sql,mapper,template',
  content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  created: 1435307533417,
  category: 'nodejs',
  author: 'johnny'
};
var testData = [{
  'title': 'SQL',
  'sqlName': 'test.select',
  'text': '{#select}SELECT * FROM post{/select}',
  'args': [],
  'sql': 'SELECT * FROM post',
  'values': []
}, {
  'title': 'Inline',
  'sqlName': 'test.selectAll',
  'text': '{#selectAll(sort,order)}SELECT * FROM post ORDER BY $sort $order{/selectAll}',
  'args': ['created', 'ASC'],
  'sql': 'SELECT * FROM post ORDER BY created ASC',
  'values': []
}, {
  'title': 'References',
  'sqlName': 'test.insert',
  'text': '{#insert(post)}INSERT INTO post(title, tags, content, created, category, author) VALUES(#post.title, #post.tags, #post.content, #post.created, #post.category, #post.author){/insert}',
  'args': [post],
  'sql': 'INSERT INTO post(title, tags, content, created, category, author) VALUES(?, ?, ?, ?, ?, ?)',
  'values': [post.title, post.tags, post.content, post.created, post.category, post.author]
}, {
  'title': 'Built in vars',
  'sqlName': 'test.builtInVars',
  'text': '{#builtInVars}SELECT \'$__database, $__namespace, $__entry\'{/builtInVars}',
  'args': [],
  'sql': 'SELECT \'test, test, builtInVars\'',
  'values': []
}, {
  'title': '@if',
  'sqlName': 'test.search',
  'text': '{#search(author,category)}SELECT * FROM post WHERE {@if test="#author"}author = #author{/if}{@if test="#category"} AND category = #category{/if}{/search}',
  'args': ['johnny', 'nodejs'],
  'sql': 'SELECT * FROM post WHERE author = ? AND category = ?',
  'values': ['johnny', 'nodejs']
}, {
  'title': '@where',
  'sqlName': 'test.searchIfNotNull',
  'text': '{#searchIfNotNull(author,category)}SELECT * FROM post {@where}{@if test="#author"}AND author = #author{/if}{@if test="#category"} AND category = #category{/if}{/where}{/searchIfNotNull}',
  'args': ['johnny', 'nodejs'],
  'sql': 'SELECT * FROM post WHERE author = ? AND category = ?',
  'values': ['johnny', 'nodejs']
}, {
  'title': '@set',
  'sqlName': 'test.update',
  'text': '{#update(post)}UPDATE post {@set}{@if test="#post.title"} title = #post.title,{/if}{@if test="#post.tags"} tags = #post.tags,{/if}{@if test="#post.content"} content = #post.content,{/if}{@if test="#post.category"} category = #post.category,{/if}{/set}{@where}id = #post.id{/where}{/update}',
  'args': [post],
  'sql': 'UPDATE post SET title = ?, tags = ?, content = ?, category = ? WHERE id = ?',
  'values': [post.title, post.tags, post.content, post.category, post.id]
}, {
  'title': '@each',
  'sqlName': 'test.updateIfNotNull',
  'text': '{#updateIfNotNull(post)}UPDATE post {@set}{@each value="#post"}{@if test="#item"}$key = #item,{/if}{/each}{/set}WHERE id = #post.id{/updateIfNotNull}',
  'args': [post],
  'sql': 'UPDATE post SET id = ?,title = ?,tags = ?,content = ?,created = ?,category = ?,author = ? WHERE id = ?',
  'values': [post.id, post.title, post.tags, post.content, post.created, post.category, post.author, post.id]
}, {
  'title': 'Fragment',
  'sqlName': 'test.selectByOffset',
  'text': '{#fields}title, tags, content, created, category, author{/fields}{#limit(offset,rows)}LIMIT $offset, $rows{/limit}{#selectByOffset(offset)}SELECT {<fields/} FROM post {<limit(offset,10)/}{/selectByOffset}',
  'args': [12],
  'sql': 'SELECT title, tags, content, created, category, author FROM post LIMIT 12, 10',
  'values': []
}, {
  'title': 'Type handler',
  'sqlName': 'test.limit',
  'text': '{#limit(offset,rows)}LIMIT #offset:int, #rows:int{/limit}',
  'args': ["12", "10"],
  'sql': 'LIMIT ?, ?',
  'values': [12, 10]
}];


describe('#Mapper SQL', function() {

  testData.forEach(function(item) {
    it(item.title, function(done) {
      helper.contruct('test', item.text, function(err, mapper){
        mapper.sql(item.sqlName, item.args, function(sql, values) {
          //console.log(sql, values);
          helper.beauty(sql).should.be.equal(item.sql);
          values.should.eql(item.values);
          done();
        });
      });
    });
  });

  describe('#Custom section', function() {
    it('@case', function(done) {

      helper.contruct('test', '{#case}SELECT {@case type="upper"}id, title, CONTENT, CREATED_AT{/case} FROM post{/case}', function(err, mapper){

        mapper.section.set('case', function(ctx, params, processBlock, callback) {
          var c = params['type'];
          var fn = (c === 'upper') ? 'toUpperCase' : 'toLowerCase';
          if (c !== 'upper' && c != 'lower') {
            return processBlock(ctx, callback);
          }
          processBlock(ctx, function(sql, values) {
            callback(sql[fn](), values);
          });
        });

        mapper.sql('test.case', [], function(sql, values) {
          //console.log(sql, values);
          helper.beauty(sql).should.equal('SELECT ID, TITLE, CONTENT, CREATED_AT FROM post');
          values.should.eql([]);
          done();
        });

      });

    });
  });

});
