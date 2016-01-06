'use strict';

var path = require('path');
var should = require('should');
var data = require('./data');
var helper = require('./helper');

var testExpandData = [{
  'title': 'Map',
  'text': '{basic:{*id:id,title:title,content:content}}',
  'sqlName': 'test.basic',
  'AST': {
    "id": ["id"],
    "result": {
      "id": {
        "column": "id"
      },
      "title": {
        "column": "title"
      },
      "content": {
        "column": "content"
      }
    },
    "association": {},
    "collection": {}
  }
}, {
  'title': 'Association',
  'text': '{basic:{*id:id,title:title,author:{*id:author_id,name:author_name}}}',
  'sqlName': 'test.basic',
  'AST': {
    "id": ["id"],
    "result": {
      "id": {
        "column": "id"
      },
      "title": {
        "column": "title"
      }
    },
    "association": {
      "author": {
        "id": ["id"],
        "result": {
          "id": {
            "column": "author_id"
          },
          "name": {
            "column": "author_name"
          }
        },
        "association": {},
        "collection": {}
      }
    },
    "collection": {}
  }
}, {
  'title': 'Collection',
  'text': '{basic:{*id:id,title:title,files:[*id:file_id,name:file_name,size:file_size]}}',
  'sqlName': 'test.basic',
  'AST': {
    "id": ["id"],
    "result": {
      "id": {
        "column": "id"
      },
      "title": {
        "column": "title"
      }
    },
    "association": {},
    "collection": {
      "files": {
        "id": ["id"],
        "result": {
          "id": {
            "column": "file_id"
          },
          "name": {
            "column": "file_name"
          },
          "size": {
            "column": "file_size"
          }
        },
        "association": {},
        "collection": {}
      }
    }
  }
}, {
  'title': 'Extend association',
  'text': '{basic:{*id:id,title:title},main:basic{}}',
  'sqlName': 'test.main',
  'AST': {
    "id": ["id"],
    "result": {
      "id": {
        "column": "id"
      },
      "title": {
        "column": "title"
      }
    },
    "association": {},
    "collection": {}
  }
}, {
  'title': 'Extend collection',
  'text': '{basic:{*id:id,title:title},main:{posts:basic[]}}',
  'sqlName': 'test.main',
  'AST': {
    "id": [],
    "result": {},
    "association": {},
    "collection": {
      "posts": {
        "id": ["id"],
        "result": {
          "id": {
            "column": "id"
          },
          "title": {
            "column": "title"
          }
        },
        "association": {},
        "collection": {}
      }
    }
  }
}, {
  'title': 'Extend override',
  'text': '{basic:{*id:id,title:title},main:basic{*id:idx,*id2:id2,content:content}}',
  'sqlName': 'test.main',
  'AST': {
    "id": ["id", "id2"],
    "result": {
      "id": {
        "column": "idx"
      },
      "id2": {
        "column": "id2"
      },
      "content": {
        "column": "content"
      },
      "title": {
        "column": "title"
      }
    },
    "association": {},
    "collection": {}
  }
}, {
  'title': 'Extend override block',
  'text': '{info:{age:author_age,gender:author_gender},author:{*id:author_id,name:author_name,info:info{}},basic:{*id:id,title:title,author:author{}},main:basic{content:content,author:{avatar:author_avatar}}}',
  'sqlName': 'test.main',
  'AST': {
    "id": ["id"],
    "result": {
      "content": {
        "column": "content"
      },
      "id": {
        "column": "id"
      },
      "title": {
        "column": "title"
      }
    },
    "association": {
      "author": {
        "id": ["id"],
        "result": {
          "avatar": {
            "column": "author_avatar"
          },
          "id": {
            "column": "author_id"
          },
          "name": {
            "column": "author_name"
          }
        },
        "association": {
          "info": {
            "id": [],
            "result": {
              "age": {
                "column": "author_age"
              },
              "gender": {
                "column": "author_gender"
              }
            },
            "association": {},
            "collection": {}
          }
        },
        "collection": {}
      }
    },
    "collection": {}
  }
}];


