
import * as resolver from "./resolver";
import entity from "./entity";
import version from "./version";


var Qrafty = function (selector) {
	return new Qrafty.fn.init(selector);
};

Qrafty._entities = {};
Qrafty._compEntities = {};

// Internal variables
var GUID, frame, handlers, onloads;

var initState = function () {
	GUID        = 1; // GUID for entity IDs
	frame       = 0;

	//entities    = {}; // Map of entities and their data
	//compEntities= {}; // Map from componentName to (entityId -> entity)
	handlers    = {}; // Global event handlers
	onloads     = []; // Temporary storage of onload handlers
};

initState();


Qrafty.fn = Qrafty.prototype = entity;
Qrafty.fn.init.prototype = Qrafty.fn;

Qrafty.extend = Qrafty.fn.extend = function (obj) {
	let target = this, key;
	if (!obj) return target;

	for (key in obj) {
		if (target === obj[key]) continue; //handle circular reference
		target[key] = obj[key];
	}

	return target;
};

Qrafty._callbackMethods = {
	// Add a function to the list of callbacks for an event
	_bindCallback: function(event, fn) {
		// Get handle to event, creating it if necessary
		var callbacks = this._callbacks[event];
		if (!callbacks) {
			callbacks = this._callbacks[event] = ( handlers[event] || ( handlers[event] = {} ) )[this[0]] = [];
			callbacks.context = this;
			callbacks.depth = 0;
		}
		// Push to callback array
		callbacks.push(fn);
	},

	// Process for running all callbacks for the given event
	_runCallbacks: function(event, data) {
		if (!this._callbacks[event] || this.__callbacksFrozen) {
			return;
		}
		var callbacks = this._callbacks[event];

		// Callback loop; deletes dead callbacks, but only when it is safe to do so
		var i, l = callbacks.length;
		// callbacks.depth tracks whether this function was invoked in the middle of a previous iteration through the same callback array
		callbacks.depth++;
		for (i = 0; i < l; i++) {
			if (typeof callbacks[i] === "undefined") {
				if (callbacks.depth <= 1) {
					callbacks.splice(i, 1);
					i--;
					l--;
					// Delete callbacks object if there are no remaining bound events
					if (callbacks.length === 0) {
						delete this._callbacks[event];
						delete handlers[event][this[0]];
					}
				}
			} else {
				callbacks[i].call(this, data);
			}
		}
		callbacks.depth--;
	},

	// Unbind callbacks for the given event
	// If fn is specified, only it will be removed; otherwise all callbacks will be
	_unbindCallbacks: function(event, fn) {
		if (!this._callbacks[event]) {
			return;
		}
		var callbacks = this._callbacks[event];
		// Iterate through and delete the callback functions that match
		// They are spliced out when _runCallbacks is invoked, not here
		// (This function might be called in the middle of a callback, which complicates the logic)
		for (var i = 0; i < callbacks.length; i++) {
			if (!fn || callbacks[i] === fn) {
				delete callbacks[i];
			}
		}
	},

	// Completely all callbacks for every event, such as on object destruction
	_unbindAll: function() {
		if (!this._callbacks) return;
		this.__callbacksFrozen = false;
		for (var event in this._callbacks) {
			if (this._callbacks[event]) {
				// Remove the normal way, in case we've got a nested loop
				this._unbindCallbacks(event);
				// Also completely delete the registered callback from handlers
				delete handlers[event][this[0]];
			}
		}
	},

	_freezeCallbacks: function() {
		if (!this._callbacks) return;
		for (var event in this._callbacks) {
			if (this._callbacks[event]) {
				// Remove the callbacks from the global list of handlers
				delete handlers[event][this[0]];
			}
		}
		// Mark this callback list as frozen
		this.__callbacksFrozen = true;
	},

	_unfreezeCallbacks: function() {
		if (!this._callbacks) return;
		this.__callbacksFrozen = false;
		for (var event in this._callbacks) {
			if (this._callbacks[event]) {
				// Add the callbacks back to the global list of handlers
				handlers[event][this[0]] = this._callbacks[event];
			}
		}
        
	}
};

Qrafty._addCallbackMethods = function(context) {
	context.extend(Qrafty._callbackMethods);
	context._callbacks = {};
};

