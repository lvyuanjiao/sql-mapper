var mapper = require('./lib/mapper');
var section = require('./lib/section');

module.exports = (function() {
	
	return {
		
		'build': mapper.build,
		
		'get': mapper.get,
		
		'section': section
		
	};
	
})();