var testMappingData = [{
  'title': 'Basic',
  'text': '{basic:{*id:id,title:title}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet"
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet"
  }]
}, {
  'title': 'Association',
  'text': '{basic:{*id:id,title:title,author:{id:author_id,name:author_name}}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    }
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    }
  }]
}, {
  'title': 'Nest association',
  'text': '{basic:{*id:id,title:title,category:{id:category_id,name:category_name,subcategory:{id:sub_category_id,name:sub_category_name}}}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "category": {
      "id": 100,
      "name": "3D",
      "subcategory": {
        "id": 102,
        "name": "3D printing"
      }
    }
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "category": {
      "id": 100,
      "name": "3D",
      "subcategory": {
        "id": 102,
        "name": "3D printing"
      }
    }
  }]
}, {
  'title': 'Multi associations',
  'text': '{basic:{*id:id,title:title,author:{id:author_id,name:author_name},category:{id:category_id,name:category_name,subcategory:{id:sub_category_id,name:sub_category_name}}}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "category": {
      "id": 100,
      "name": "3D",
      "subcategory": {
        "id": 102,
        "name": "3D printing"
      }
    },
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    }
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "category": {
      "id": 100,
      "name": "3D",
      "subcategory": {
        "id": 102,
        "name": "3D printing"
      }
    },
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    }
  }]
}, {
  'title': 'Collection',
  'text': '{basic:{*id:id,title:title,files:[*id:file_id,name:file_name,size:file_size]}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }]
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }]
  }]
}, {
  'title': 'Mutil collection',
  'text': '{basic:{*id:id,title:title,files:[*id:file_id,name:file_name,size:file_size],tags:[*id:tag_id,name:tag_name]}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }],
    "tags": [{
      'id': 32,
      'name': 'new'
    }, {
      'id': 33,
      'name': 'desktop'
    }, {
      'id': 34,
      'name': 'manager'
    }]
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }],
    "tags": [{
      'id': 32,
      'name': 'new'
    }, {
      'id': 33,
      'name': 'desktop'
    }, {
      'id': 34,
      'name': 'manager'
    }]
  }]
}, {
  'title': 'Association and collection',
  'text': '{basic:{*id:id,title:title,author:{*id:author_id,name:author_name},files:[*id:file_id,name:file_name,size:file_size]}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    },
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }]
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    },
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }]
  }]
}, {
  'title': 'Mutil associations and collections',
  'text': '{basic:{*id:id,title:title,author:{*id:author_id,name:author_name},category:{*id:category_id,name:category_name,subcategory:{*id:sub_category_id,name:sub_category_name}},files:[*id:file_id,name:file_name,size:file_size],tags:[*id:tag_id,name:tag_name]}}',
  'data': data,
  'sqlName': ['test', 'basic'],
  'results': [{
    "id": 1234,
    "title": "Lorem ipsum dolor sit amet",
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    },
    "category": {
      "id": 100,
      "name": "3D",
      "subcategory": {
        "id": 102,
        "name": "3D printing"
      }
    },
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }],
    "tags": [{
      'id': 32,
      'name': 'new'
    }, {
      'id': 33,
      'name': 'desktop'
    }, {
      'id': 34,
      'name': 'manager'
    }]
  }, {
    "id": 1235,
    "title": "Lorem ipsum dolor sit amet",
    "author": {
      "id": 5461,
      "name": "Lv Yuanjiao"
    },
    "category": {
      "id": 100,
      "name": "3D",
      "subcategory": {
        "id": 102,
        "name": "3D printing"
      }
    },
    "files": [{
      "id": 1,
      "name": "img_1.jpg",
      "size": 854
    }, {
      "id": 2,
      "name": "img_2.png",
      "size": 3423
    }, {
      "id": 3,
      "name": "img_3.jpg",
      "size": 54354
    }, {
      "id": 4,
      "name": "img_4.svg",
      "size": 6453
    }, {
      "id": 5,
      "name": "img_5.svg",
      "size": 995454
    }],
    "tags": [{
      'id': 32,
      'name': 'new'
    }, {
      'id': 33,
      'name': 'desktop'
    }, {
      'id': 34,
      'name': 'manager'
    }]
  }]
}];

describe('Mapper', function() {

  describe('#Expand AST', function() {
    testExpandData.forEach(function(item) {
      it(item.title, function(done) {
        helper.contruct('test', item.text, function(err, mapper) {
          var mn = item.sqlName.split('.');
          mapper.getResultMap(mn[0], mn[1]).expand(function(ast) {
            ast.should.eql(item.AST);
            done();
          });
        });
      });
    });
  });

  describe('#Mapping', function() {
    testMappingData.forEach(function(item) {
      it(item.title, function(done) {
        helper.contruct('test', item.text, function(err, mapper) {
          mapper.getResultMap(item.sqlName[0], item.sqlName[1]).mapping(item.data, function(err, results) {
            results.should.eql(item.results);
            done();
          });
        });
      });
    });
  });

});
