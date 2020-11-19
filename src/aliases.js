import Qrafty from "./core/core";

function createDeprecatedAlias(oldObject, oldName, newObject, newName) {
	Object.defineProperty(oldObject, oldName, {
		enumerable: false,
		configurable: false,
		get: function() { 
			Qrafty.warn(`${oldName} is deprecated.`);
			return newObject[newName];
		},
		set: function(value) { newObject[newName] = value; }
	});
}

export default {
	defineAliases: function defineAliases(Qrafty) {
		//createDeprecatedAlias(Qrafty, "bind", Qrafty, "on");
		//createDeprecatedAlias(Qrafty, "trigger", Qrafty, "emit");

		createDeprecatedAlias(Qrafty, "image_whitelist", Qrafty, "imageWhitelist");

		createDeprecatedAlias(Qrafty, "mouseDispatch", Qrafty.s("Mouse"), "processEvent");
		createDeprecatedAlias(Qrafty, "mouseButtonsDown", Qrafty.s("Mouse"), "_buttonDown");
		createDeprecatedAlias(Qrafty, "lastEvent", Qrafty.s("Mouse"), "lastMouseEvent");
		createDeprecatedAlias(Qrafty, "mouseObjs", Qrafty.s("Mouse"), "mouseObjs");

		createDeprecatedAlias(Qrafty, "keyboardDispatch", Qrafty.s("Keyboard"), "processEvent");
		createDeprecatedAlias(Qrafty, "keydown", Qrafty.s("Keyboard"), "_keyDown");
		createDeprecatedAlias(Qrafty, "resetKeyDown", Qrafty.s("Keyboard"), "resetKeyDown");

		createDeprecatedAlias(Qrafty, "touchDispatch", Qrafty, "_touchDispatch");
		createDeprecatedAlias(Qrafty, "touchObjs", Qrafty.s("Touch"), "touchObjs");
		Qrafty.touchHandler = {};
		createDeprecatedAlias(Qrafty.touchHandler, "fingers", Qrafty.s("Touch"), "touchPoints");
	}
};