Qrafty._addCallbackMethods(Qrafty);

Qrafty.extend({
	0: "global",

	options: {},
	defaultOptions: {
		element: document.querySelector("#qrafty"),
		width: 500, height: 500,
		settings: {}, functions: {}
	},
	
	init: function (options = {}) {
		// support for previous version of arguments.
		// -> Qrafty.init(width, height, element);
		if (typeof arguments[0] === "number" && typeof arguments[1] === "number") {
			this.options.element = arguments[2];
			this.options.height = arguments[1];
			this.options.width = arguments[0];
		}

		options = this._handleOptions(options);
		this.debug("Qrafty.init:", options);
        
		// If necessary, attach any event handlers registered before Qrafty started
		if (!this._preBindDone) {
			for(var i = 0; i < this._bindOnInit.length; i++) {

				var preBind = this._bindOnInit[i];
				Qrafty.bind(preBind.event, preBind.handler);
			}
		}

		Qrafty.viewport.init(options.width, options.height, options.element);

		this.trigger("Load");
		this.timer.init();

		return this;
	},

	_handleOptions: function (options) {
		options = Object.assign({}, this.defaultOptions, options);
		options.settings = Object.assign({}, this.defaultOptions.settings, options.settings);
		options.functions = Object.assign({}, this.defaultOptions.functions, options.functions);

		for (const key in options.settings) {
			this.settings.set(key, options.settings[key]);
		}

		for (const key in options.functions) {
			this.functions.set(key, options.functions[key]);
		}

		this.options = Object.freeze(options);
		return this.options;
	},

	// There are some events that need to be bound to Qrafty when it's started/restarted, so store them here
	// Switching Qrafty's internals to use the new system idiom should allow removing this hack
	_bindOnInit: [],
	_preBindDone: false,
	_preBind: function(event, handler) {
		this._bindOnInit.push({
			event: event,
			handler: handler
		});
	},

	/**@
     * #Qrafty.getVersion
     * @category Core	
     * @kind Method
     * 
     * @sign public String Qrafty.getVersion()
     * @returns Current version of Qrafty as a string
     *
     * Return current version of crafty
     *
     * @example
     * ~~~
     * Qrafty.getVersion(); //'0.5.2'
     * ~~~
     */
	getVersion: function () {
		return version;
	},

	/**@
     * #Qrafty.stop
     * @category Core
     * @kind Method
     * 
     * @trigger QraftyStop - when the game is stopped  - {bool clearState}
     * @sign public this Qrafty.stop([bool clearState])
     * @param clearState - if true the stage and all game state is cleared.
     *
     * Stops the `UpdateFrame` interval and removes the stage element.
     *
     * To restart, use `Qrafty.init()`.
     * @see Qrafty.init
     */ 
	stop: function (clearState) {
		Qrafty.trigger("QraftyStop", clearState);

		this.timer.stop();
		if (clearState) {
			// Remove audio
			Qrafty.audio.remove();

			//Destroy all systems
			for (var s in Qrafty._systems) {
				Qrafty._systems[s].destroy();
			}

			// Remove the stage element, and re-add a div with the same id
			if (Qrafty.stage && Qrafty.stage.elem.parentNode) {
				var newCrStage = document.createElement("div");
				newCrStage.id = Qrafty.stage.elem.id;
				Qrafty.stage.elem.parentNode.replaceChild(newCrStage, Qrafty.stage.elem);
			}

			// reset callbacks, and indicate that prebound functions need to be bound on init again
			Qrafty._unbindAll();
			Qrafty._addCallbackMethods(Qrafty);
			this._preBindDone = false;

			initState();
		}
		return this;
	},

	/**@
     * #Qrafty.pause
     * @category Core
     * @kind Method
     * 
     * @trigger Pause - when the game is paused
     * @trigger Unpause - when the game is unpaused
     * @sign public this Qrafty.pause(void)
     *
     * Pauses the game by stopping the `UpdateFrame` event from firing. If the game is already paused it is unpaused.
     * You can pass a boolean parameter if you want to pause or unpause no matter what the current state is.
     * Modern browsers pauses the game when the page is not visible to the user. If you want the Pause event
     * to be triggered when that happens you can enable autoPause in `Qrafty.settings`.
     *
     * @example
     * Have an entity pause the game when it is clicked.
     * ~~~
     * button.bind("click", function() {
     *     Qrafty.pause();
     * });
     * ~~~
     */
	pause: function (toggle) {
		if (arguments.length === 1 ? toggle : !this._paused) {
			this.trigger("Pause");
			this._paused = true;
			setTimeout(function () {
				Qrafty.timer.stop();
			}, 0);
		} else {
			this.trigger("Unpause");
			this._paused = false;
			setTimeout(function () {
				Qrafty.timer.init();
			}, 0);
		}
		return this;
	},

	/**@
     * #Qrafty.isPaused
     * @category Core
     * @kind Method
     * 
     * @sign public Boolean Qrafty.isPaused()
     * @returns Whether the game is currently paused.
     *
     * @example
     * ~~~
     * Qrafty.isPaused();
     * ~~~
     */
	isPaused: function () {
		return this._paused;
	},

	/**@
     * #Qrafty.timer
     * @category Game Loop
     * @kind CoreObject
     * 
     * Handles game ticks
     */
	timer: (function () {
		/*
         * `window.requestAnimationFrame` or its variants is called for animation.
         * `.requestID` keeps a record of the return value previous `window.requestAnimationFrame` call.
         * This is an internal variable. Used to stop frame.
         */
		var tick, requestID;

		// Internal variables used to control the game loop.  Use Qrafty.timer.steptype() to set these.
		var mode = "fixed",
			maxFramesPerStep = 5,
			maxTimestep = 40;

		// variables used by the game loop to track state
		var endTime = 0,
			timeSlip = 0,
			gameTime;

		// Controls the target rate of fixed mode loop.  Set these with the Qrafty.timer.FPS function
		var FPS = 50,
			milliSecPerFrame = 1000 / FPS;




		return {
			init: function () {
				// When first called, set the  gametime one frame before now!
				if (typeof gameTime === "undefined")
					gameTime = Date.now() - milliSecPerFrame;

				var onFrame = (typeof window !== "undefined") && (
					window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    null
				);

				if (onFrame) {
					tick = function () {
						Qrafty.timer.step();
						if (tick !== null) {
							requestID = onFrame(tick);
						}
						//Qrafty.log(requestID + ', ' + frame)
					};

					tick();
				} else {
					tick = setInterval(function () {
						Qrafty.timer.step();
					}, 1000 / FPS);
				}
			},

			stop: function () {
				Qrafty.trigger("QraftyStopTimer");

				if (typeof tick !== "function") clearInterval(tick);

				var onFrame = (typeof window !== "undefined") && (
					window.cancelAnimationFrame ||
                    window.cancelRequestAnimationFrame ||
                    window.webkitCancelRequestAnimationFrame ||
                    window.mozCancelRequestAnimationFrame ||
                    window.oCancelRequestAnimationFrame ||
                    window.msCancelRequestAnimationFrame ||
                    null
				);

				if (onFrame) onFrame(requestID);
				tick = null;
			},


			/**@
             * #Qrafty.timer.steptype
             * @comp Qrafty.timer
             * @kind Method
             *
             * @trigger NewSteptype - when the current steptype changes - { mode, maxTimeStep } - New steptype
             *
             * Can be called to set the type of timestep the game loop uses.
             * @sign public void Qrafty.timer.steptype(mode [, maxTimeStep])
             * @param mode - the type of time loop.  Allowed values are "fixed", "semifixed", and "variable".  Qrafty defaults to "fixed".
             * @param maxTimeStep - For "fixed", sets the max number of frames per step.   For "variable" and "semifixed", sets the maximum time step allowed.
             *
             * Can be called to get the type of timestep the game loop uses.
             * @sign public Object Qrafty.timer.steptype(void)
             * @returns Object containing the current timestep's properties { mode, maxTimeStep }
             *
             * * In "fixed" mode, each frame is sent the same value of `dt`, and to achieve the target game speed, mulitiple frame events are triggered before each render.
             * * In "variable" mode, there is only one frame triggered per render.  This recieves a value of `dt` equal to the actual elapsed time since the last frame.
             * * In "semifixed" mode, multiple frames per render are processed, and the total time since the last frame is divided evenly between them.
             *
             * @see Qrafty.timer.FPS
             */
			steptype: function (newmode, option) {
				// setters
				if (newmode === "variable" || newmode === "semifixed") {
					mode = newmode;
					if (option)
						maxTimestep = option;
					Qrafty.trigger("NewSteptype", {mode: mode, maxTimeStep: maxTimestep});
				} else if (newmode === "fixed") {
					mode = "fixed";
					if (option)
						maxFramesPerStep = option;
					Qrafty.trigger("NewSteptype", {mode: mode, maxTimeStep: maxFramesPerStep});
				} else if (newmode !== undefined) {
					throw "Invalid step type specified";
					// getter
				} else {
					return {
						mode: mode,
						maxTimeStep: (mode === "variable" || mode === "semifixed") ? maxTimestep : maxFramesPerStep
					};
				}
			},

			/**@
             * #Qrafty.timer.step
             * @comp Qrafty.timer
             * @kind Method
             * 
             * @sign public void Qrafty.timer.step()
             * @trigger EnterFrame - Triggered before each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger UpdateFrame - Triggered on each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger ExitFrame - Triggered after each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger PreRender - Triggered every time immediately before a scene should be rendered
             * @trigger RenderScene - Triggered every time a scene should be rendered
             * @trigger PostRender - Triggered every time immediately after a scene should be rendered
             * @trigger MeasureWaitTime - Triggered at the beginning of each step after the first.  Passes the time the game loop waited between steps. - Number
             * @trigger MeasureFrameTime - Triggered after each frame.  Passes the time it took to advance one frame. - Number
             * @trigger MeasureRenderTime - Triggered after each render. Passes the time it took to render the scene - Number
             *
             * Advances the game by performing a step. A step consists of one/multiple frames followed by a render. The amount of frames depends on the timer's steptype.
             * Specifically it triggers `EnterFrame`, `UpdateFrame` & `ExitFrame` events for each frame and `PreRender`, `RenderScene` & `PostRender` events for each render.
             *
             * @see Qrafty.timer.steptype
             * @see Qrafty.timer.FPS
             */
			step: function () {
				var drawTimeStart, dt, lastFrameTime, loops = 0;

				var currentTime = Date.now();
				if (endTime > 0)
					Qrafty.trigger("MeasureWaitTime", currentTime - endTime);

				// If we're currently ahead of the current time, we need to wait until we're not!
				if (gameTime + timeSlip >= currentTime) {
					endTime = currentTime;
					return;
				}

				var netTimeStep = currentTime - (gameTime + timeSlip);
				// We try to keep up with the target FPS by processing multiple frames per render
				// If we're hopelessly behind, stop trying to catch up.
				if (netTimeStep > milliSecPerFrame * 20) {
					//gameTime = currentTime - milliSecPerFrame;
					timeSlip += netTimeStep - milliSecPerFrame;
					netTimeStep = milliSecPerFrame;
				}

				// Set up how time is incremented
				if (mode === "fixed") {
					loops = Math.ceil(netTimeStep / milliSecPerFrame);
					// maxFramesPerStep adjusts how willing we are to delay drawing in order to keep at the target FPS
					loops = Math.min(loops, maxFramesPerStep);
					dt = milliSecPerFrame;
				} else if (mode === "variable") {
					loops = 1;
					dt = netTimeStep;
					// maxTimestep is the maximum time to be processed in a frame.  (Large dt => unstable physics)
					dt = Math.min(dt, maxTimestep);
				} else if (mode === "semifixed") {
					loops = Math.ceil(netTimeStep / maxTimestep);
					dt = netTimeStep / loops;
				}

				// Process frames, incrementing the game clock with each frame.
				// dt is determined by the mode
				for (var i = 0; i < loops; i++) {
					lastFrameTime = currentTime;
                    
					var frameData = {
						frame: frame++,
						dt: dt,
						gameTime: gameTime
					};

					// Event that happens before "UpdateFrame",
					// e.g. for setting-up movement in response to user input for the next "UpdateFrame" event
					Qrafty.trigger("EnterFrame", frameData);
					// Everything that changes over time hooks into this event
					Qrafty.trigger("UpdateFrame", frameData);
					// Event that happens after "UpdateFrame",
					// e.g. for resolivng collisions applied through movement during "UpdateFrame" events
					Qrafty.trigger("ExitFrame", frameData);
					gameTime += dt;

					currentTime = Date.now();
					Qrafty.trigger("MeasureFrameTime", currentTime - lastFrameTime);
				}

				//If any frames were processed, render the results
				if (loops > 0) {
					drawTimeStart = currentTime;
					Qrafty.trigger("PreRender"); // Pre-render setup opportunity
					Qrafty.trigger("RenderScene");
					Qrafty.trigger("PostRender"); // Post-render cleanup opportunity
					currentTime = Date.now();
					Qrafty.trigger("MeasureRenderTime", currentTime - drawTimeStart);
				}

				endTime = currentTime;
			},
			/**@
             * #Qrafty.timer.FPS
             * @comp Qrafty.timer
             * @kind Method
             * 
             * @sign public void Qrafty.timer.FPS()
             * Returns the target frames per second. This is not an actual frame rate.
             * @sign public void Qrafty.timer.FPS(Number value)
             * @param value - the target rate
             * @trigger FPSChange - Triggered when the target FPS is changed by user - Number - new target FPS
             *
             * Sets the target frames per second. This is not an actual frame rate.
             * The default rate is 50.
             *
             * @see Qrafty.timer.steptype
             */
			FPS: function (value) {
				if (typeof value === "undefined")
					return FPS;
				else {
					FPS = value;
					milliSecPerFrame = 1000 / FPS;
					Qrafty.trigger("FPSChange", value);
				}
			},

			/**@
             * #Qrafty.timer.simulateFrames
             * @comp Qrafty.timer
             * @kind Method
             * 
             * @sign public this Qrafty.timer.simulateFrames(Number frames[, Number timestep])
             * Advances the game state by a number of frames and draws the resulting stage at the end. Useful for tests and debugging.
             * @param frames - number of frames to simulate
             * @param timestep - the duration to pass each frame.  Defaults to milliSecPerFrame (20 ms) if not specified.
             */
			simulateFrames: function (frames, timestep) {
				timestep = timestep || milliSecPerFrame;
				while (frames-- > 0) {
					var frameData = {
						frame: frame++,
						dt: timestep
					};
					Qrafty.trigger("EnterFrame", frameData);
					Qrafty.trigger("UpdateFrame", frameData);
					Qrafty.trigger("ExitFrame", frameData);
				}
				Qrafty.trigger("PreRender");
				Qrafty.trigger("RenderScene");
				Qrafty.trigger("PostRender");
			}
		};
	})(),

	entity: async function () {
		return this.e.apply(this, arguments);
	},

	e: async function () {
		let id = UID();
		this._entities[id] = null;
		this._entities[id] = Qrafty(id);

		
		await this._entities[id].addComponent(...arguments);
		await this._entities[id].addComponent("obj");
		this._entities[id].setName(`Entity #${id}`);

		Qrafty.emit("NewEntity", {id});

		return this._entities[id];
	},

	trigger: function () { this.emit.apply(this, arguments); },
	emit: function (event, data) {
		//Qrafty.debug(`trigger: "${event}"`, data);
		//  To learn how the event system functions, see the comments for Qrafty._callbackMethods
		var hdl = handlers[event] || (handlers[event] = {}),
			h, callbacks;
		//loop over every object bound
		for (h in hdl) {
			// Check whether h needs to be processed
			if (!hdl.hasOwnProperty(h)) continue;
			callbacks = hdl[h];
			if (!callbacks || callbacks.length === 0) continue;

			callbacks.context._runCallbacks(event, data);
		}
	},

	bind: function () { this.on.apply(this, arguments); },
	on: function (event, callback, unique = false) {
		if (unique) this.unbind(event, callback);
		this._bindCallback(event, callback);
		return callback;
	},

	uniqueBind: function (event, callback) {
		return this.on(event, callback, true);
	},

	/**@
     * #Qrafty.one
     * @category Core, Events
     * @kind Method
     * 
     * @sign public Function one(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Works like Qrafty.bind, but will be unbound once the event triggers.
     *
     * @see Qrafty.bind
     */
	one: function (event, callback) {
		var self = this;
		var oneHandler = function (data) {
			callback.call(self, data);
			self.unbind(event, oneHandler);
		};
		return self.bind(event, oneHandler);
	},

	/**@
     * #Qrafty.unbind
     * @category Core, Events
     * @kind Method
     * 
     * @sign public Boolean Qrafty.unbind(String eventName, Function callback)
     * @param eventName - Name of the event to unbind
     * @param callback - Function to unbind
     * @example
     * ~~~
     *    var play_gameover_sound = function () {...};
     *    Qrafty.bind('GameOver', play_gameover_sound);
     *    ...
     *    Qrafty.unbind('GameOver', play_gameover_sound);
     * ~~~
     *
     * The first line defines a callback function. The second line binds that
     * function so that `Qrafty.trigger('GameOver')` causes that function to
     * run. The third line unbinds that function.
     *
     * ~~~
     *    Qrafty.unbind('GameOver');
     * ~~~
     *
     * This unbinds ALL global callbacks for the event 'GameOver'. That
     * includes all callbacks attached by `Qrafty.bind('GameOver', ...)`, but
     * none of the callbacks attached by `some_entity.bind('GameOver', ...)`.
     */
	unbind: function (event, callback) {
		//  To learn how the event system functions, see the comments for Qrafty._callbackMethods
		this._unbindCallbacks(event, callback);
	},

	/**@
     * #Qrafty.frame
     * @category Core
     * @kind Method
     * 
     * @sign public Number Qrafty.frame(void)
     * @returns the current frame number
     */
	frame: function () {
		return frame;
	},

	entities: function () {
		return this._entities;
	},

	settings: (function () {
		let states = {};

		return {
			register: function (setting, callback) {
				Qrafty.on(`SettingsChange[${setting}]`, callback);
			},

			set: function () { this.modify.apply(this, arguments); },

			modify: function (setting, value) {
				if (!setting || value === undefined) throw new Error("setting cannot be assigned without key and value");
				Qrafty.emit(`SettingsChange[${setting}]`, value);
				states[setting] = value;
			},

			get: function (setting) {
				if (!setting) return Object.freeze({...states});
				return states[setting];
			}
		};
	})(),

	functions: (function () {
		let states = {};

		return {
			register: function (key, callback) {
				Qrafty.on(`FunctionsChange[${key}]`, callback);
			},

			set: function () { this.modify.apply(this, arguments); },
			
			modify: function (key, value) {
				if (!key || !value) throw new Error("custom functions cannot be assiged without key and value");
				if (typeof value !== "function") throw new Error("custom function is the wrong type");

				Qrafty.emit(`FunctionsChange[${key}]`, value);
				states[key] = value;
			},

			get: function (key) {
				if (!key) return Object.freeze({...states});
				return states[key];
			}
		};
	})(),

	/**@
     * #Qrafty.defineField
     * @category Core
     * @kind Method
     * 
     * @sign public void Qrafty.defineField(Object object, String property, Function getCallback, Function setCallback)
     * @param object - Object to define property on
     * @param property - Property name to assign getter & setter to
     * @param getCallback - Method to execute if the property is accessed
     * @param setCallback - Method to execute if the property is mutated
     *
     * Assigns getters and setters to the property in the given object.
     * A getter will watch a property waiting for access and will then invoke the
     * given getCallback when attempting to retrieve.
     * A setter will watch a property waiting for mutation and will then invoke the
     * given setCallback when attempting to modify.
     *
     * @example
     * ~~~
     * var ent = Qrafty.e("2D");
     * Qrafty.defineField(ent, "customData", function() { 
     *    return this._customData; 
     * }, function(newValue) { 
     *    this._customData = newValue;
     * });
     *
     * ent.customData = "2" // set customData to 2
     * Qrafty.log(ent.customData) // prints 2
     * ~~~
     * @see Qrafty Core#.defineField
     */
	defineField: function(obj, prop, getCallback, setCallback) {
		Object.defineProperty(obj, prop, {
			get: getCallback,
			set: setCallback,
			configurable: false,
			enumerable: true,
		});
	},

	clone: clone
});


function UID() {
	let id = GUID++;

	if (id in Qrafty._entities) return UID();
	return id;
}

function clone(obj) {
	if (obj === null || (typeof obj) !== "object") return obj;

	let temp = obj.constructor(); // changed
	for (let key in obj) temp[key] = clone(obj[key]);
	return temp;
}

Qrafty.resolver = resolver;
export default Qrafty;