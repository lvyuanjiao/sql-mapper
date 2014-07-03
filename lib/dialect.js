
module.exports = (function() {

	// mysql | sqlite | postgres
	var dialect = 'mysql';
	
	return {

		'set': function(_dialect) {
		    if(['mysql', 'sqlite', 'postgres'].indexOf(_dialect) === -1) {
		        throw new Error('Unsupported dialect: ' + _dialect);
		    }
			dialect = _dialect;
		},
		
		'convert': function(sql) {
			switch (dialect) {
				case 'postgres':
					return toPostgresStyle(sql);
					break;
				case 'sqlite':
					return toPostgresStyle(sql);
					break;
				case 'mysql':
					return sql;
					break;
				default:
					return sql;
			}
		}
		
	};
	
})();

//TODO update required.
function toPostgresStyle(sql) {
	var array = sql.split('?');
	for(var i = 1; i < array.length; i++) {
		array[i-1] += ('$' + i);
	}
	return array.join('');
};
