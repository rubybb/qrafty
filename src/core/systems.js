//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";


// Dictionary of existing systems
Qrafty._systems = {};

/**@
 * #Qrafty.s
 * @category Core
 * @kind Method
 *
 * Registers a system.
 *
 * @trigger SystemLoaded - When the system has initialized itself - obj - system object
 * @trigger SystemDestroyed - Right before the system is destroyed - obj - system object
 *
 * @sign void Qrafty.s(String name, Obj template[, Obj options][, Boolean lazy])
 * Register a system
 * @param name - The name of the system
 * @param template - an object whose methods and properties will be copied to the new system
 * @param options - an object whose properties will be deep copied to the new system's options property
 * @param lazy - a flag that indicates whether the system should be initialized right away or the first time it is referenced
 *
 * @sign System Qrafty.s(String name)
 * Access the named system
 * @param name - The system to return
 * @returns The referenced system.  If the system has not been initialized, it will be before it is returned.
 *
 * Objects which handle entities might want to subscribe to the event system without being entities themselves.
 * When you declare a system with a template object, all the methods and properties of that template are copied to a new object.
 * This new system will automatically have the following event related methods, which function like those of components:
 * `.bind()`, `unbind()`, `trigger()`, `one()`, `uniqueBind()`, `destroy()`.
 * Much like components, you can also provide `init()` and `remove()` methods,
 * a `properties` dictionary which will be used to define properties with Object.defineProperty,
 * as well as an `events` parameter for automatically binding to events.
 *
 * @note The `init()` method is for setting up the internal state of the system,
 * if you create entities in it that then reference the system, that'll create an infinite loop.
 */
Qrafty.s = function(name, obj, options, lazy) {
	if (obj) {
		if (typeof options === "boolean") {
			lazy = options;
			options = null;
		}
		if (lazy === false) {
			Qrafty._systems[name] = new Qrafty.QraftySystem(name, obj, options);
			Qrafty.trigger("SystemLoaded", name);
		} else {
			Qrafty._registerLazySystem(name, obj, options);
		}
	} else {
		return Qrafty._systems[name];
	}
};

function optionMerge(defaults, specific){
	var options = {};
	// Copy all the specified keys, then all the default keys that aren't specified
	for (var key in specific) {
		options[key] = specific[key];
	}
	for (key in defaults) {
		if (!(key in specific)) {
			options[key] = defaults[key];
		}
	} 
	return options;
}


Qrafty._registerLazySystem = function(name, obj, options) {
	// This is a bit of magic to only init a system if it's requested at least once.
	// We define a getter for _systems[name] that will first initialize the system, 
	// and then redefine _systems[name] to remove that getter.
	Object.defineProperty(Qrafty._systems, name, {
		get: function() {
			Object.defineProperty(Qrafty._systems, name, {
				value: new Qrafty.QraftySystem(name, obj, options),
				writable: true,
				enumerable: true,
				configurable: true
			});
			Qrafty.trigger("SystemLoaded", name);
			return Qrafty._systems[name];
		},
		configurable: true
	});

};

// Each system has its properties and methods copied onto an object of this type
Qrafty.QraftySystem = (function() {
	var systemID = 1;
	return function(name, template, options) {
		this.name = name;
		if (!template) return this;
		this._systemTemplate = template;
		this.extend(template);
        
		// Overwrite any default options with the passed options object
		// This does a deep copy on the objects, and treats null as a specified value
		this.options = optionMerge(this.options, options);

		// Add the "low leveL" callback methods
		Qrafty._addCallbackMethods(this);

		// Give this object a global ID.  Used for event handlers.
		this[0] = "system" + (systemID++);

		// Define properties
		if ("properties" in template) {
			var props = template.properties;
			for (var propertyName in props) {
				Object.defineProperty(this, propertyName, props[propertyName]);
			}
		}
		// If an events object is provided, bind the listed event handlers
		if ("events" in template) {
			var auto = template.events;
			for (var eventName in auto) {
				var fn = typeof auto[eventName] === "function" ? auto[eventName] : template[auto[eventName]];
				this.bind(eventName, fn);
			}
		}
		// Run any instantiation code
		if (typeof this.init === "function") {
			this.init(name);
		}
	};
})();



Qrafty.QraftySystem.prototype = {
	extend: function(obj) {
		// Copy properties and methods of obj
		for (var key in obj) {
			if (typeof this[key] === "undefined") {
				this[key] = obj[key];
			}
		}
	},

	// Event methods
	bind: function(event, callback) {
		this._bindCallback(event, callback);
		return this;
	},

	trigger: function(event, data) {
		this._runCallbacks(event, data);
		return this;
	},

	unbind: function(event, callback) {
		this._unbindCallbacks(event, callback);
		return this;
	},

	one: function(event, callback) {
		var self = this;
		var oneHandler = function(data) {
			callback.call(self, data);
			self.unbind(event, oneHandler);
		};
		return self.bind(event, oneHandler);
	},

	uniqueBind: function(event, callback) {
		this.unbind(event, callback);
		return this.bind(event, callback);
	},

	destroy: function() {
		Qrafty.trigger("SystemDestroyed", this);
		// Check the template itself
		if (typeof this.remove === "function") {
			this.remove();
		}
		this._unbindAll();
		delete Qrafty._systems[this.name];
	}

};