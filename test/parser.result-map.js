'use strict';

var should = require('should');
var parser = require('../lib/parser');

var parserData = [{
  'title': 'Empty',
  'text': '{}',
  'AST': {}
}, {
  'title': 'Columns',
  'text': '{post:{id:p_id,title:p_title,content:p_content}}',
  'AST': {
    "post": {
      "id": [],
      "result": {
        "id": {
          "column": "p_id"
        },
        "title": {
          "column": "p_title"
        },
        "content": {
          "column": "p_content"
        }
      },
      "association": {},
      "collection": {}
    }
  }
}, {
  'title': 'Handler',
  'text': '{post:{created:p_created|date}}',
  'AST': {
    "post": {
      "id": [],
      "result": {
        "created": {
          "column": "p_created",
          "handler": "date",
          "params": []
        }
      },
      "association": {},
      "collection": {}
    }
  }
}, {
  'title': 'Handler with params',
  'text': '{post:{created:p_created|date p_name}}',
  'AST': {
    "post": {
      "id": [],
      "result": {
        "created": {
          "column": "p_created",
          "handler": "date",
          "params": ["p_name"]
        }
      },
      "association": {},
      "collection": {}
    }
  }
}, {
  'title': 'Id',
  'text': '{post:{*id:p_id}}',
  'AST': {
    "post": {
      "id": ["id"],
      "result": {
        "id": {
          "column": "p_id"
        }
      },
      "association": {},
      "collection": {}
    }
  }
}, {
  'title': 'Composite key',
  'text': '{post:{*id:p_id,*title:p_title}}',
  'AST': {
    "post": {
      "id": ["id", "title"],
      "result": {
        "id": {
          "column": "p_id"
        },
        "title": {
          "column": "p_title"
        }
      },
      "association": {},
      "collection": {}
    }
  }
}, {
  'title': 'Association',
  'text': '{post:{subcategory:{id:sub_category_id,name:sub_category_name}}}',
  'AST': {
    "post": {
      "id": [],
      "result": {},
      "association": {
        "subcategory": {
          "id": [],
          "result": {
            "id": {
              "column": "sub_category_id"
            },
            "name": {
              "column": "sub_category_name"
            }
          },
          "association": {},
          "collection": {}
        }
      },
      "collection": {}
    }
  }
}, {
  'title': 'Association with id',
  'text': '{post:{subcategory:{*id:sub_category_id,name:sub_category_name}}}',
  'AST': {
    "post": {
      "id": [],
      "result": {},
      "association": {
        "subcategory": {
          "id": ["id"],
          "result": {
            "id": {
              "column": "sub_category_id"
            },
            "name": {
              "column": "sub_category_name"
            }
          },
          "association": {},
          "collection": {}
        }
      },
      "collection": {}
    }
  }
}, {
  'title': 'Collection',
  'text': '{post:{tags:[id:tag_id,name:tag_name]}}',
  'AST': {
    "post": {
      "id": [],
      "result": {},
      "association": {},
      "collection": {
        "tags": {
          "id": [],
          "result": {
            "id": {
              "column": "tag_id"
            },
            "name": {
              "column": "tag_name"
            }
          },
          "association": {},
          "collection": {}
        }
      }
    }
  }
}, {
  'title': 'Collection with id',
  'text': '{post:{tags:[*id:tag_id,name:tag_name]}}',
  'AST': {
    "post": {
      "id": [],
      "result": {},
      "association": {},
      "collection": {
        "tags": {
          "id": ["id"],
          "result": {
            "id": {
              "column": "tag_id"
            },
            "name": {
              "column": "tag_name"
            }
          },
          "association": {},
          "collection": {}
        }
      }
    }
  }
}, {
  'title': 'Nest association',
  'text': '{post:{subcategory:{id:sub_category_id,name:sub_category_name,category:{id:category_id,name:category_name}}}}',
  'AST': {
    "post": {
      "id": [],
      "result": {},
      "association": {
        "subcategory": {
          "id": [],
          "result": {
            "id": {
              "column": "sub_category_id"
            },
            "name": {
              "column": "sub_category_name"
            }
          },
          "association": {
            "category": {
              "id": [],
              "result": {
                "id": {
                  "column": "category_id"
                },
                "name": {
                  "column": "category_name"
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
  }
}, {
  'title': 'Extend',
  'text': '{post:basic{author:author{},files:file[]}}',
  'AST': {
    "post": {
      "id": [],
      "result": {},
      "association": {
        "author": {
          "id": [],
          "result": {},
          "association": {},
          "collection": {},
          "extend": "author"
        }
      },
      "collection": {
        "files": {
          "id": [],
          "result": {},
          "association": {},
          "collection": {},
          "extend": "file"
        }
      },
      "extend": "basic"
    }
  }
}, {
  'title': 'Extend override',
  'text': '{post:basic{*id:p_id,created:p_created,author:author{age:p_age},files:file[mine:content_type]}}',
  'AST': {
    "post": {
      "id": ["id"],
      "result": {
        "id": {
          "column": "p_id"
        },
        "created": {
          "column": "p_created"
        }
      },
      "association": {
        "author": {
          "id": [],
          "result": {
            "age": {
              "column": "p_age"
            }
          },
          "association": {},
          "collection": {},
          "extend": "author"
        }
      },
      "collection": {
        "files": {
          "id": [],
          "result": {
            "mine": {
              "column": "content_type"
            }
          },
          "association": {},
          "collection": {},
          "extend": "file"
        }
      },
      "extend": "basic"
    }
  }
}];

describe('#Parse result map', function() {
  parserData.forEach(function(data) {
    it(data.title, function() {
      var ast = parser.parse(data.text).map;
      //console.log(JSON.stringify(ast));
      ast.should.have.properties(data.AST);
    });
  });
});
