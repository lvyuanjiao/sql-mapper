# sql-mapper

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
{/#select}
```

build and query
```js
var path = require('path');
var mapper = require('sql-mapper');
// build from mappers folder
mapper.build(path.join(__dirname, 'mappers'), function(err) {
    if(err) throw err;
    // query
    mapper.get('post').select(123456, function(sql, values){
        console.log(sql); //SELECT * FROM post WHERE id = ?
        console.log(values); //[ 123456 ]
    });
});
```

## Parameter
See how feel

post.smp
```sql
{#selectByAuthor author order}
    SELECT * FROM post WHERE author = #author ORDER BY $order
{/#selectByAuthor}
```
query
```js
var mapper = require('sql-mapper').get;
mapper('post').selectByAuthor('johnny', 'created_at', function(sql, values){
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
    {/@if}
{/#select}
```
query
```js
var mapper = require('sql-mapper').get;

mapper('post').select('johnny', function(sql, values){
    console.log(sql); //SELECT * FROM post WHERE author = ?
    console.log(values); //[ 'johnny' ]
});

mapper('post').select(function(sql, values){
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
{/#fields}

{#select}
    SELECT {>fields/} FROM post
{/#select}
```
As a result
```js
var mapper = require('sql-mapper').get;

mapper('post').select(function(sql, values){
    console.log(sql); //SELECT id , title , content , created_at FROM post
    console.log(values); //[ ]
});

```
## Dialect (mysql, sqlite, postgres)
Set dialect use `smp.build(dir, dialect, done);`
```js
var path = require('path');
var mapper = require('sql-mapper');
mapper.build(path.join(__dirname, 'mappers'), 'postgres', function(err) {
    if(err) throw err;
    mapper.get('post').select(123456, function(sql, values){
        console.log(sql); //SELECT * FROM post WHERE id = $1
        console.log(values); //[ 123456 ]
    });
});
```

## Tests
Run `npm install` & `npm test` in **sql-mapper** folder

## License
MIT