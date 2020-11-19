//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";

/**@
 * #KeyboardState
 * @category Input
 * @kind Component
 *
 * Handles valid key related events and key states for the entity.
 * @note This is an internally used component, automatically included in the `KeyboardSystem`.
 *
 * @trigger KeyDown - when a key is pressed - KeyboardEvent
 * @trigger KeyUp - when a key is released - KeyboardEvent
 *
 * The standard Qrafty `KeyboardEvent` object:
 * ~~~
 * // event name of key event
 * e.eventName
 *
 * // Normalized keyCode number according to `Qrafty.keys`
 * e.key
 *
 * // Original keyboard event, containing additional native properties
 * e.originalEvent
 * ~~~
 *
 * In addition to binding to these events, the current state (pressed/released) of a key can also be queried using the `.isKeyDown` method.
 *
 * @see Keyboard, KeyboardSystem
 * @see Qrafty.keys
 */
Qrafty.__keyboardStateTemplate = {
	_keyDown: null,

	init: function() {
		this._keyDown = {};
		// use custom trigger method if specified
		this.triggerKeyEvent = this.triggerKeyEvent || this.trigger;
	},

	/**@
     * #.isKeyDown
     * @comp KeyboardState
     * @kind Method
     *
     * @sign public Boolean isKeyDown(String keyName)
     * @param keyName - Name of the key to check. See `Qrafty.keys`.
     * @returns The pressed state of the key
     *
     * @sign public Boolean isKeyDown(Number keyCode)
     * @param keyCode - Key code in `Qrafty.keys`.
     * @returns The pressed state of the key
     *
     * Determine if a certain key is currently down.
     *
     * @example
     * ~~~
     * ent.bind('UpdateFrame', function() {
     *   if (Qrafty.s('Keyboard').isKeyDown('SPACE'))
     *     this.y--;
     * });
     * ~~~
     *
     * @see .resetKeyDown
     * @see Qrafty.keys
     */
	isKeyDown: function (key) {
		if (typeof key === "string") {
			key = Qrafty.keys[key];
		}
		return !!this._keyDown[key];
	},

	/**@
     * #.resetKeyDown
     * @comp KeyboardState
     * @kind Method
     *
     * @sign public this .resetKeyDown()
     *
     * Reset all currently pressed keys. Triggers appropriate "KeyUp" events.
     *
     * This method is called internally, but may be useful when running Qrafty in headless mode.
     *
     * @see .isKeyDown
     * @see Qrafty.keys
     */
	resetKeyDown: function () {
		var evt = { key: -1, eventName: "KeyUp" };

		// Tell all the keys they're no longer held down
		var keyDown = this._keyDown;
		for (var k in keyDown) {
			if (keyDown[k] === true) {
				evt.key = +k; // convert k propertyString to number!
				this.triggerKey("KeyUp", evt);
			}
		}

		return this;
	},

	/**@
     * #.triggerKey
     * @comp KeyboardState
     * @kind Method
     *
     * @sign public this triggerKey(String eventName, Object eventData)
     * @param eventName - Name of the key event to trigger ("KeyDown" or "KeyUp")
     * @param eventData - The key event to trigger
     *
     * Try to trigger a key event on this entity and persist the key state.
     * This method prevents inconsistent key state.
     * e.g. If this entity didn't receive a "KeyDown" previously, it won't fire a "KeyUp" event.
     *
     * This method is called internally, but may be useful when running Qrafty in headless mode.
     *
     * @example
     * ~~~
     * var wasTriggered = false;
     *
     * ent.requires('KeyboardState')
     *    .bind('KeyUp', function(evt) {
     *       wasTriggered = true;
     *    })
     *    .triggerKey('KeyUp', { key: Qrafty.keys.RIGHT_ARROW });
     *
     * Qrafty.log(wasTriggered); // prints false
     * ~~~
     *
     * @see Qrafty.keys
     */
	triggerKey: function (eventName, eventData) {
		// trigger event only if valid state
		var key = eventData.key;
		if (eventName === "KeyDown") {
			// ignore KeyDown due to inconsistent state caused by loosing focus
			if (this._keyDown[key] !== true) {
				this._keyDown[key] = true;
				this.triggerKeyEvent(eventName, eventData);
			}
		} else if (eventName === "KeyUp") {
			// ignore KeyUp due to inconsistent state caused by loosing focus
			if (this._keyDown[key] === true) {
				this._keyDown[key] = false;
				this.triggerKeyEvent(eventName, eventData);
			}
		} else {
			// trigger the event otherwise
			this.triggerKeyEvent(eventName, eventData);
		}

		return this;
	}
};
Qrafty.c("KeyboardState", Qrafty.__keyboardStateTemplate);

// define a basic Keyboard system for headless mode
// will be substituted with proper one in browser mode
Qrafty.s("Keyboard", Qrafty.extend.call({
	// this method will be called by KeyboardState iff triggerKey event was valid
	triggerKeyEvent: function (eventName, e) {
		Qrafty.trigger(eventName, e);
	}
}, Qrafty.__keyboardStateTemplate), {}, false);
