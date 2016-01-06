'use strict';

// struct
/*
id,
title,
content,
category:
  id,
  name
  subcategory:
    id,
    name
author:
  id,
  name
files:
  id,
  name,
  size,
  type
tags:
  id,
  name
*/

function copyTo(source, dest) {
  for (var k in source) {
    dest[k] = source[k];
  }
}

var rows = [];
var post = {
  'id': 1234,
  'title': 'Lorem ipsum dolor sit amet'
};
var category_printing = {
  'category_id': 100,
  'category_name': '3D',
  'sub_category_id': 102,
  'sub_category_name': '3D printing'
};
var category_art = {
  'category_id': 103,
  'category_name': 'ART',
  'sub_category_id': 107,
  'sub_category_name': 'ele'
};
var author = {
  'author_id': 5461,
  'author_name': 'Lv Yuanjiao',
};
var files = [{
  'file_id': 1,
  'file_name': 'img_1.jpg',
  'file_size': 854
}, {
  'file_id': 2,
  'file_name': 'img_2.png',
  'file_size': 3423
}, {
  'file_id': 3,
  'file_name': 'img_3.jpg',
  'file_size': 54354
}, {
  'file_id': 4,
  'file_name': 'img_4.svg',
  'file_size': 6453
}, {
  'file_id': 5,
  'file_name': 'img_5.svg',
  'file_size': 995454
}];
var tags = [{
  'tag_id': 32,
  'tag_name': 'new'
}, {
  'tag_id': 33,
  'tag_name': 'desktop'
}, {
  'tag_id': 34,
  'tag_name': 'manager'
}];

var postWithCategoryAndOwner = {};
copyTo(post, postWithCategoryAndOwner);
copyTo(category_printing, postWithCategoryAndOwner);
copyTo(author, postWithCategoryAndOwner);

var postWithCategoryAndOwnerAndFiles = [];
files.forEach(function(file) {
  var item = {};
  copyTo(postWithCategoryAndOwner, item);
  copyTo(file, item);
  postWithCategoryAndOwnerAndFiles.push(item);
});

var postWithCategoryAndOwnerAndFilesAndTags = [];
tags.forEach(function(tag) {
  postWithCategoryAndOwnerAndFiles.forEach(function(row) {
    var item = {};
    copyTo(row, item);
    copyTo(tag, item);
    postWithCategoryAndOwnerAndFilesAndTags.push(item);
  });
});

var postsWithCategoryAndOwnerAndFilesAndTags = [].concat(postWithCategoryAndOwnerAndFilesAndTags);
postWithCategoryAndOwnerAndFilesAndTags.forEach(function (post) {
  var item = {};
  copyTo(post, item);
  item.id = 1235;
  postsWithCategoryAndOwnerAndFilesAndTags.push(item);
});

module.exports = postsWithCategoryAndOwnerAndFilesAndTags;
