import Qrafty from "../core/core";

Qrafty.extend.call(Qrafty.defaultOptions.settings, {
	findScenes: false
});	

Qrafty.extend({
	_scenes: new Map(),
	_current: null,
     
	cleanupScene: async function () {
		if (this._current === null) return;
          
		Qrafty.trigger("SceneDestroy", {newScene: name});
		Qrafty.viewport.reset();

		Qrafty("2D").each(function () {
			if (!this.has("Persist")) this.destroy();
		});
          
		const scene = await this.findScene(this._current, false);
		if ({}.hasOwnProperty.call(scene, "uninitialize")) {
			scene["uninitialize"].call(this);
		}
	},

	scene: async function () {
		if (arguments.length === 1) return Qrafty.enterScene(arguments[0], arguments[1]);
		return this.defineScene.apply(this, arguments);
	},

	defineScene: async function (name, scene){
		let {initialize, uninitialize} = scene;

		// support for old variant of arguments.
		// -> defineScene(name, initialize, uninitialize)
		if (typeof scene === "function") initialize = scene;
		if (typeof arguments[2] === "function") uninitialize = arguments[2];

		// throw errors for cases where arguments aren't what they should be.
		if (!name || !scene) throw new Error("scene name or definition cannot be undefined");
		if (typeof initialize !== "function") throw new Error("scene initialize function is the wrong type");
		if (uninitialize && typeof uninitialize !== "function") throw new Error("scene uninitialize function is the wrong type");

		this.debug(`defineScene: "${name}"`, scene);
		this._scenes.set(name, scene);
	},

	enterScene: async function (name, data){
		if (typeof data === "function") throw new Error("scene data cannot be a function");
            
		this.cleanupScene();
		let oldScene = this._current;
		this._current = name;
               
		Qrafty.trigger("SceneChange", {oldScene: oldScene, newScene: name});
		this.debug(`enterScene: "${name}"`, data);
		return (await this.findScene(name))["initialize"].call(this, data);
	},

	findScene: async function (name, lookup = true) {
		if (lookup && !this._scenes.has(name)) {
			const findDynamicObject = this.functions.get("findDynamicObject");
			if (this.settings.get("findScenes") && findDynamicObject) {
				let scene = await findDynamicObject({name, type: "scene"}).catch((e) => {
					this.debug("findScene: findDynamicObject threw error:", e);
					throw new Error(`the scene "${name}" does not exist`);
				});

				this.debug(`findScene: "${name}" (dynamically imported)`);

				scene.__dynamic = true;
				await this.defineScene(name, scene);
			}

			if (!this._scenes.has(name)) throw new Error(`the scene "${name}" does not exist`);
		}

		return this._scenes.get(name);
	}
});
