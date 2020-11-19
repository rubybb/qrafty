function requireNew (id) {
	delete require.cache[require.resolve(id)];
	return require(id);
}

module.exports = function() {
	// Define common features
	var Qrafty = require("./crafty-common.js")(requireNew);

	// Define some aliases for renamed properties
	requireNew("./aliases").defineAliases(Qrafty);

	// add dummys - TODO remove this in future
	Qrafty.viewport = {
		_x: 0,
		_y: 0,
		width: 0,
		height: 0,
		init: function() {},
		reset: function() {}
	};

	return Qrafty;
};
