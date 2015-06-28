# sql-mapper
[![Build Status](https://travis-ci.org/lvyuanjiao/sql-mapper.png)](https://travis-ci.org/lvyuanjiao/sql-mapper)

## Install

```bash
npm install sql-mapper
```
## Introduction
A sql mapper in node.js like [mybatis](http://mybatis.org) template in java

## Basic usage

Create a mapper **post.smp** in folder **mappers**
```sql
{#select id}
    SELECT * FROM post WHERE id = #id
{/select}
```

build and query
```js
var path = require('path');
var mapper = require('sql-mapper');
// build from mappers folder
mapper.build({
        dialect: 'mysql',
        mappers: path.join(__dirname, 'mappers')
    }, function(err) {
    
    if(err) throw err;
    // query
    mapper().sql('post.select', 123456, function(sql, values){
        console.log(sql); //SELECT * FROM post WHERE id = ?
        console.log(values); //[ 123456 ]
    });

});
```

## Namespace

## Parameter
See how feel

post.smp
```sql
{#selectByAuthor author order}
    SELECT * FROM post WHERE author = #author ORDER BY $order
{/selectByAuthor}
```
query
```js
var mapper = require('sql-mapper');
mapper().sql('post.selectByAuthor', ['johnny', 'created_at'], function(sql, values){
    console.log(sql); //SELECT * FROM post WHERE author = ? ORDER BY created_at
    console.log(values); //[ 'johnny' ]
});
```
As the code above
* **Reference** start with `#`
* **Inline** satart with `$`

**Caution**：inline parameter leads to potential SQL Injection attacks, be careful.

## Section
Take a look

post.smp
```sql
{#select author}
    SELECT * FROM post
    {@if test="#author"}
        WHERE author = #author
    {/if}
{/select}
```
query
```js
var mapper = require('sql-mapper');

mapper().sql('post.select', 'johnny', function(sql, values){
    console.log(sql); //SELECT * FROM post WHERE author = ?
    console.log(values); //[ 'johnny' ]
});

mapper().sql('post.select', function(sql, values){
    console.log(sql); //SELECT * FROM post
    console.log(values); //[ ]
});
```

### Built-in sections
#### @if
#### @each
#### @where
#### @set
#### @trim

### Custom section

## Fragment
Use fragment feature to write reusable code

```sql
{#fields}
    id , title , content , created_at
{/fields}

{#select}
    SELECT {<fields} FROM post
{/select}
```
As a result
```js
var mapper = require('sql-mapper');

mapper().sql('post.select', function(sql, values){
    console.log(sql); //SELECT id , title , content , created_at FROM post
    console.log(values); //[ ]
});
```

### Fragment with arguments

## Dialect

## Tests
Run `npm install` & `npm test` in **sql-mapper** folder

## Todo
* Type handler
* Improve readme

## License
MIT