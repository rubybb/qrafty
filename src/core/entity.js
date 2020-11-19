import Qrafty from "./core";
import * as resolver from "./resolver";

//Qrafty._entities = {};
//Qrafty._compEntities = {};

export default {
	init: function (selector) {

		if (typeof selector === "string") {
			if (selector === "*") {
				let index = 0;
				for (let e in Qrafty._entities) {
					this[index] = Number.parseInt(e);
					index++;
				}

				this.length = index;
				if (this.length === 1) return Qrafty._entities[this[0]];
				return this;
			}
            
			let entities = {};
			let components = resolver.components(arguments);
			for (let name of components) {
				for (let entity in Qrafty._compEntities[name]) {
					entities[entity] = Number.parseInt(entity);
				}
			}
                
			let element = 0;
			for (let i in entities) {
				this[element++] = entities[i];
			}

			this.length = element;
			if (element === 1) return Qrafty._entities[this[element-1]];
            
			Qrafty._addCallbackMethods(this);
			return this;
		}
        
		if (!selector) { // nothing passed, create god entity??
			selector = 0;
			if (!(0 in Qrafty._entities)) Qrafty._entities[0] = this;
		}
        
		if (!(selector in Qrafty._entities)) {
			this.length = 0;
			return this;
		}
        
		this[0] = selector;
		this.length = 1;
        
		if (!this.__c) this.__c = {};
		if (!this._callbacks) Qrafty._addCallbackMethods(this);
        
		if (!Qrafty._entities[selector]) Qrafty._entities[selector] = this;
		return Qrafty._entities[selector]; 
	},

	setName: function (name) {
		this._entityName = String(name);
		this.emit("NewEntityName", this._entityName);
		return this;
	},

	getName: function () {
		return this._entityName;
	},

	addComponent: async function () {
		let components = resolver.components(arguments);

		for (let name of components) {
			if (!Qrafty.isComponent(name)) continue;
			if (this.__c[name] === true) continue;
			this.__c[name] = true;

			Qrafty._compEntities[name] = Qrafty._compEntities[name] || {};
			Qrafty._compEntities[name][this[0]] = this;

			let component = await Qrafty.component(name);
			this.extend(component);
            
			if ("required" in component) this.addComponent(component.requires);
            
			if ("properties" in component) {
				for (let property in component.properties) {
					Object.defineProperty(this, property, component.properties[property]);
				}
			}
            
			if ("events" in component) {
				for (var event in component.events){
					this.on(event, component.events[event]);
				}
			}

			if ("init" in component) {
				await component.init.call(this);
			}
		}

		this.trigger("NewComponent", components);
		return this;
	},

	toggleComponent: async function () {
		let components = resolver.components(arguments);
		for (let name of components) {
			if (!this.has(name)) {
				await this.addComponent(name);
				continue;
			}

			await this.removeComponent(name);
		}

		return this;
	},

	requires: async function () {
		return this.addComponent.apply(this, arguments);
	},
    
	removeComponent: async function (id, soft) {
		return;
		var comp = components[id];
		this.emit("RemoveComponent", id);
		if (comp && "events" in comp){
			var auto = comp.events;
			for (var eventName in auto){
				var fn = typeof auto[eventName] === "function" ? auto[eventName] : comp[auto[eventName]];
				this.unbind(eventName, fn);
			}
		}
		if (comp && "remove" in comp) {
			comp.remove.call(this, false);
		}
		if (soft === false && comp) {
			for (var prop in comp) {
				delete this[prop];
			}
		}
		delete this.__c[id];
		// update map from component to (entityId -> entity)
		if (compEntities[id]) {
			delete compEntities[id][this[0]];
		}

		return this;
	},


	getId: function () {
		return this[0];
	},

	has: function (id) {
		return !!this.__c[id];
	},
    
	attr: function (key, value, silent, recursive) {
		if (arguments.length === 1 && typeof arguments[0] === "string") {
			return this._attr_get(key);
		} else {
			return this._attr_set(key, value, silent, recursive);
		}
	},

	_attr_get: function(key, context) {
		var first, keys, subkey;
		if (typeof context === "undefined" || context === null) {
			context = this;
		}
		if (key.indexOf(".") > -1) {
			keys = key.split(".");
			first = keys.shift();
			subkey = keys.join(".");
			return this._attr_get(keys.join("."), context[first]);
		} else {
			return context[key];
		}
	},

	_attr_set: function() {
		var data, silent, recursive;
		if (typeof arguments[0] === "string") {
			data = this._set_create_object(arguments[0], arguments[1]);
			silent = !!arguments[2];
			recursive = arguments[3] || arguments[0].indexOf(".") > -1;
		} else {
			data = arguments[0];
			silent = !!arguments[1];
			recursive = !!arguments[2];
		}

		if (!silent) {
			this.trigger("Change", data);
		}

		if (recursive) {
			this._recursive_extend(data, this);
		} else {
			this.extend.call(this, data);
		}
		return this;
	},

	_set_create_object: function(key, value) {
		var data = {}, keys, first, subkey;
		if (key.indexOf(".") > -1) {
			keys = key.split(".");
			first = keys.shift();
			subkey = keys.join(".");
			data[first] = this._set_create_object(subkey, value);
		} else {
			data[key] = value;
		}
		return data;
	},

	_recursive_extend: function(new_data, original_data) {
		var key;
		for (key in new_data) {
			if (new_data[key].constructor === Object) {
				original_data[key] = this._recursive_extend(new_data[key], original_data[key]);
			} else {
				original_data[key] = new_data[key];
			}
		}
		return original_data;
	},

	toArray: function () {
		return Array.prototype.slice.call(this, 0);
	},

	timeout: function (callback, duration) {
		this.each(function () {
			let self = this;
			setTimeout(function () {
				callback.call(self);
			}, duration);
		});
        
		return this;
	},
    
	on: function () { return this.bind.apply(this, arguments); },
	bind: function (event, callback, unique = false) {
		if (unique) this.unbind(event, callback);

		for (var i = 0; i < this.length; i++) {
			var e = Qrafty._entities[this[i]];
			if (e) {
				e._bindCallback(event, callback);
			}
		}
		
		return this;
	},

	uniqueBind: function (event, callback) {
		return this.bind(event, callback, true);
	},

	one: function (event, callback) {
		let self = this;
		return this.bind(event, function () {
			callback.apply(self, arguments);
			self.unbind(event, this);
		});

	},

	unbind: function (event, callback) {
		for (let i = 0; i < this.length; i++) {
			let entity = Qrafty._entities[this[i]];
			if (entity) entity._unbindCallbacks(event, callback);
		}
        
		return this;
	},
    
	emit: function () { return this.trigger.apply(this, arguments); },
	trigger: function (event, data) {
		for (let i = 0; i < this.length; i++) {
			let entity = Qrafty._entities[this[i]];
			if (entity) entity._runCallbacks(event, data);
		}
		
		return this;
	},

	each: function (func) {
		for (let i = 0; i < this.length; i++) {
			if (!Qrafty._entities[this[i]]) continue;
			func.call(Qrafty._entities[this[i]], i);
		}
        
		return this;
	},

	/**@
     * #.get
     * @comp Qrafty Core
     * @kind Method
     * 
     * @sign public Array .get()
     * @returns An array of entities corresponding to the active selector
     *
     * @sign public Entity .get(Number index)
     * @returns an entity belonging to the current selection
     * @param index - The index of the entity to return.  If negative, counts back from the end of the array.
     *
     *
     * @example
     * Get an array containing every "2D" entity
     * ~~~
     * var arr = Qrafty("2D").get()
     * ~~~
     * Get the first entity matching the selector
     * ~~~
     * // equivalent to Qrafty("2D").get()[0], but doesn't create a new array
     * var e = Qrafty("2D").get(0)
     * ~~~
     * Get the last "2D" entity matching the selector
     * ~~~
     * var e = Qrafty("2D").get(-1)
     * ~~~
     *
     */
	get: function (index) {
		const length = this.length;
		if (typeof index !== "undefined") {
			if (index >= length || index+length < 0) return undefined;
			if (index >= 0) return Qrafty._entities[this[index]];
			return Qrafty._entities[this[index-length]];
		}
        
		let results = [];
		for (let i = 0; i < length; i++) {
			if (!Qrafty._entities[this[i]]) continue;
			results.push(Qrafty._entities[this[i]] );
		}

		return results;
	},

	clone: async function () {
		let components = this.__c, clone = Qrafty.e();

		for (let name in components) {
			await clone.addComponent(name);
		}

		for (let prop in this) {
			if (prop !== "0" && prop !== "_global" && prop !== "_changed" && typeof this[prop] !== "function" && typeof this[prop] !== "object") {
				clone[prop] = this[prop];
			}
		}

		return clone;
	},


	/**@
     * #.defineField
     * @comp Qrafty Core
     * @kind Method
     * 
     * @sign public this .defineField(String property, Function getCallback, Function setCallback)
     * @param property - Property name to assign getter & setter to
     * @param getCallback - Method to execute if the property is accessed
     * @param setCallback - Method to execute if the property is mutated
     *
     * Assigns getters and setters to the property. 
     * A getter will watch a property waiting for access and will then invoke the
     * given getCallback when attempting to retrieve.
     * A setter will watch a property waiting for mutation and will then invoke the
     * given setCallback when attempting to modify.
     *
     * @example
     * ~~~
     * var ent = Qrafty.e("2D");
     * ent.defineField("customData", function() { 
     *    return this._customData; 
     * }, function(newValue) { 
     *    this._customData = newValue;
     * });
     *
     * ent.customData = "2" // set customData to 2
     * Qrafty.log(ent.customData) // prints 2
     * ~~~
     */
	defineField: function (prop, getCallback, setCallback) {
		Qrafty.defineField(this, prop, getCallback, setCallback);
		return this;
	},

	/**@
     * #.destroy
     * @comp Qrafty Core
     * @kind Method
     * 
     * @sign public this .destroy(void)
     * Will remove all event listeners and delete all properties as well as removing from the stage
     */
	destroy: function () {
		//remove all event handlers, delete from entities
		this.each(function () {
			var comp;
			this.trigger("Remove");
			for (var compName in this.__c) {
				comp = components[compName];
				if (comp && "remove" in comp)
					comp.remove.call(this, true);

				// update map from component to (entityId -> entity)
				delete compEntities[compName][this[0]];
			}
			this._unbindAll();
			delete Qrafty._entities[this[0]];
		});
	},

	/**@
     * #.freeze
     * @comp Qrafty Core
     * @kind Method
     * 
     * @sign public this .freeze()
     * 
     * @triggers Freeze - Directly before the entity is frozen
     * 
     * Freezes the entity.  A frozen entity will not receive events or be displayed by graphics systems. 
     * It is also removed from the spatial map, which means it will not be found by collisions, 
     * raycasting, or similar functions.
     * 
     * This method may be called upon a collection of entities.
     * 
     * @note Because the entity no longer listens to events, modifying its properties can result in an inconsistent state.
     * 
     * If custom components need to handle frozen entities, they can listen to the "Freeze" event, which will be triggered before the event system is disabled.
     * 
     * @example
     * 
     * ```
     * // Freeze all entities with the Dead component
     * Qrafty("Dead").freeze();
     * ```
     * 
     * @see .unfreeze
     */
	freeze: function () {
		if (this.length === 1 && !this.__frozen) {
			this.trigger("Freeze", this);
			this._freezeCallbacks();
			this.__frozen = true;
		} else {
			for (var i = 0; i < this.length; i++) {
				var e = entities[this[i]];
				if (e && !e.__frozen) {
					e.trigger("Freeze", e);
					e._freezeCallbacks();
					// Set a frozen flag.  (This is distinct from the __callbackFrozen flag)
					e.__frozen = true;
				}
			}
		}
		return this;
	},

	/**#
     * #.unfreeze
     * @comp Qrafty Core
     * @kind Method
     * 
     * @sign public this .unfreeze()
     * 
     * @triggers Unfreeze - While the entity is being unfrozen
     * 
     * Unfreezes the entity, allowing it to receive events, inserting it back into the spatial map, 
     * and restoring it to its previous visibility.
     * 
     * This method may be called upon a collection of entities.
     * 
     * If a custom component needs to know when an entity is unfrozen, they can listen to the "Unfreeze"" event.
     * 
     * @example
     * ```
     * // Bring the dead back to life!
     * Qrafty("Dead").unfreeze().addComponent("Undead");
     * ```
     */
	unfreeze: function () {
		if (this.length === 1 && this.__frozen) {
			this.__frozen = false;
			this._unfreezeCallbacks();
			this.emit("Unfreeze", this);
		} else {
			for (var i = 0; i < this.length; i++) {
				var e = entities[this[i]];
				if (e && e.__frozen) {
					e.__frozen = false;
					e._unfreezeCallbacks();
					e.emit("Unfreeze", e);
				}
			}
		}
		return this;
	}
};