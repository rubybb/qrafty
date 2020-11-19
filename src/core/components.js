import Qrafty from "./core";

Qrafty.extend.call(Qrafty.defaultOptions.settings, {
	findComponents: false
});

Qrafty.extend({
	_components: new Map(),
    
	c: async function () { return this.defineComponent.apply(this, arguments); },
    
	component: async function () {
		if (arguments.length === 1) return this.findComponent.apply(this, arguments); 
		return this.defineComponent.apply(this, arguments);
	},

	defineComponent: async function (name, component) {
		if (!component) return this._components.get(name);
        
		this.debug(`defineComponent: "${name}"`, component);
		this._components.set(name, component);
	},
    
	components: function () {
		return this._components;
	},

	isComp: async function () { return this.isComponent.apply(this, arguments); },
	isComponent: function (name) {
		return this._components.has(name);
	},
    
	findComponent: async function (name, lookup = true) {
		if (lookup && !this._components.has(name)) {
			const findDynamicObject = this.functions.get("findDynamicObject");
			if (this.settings.get("findComponent") && findDynamicObject) {
				let component = await findDynamicObject({name, type: "component"}).catch((e) => {
					this.debug("findComponent: findDynamicObject threw error:", e);
					throw new Error(`the component "${name}" does not exist`);
				});
                
				this.debug(`findComponent: "${name}" (dynamically imported)`);

				component.__dynamic = true;
				await this.defineComponent(name, component);
			}

			if (!this._components.has(name)) throw new Error(`the component "${name}" does not exist`);
		}

		return this._components.get(name);
	}
});