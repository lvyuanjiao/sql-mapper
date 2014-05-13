var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {    
  var line;
  if (node && node.first_line) {
    line = node.first_line;
    message += ' - ' + line + ':' + node.first_column;
  }

  var tmp = Error.prototype.constructor.call(this, message);  

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }
  
  console.log(this);

  if (line) {
    this.line_number = line;
    this.column = node.first_column;
  }
  
}

Exception.prototype = new Error();

module.exports = Exception;
