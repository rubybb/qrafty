import Qrafty from "../core/core";

Qrafty.extend({
	loggingEnabled: true,
	debugLoggingEnabled: "/* @env DEVELOPMENT */" === "true",
	debugLoggingTrace: false,

	log: function () {
		if (!this.loggingEnabled) return;
		console.log.apply(console, arguments);
	},

	warn: function () {
		if (!this.loggingEnabled) return;
		console.warn.apply(console, arguments);
	},

	error: function () {
		if (!this.loggingEnabled) return;
		console.error.apply(console, arguments);
	},

	debug: function () {
		if (!this.loggingEnabled || !this.debugLoggingEnabled) return;
		(this.debugLoggingTrace ? console.trace : console.debug).apply(console, arguments);
	},
});