'use strict';

var should = require('should');
var parser = require('../lib/parser');

var testData = [{
  title: 'Text',
  query: '{#query}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Args',
  query: '{#query(name,age)}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": ['name', 'age'],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Map',
  query: '{#query:map}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": 'map',
      "cache": null,
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Cache',
  query: '{#query+}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": {
        "key": "",
        "type": "cache"
      },
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Cache with key',
  query: '{#query+cacheKey}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": {
        "key": "cacheKey",
        "type": "cache"
      },
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Flush',
  query: '{#query-}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": {
        "key": "",
        "type": "flush"
      },
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Flush with key',
  query: '{#query-cacheKey}text{/query}',
  ast: {
    query: {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": {
        "key": "cacheKey",
        "type": "flush"
      },
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Plugin',
  query: '{#query|filter1 arg ext.arg "string" 123 |filter2}text{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": [],
      "plugins": [{
        "value": "filter1",
        "args": [{
          "type": "var",
          "value": ["arg"]
        }, {
          "type": "var",
          "value": ["ext", "arg"]
        }, {
          "type": "const",
          "value": "string"
        }, {
          "type": "const",
          "value": 123
        }]
      }, {
        "value": "filter2",
        "args": []
      }],
      "map": null,
      "cache": null,
      "block": [{
        "type": "text",
        "value": "text"
      }]
    }
  }
}, {
  title: 'Reference',
  query: '{#query(val,obj)}#val #obj.val #val:int{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": ["val", "obj"],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "reference",
        "value": ["val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "reference",
        "value": ["obj", "val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "reference",
        "value": ["val"],
        "handler": "int"
      }]
    }
  }
}, {
  title: 'Inline',
  query: '{#query(val,obj)}$val $obj.val $val:int{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": ["val", "obj"],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "inline",
        "value": ["val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "inline",
        "value": ["obj", "val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "inline",
        "value": ["val"],
        "handler": "int"
      }]
    }
  }
}, {
  title: 'Fragment',
  query: '{#query}{<frag(var,obj.var,123,-123,123.5,-123.5,"const")/}{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "fragment",
        "value": "frag",
        "args": [{
          "type": "var",
          "value": ["var"]
        }, {
          "type": "var",
          "value": ["obj", "var"]
        }, {
          "type": "const",
          "value": 123
        }, {
          "type": "const",
          "value": -123
        }, {
          "type": "const",
          "value": 123.5
        }, {
          "type": "const",
          "value": -123.5
        }, {
          "type": "const",
          "value": "const"
        }]
      }]
    }
  }
}, {
  title: 'Section',
  query: '{#query}{@selfClose/}{@selfClose p1/}{@section p1="value"}text node{/section}{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "section",
        "value": "selfClose",
        "params": {},
        "block": []
      }, {
        "type": "section",
        "value": "selfClose",
        "params": {
          "p1": true
        },
        "block": []
      }, {
        "type": "section",
        "value": "section",
        "params": {
          "p1": "value"
        },
        "block": [{
          "type": "text",
          "value": "text node"
        }]
      }]
    }
  }
}, {
  title: 'Nest section',
  query: '{#nest}1{@nest1}2{@nest2}3{@nest3}4{/nest3}5{/nest2}6{/nest1}7{/nest}',
  ast: {
    "nest": {
      "name": "nest",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        "type": "text",
        "value": "1"
      }, {
        "type": "section",
        "value": "nest1",
        "params": {},
        "block": [{
          "type": "text",
          "value": "2"
        }, {
          "type": "section",
          "value": "nest2",
          "params": {},
          "block": [{
            "type": "text",
            "value": "3"
          }, {
            "type": "section",
            "value": "nest3",
            "params": {},
            "block": [{
              "type": "text",
              "value": "4"
            }]
          }, {
            "type": "text",
            "value": "5"
          }]
        }, {
          "type": "text",
          "value": "6"
        }]
      }, {
        "type": "text",
        "value": "7"
      }]
    }
  }
}, {
  title: 'Escape',
  query: '{#query}this is a left brace char: \\{, this is a pound char: \\#, this is a dollar char: \\$, this is a slash char: \\\\{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": [],
      "plugins": [],
      "map": null,
      "cache": null,
      "block": [{
        type: 'text',
        value: 'this is a left brace char: {, this is a pound char: #, this is a dollar char: $, this is a slash char: \\'
      }]
    }
  }
}, {
  title: 'Combi',
  query: '{#query(val, obj):map+cacheKey |filter1 arg ext.arg "string" 123 |filter2}#val #obj.val #val:int $val $obj.val $val:int{<frag(var,obj.var,123,-123,123.5,-123.5,"const")/}{@selfClose/}{@selfClose p1/}{@section p1="value"}text node{/section} 1{@nest1}2{@nest2}3{@nest3}4{/nest3}5{/nest2}6{/nest1}7 this is a left brace char: \\{, this is a pound char: \\#, this is a dollar char: \\$, this is a slash char: \\\\{/query}',
  ast: {
    "query": {
      "name": "query",
      "args": ["val", "obj"],
      "plugins": [{
        "value": "filter1",
        "args": [{
          "type": "var",
          "value": ["arg"]
        }, {
          "type": "var",
          "value": ["ext", "arg"]
        }, {
          "type": "const",
          "value": "string"
        }, {
          "type": "const",
          "value": 123
        }]
      }, {
        "value": "filter2",
        "args": []
      }],
      "map": "map",
      "cache": {
        "type": "cache",
        "key": "cacheKey"
      },
      "block": [{
        "type": "reference",
        "value": ["val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "reference",
        "value": ["obj", "val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "reference",
        "value": ["val"],
        "handler": "int"
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "inline",
        "value": ["val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "inline",
        "value": ["obj", "val"]
      }, {
        "type": "text",
        "value": " "
      }, {
        "type": "inline",
        "value": ["val"],
        "handler": "int"
      }, {
        "type": "fragment",
        "value": "frag",
        "args": [{
          "type": "var",
          "value": ["var"]
        }, {
          "type": "var",
          "value": ["obj", "var"]
        }, {
          "type": "const",
          "value": 123
        }, {
          "type": "const",
          "value": -123
        }, {
          "type": "const",
          "value": 123.5
        }, {
          "type": "const",
          "value": -123.5
        }, {
          "type": "const",
          "value": "const"
        }]
      }, {
        "type": "section",
        "value": "selfClose",
        "params": {},
        "block": []
      }, {
        "type": "section",
        "value": "selfClose",
        "params": {
          "p1": true
        },
        "block": []
      }, {
        "type": "section",
        "value": "section",
        "params": {
          "p1": "value"
        },
        "block": [{
          "type": "text",
          "value": "text node"
        }]
      }, {
        "type": "text",
        "value": " 1"
      }, {
        "type": "section",
        "value": "nest1",
        "params": {},
        "block": [{
          "type": "text",
          "value": "2"
        }, {
          "type": "section",
          "value": "nest2",
          "params": {},
          "block": [{
            "type": "text",
            "value": "3"
          }, {
            "type": "section",
            "value": "nest3",
            "params": {},
            "block": [{
              "type": "text",
              "value": "4"
            }]
          }, {
            "type": "text",
            "value": "5"
          }]
        }, {
          "type": "text",
          "value": "6"
        }]
      }, {
        "type": "text",
        "value": "7 this is a left brace char: {, this is a pound char: #, this is a dollar char: $, this is a slash char: \\"
      }]
    }
  }
}];

describe('#Parse SQL', function() {

  testData.forEach(function(item) {
    it(item.title, function() {
      var ast = parser.parse(item.query).sql;
      // console.log(JSON.stringify(ast));
      ast.should.eql(item.ast);
    });
  });

});
