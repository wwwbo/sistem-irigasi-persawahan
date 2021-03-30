'use strict';

// memberikan response json
exports.ok = function(values, res){
	const data = {
		'status': 200,
		'error': null,
		'data': values
	};

	res.json(data);
	res.end();
    
};