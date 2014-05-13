var mapper = require('./lib/mapper');
var section = require('./lib/section');

module.exports = (function() {
	
	return {
		
		'build': mapper.build,
		
		'mapper': mapper.get,
		
		'section': section
		
	};
	
})();
