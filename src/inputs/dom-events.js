import Qrafty from "../core/core";

Qrafty.extend({
	_events: {},

	/**@
     * #Qrafty.addEvent
     * @category Events, Misc
     * @kind Method
     *
     * @sign public this Qrafty.addEvent(Object ctx, HTMLElement obj, String event, Function callback)
     * @param ctx - Context of the callback or the value of `this`
     * @param obj - Element to add the DOM event to
     * @param event - Event name to bind to
     * @param callback - Method to execute when triggered
     *
     * Adds DOM level 3 events to elements. The arguments it accepts are the call
     * context (the value of `this`), the DOM element to attach the event to,
     * the event name (without `on` (`click` rather than `onclick`)) and
     * finally the callback method.
     *
     * If no element is passed, the default element will be `window.document`.
     *
     * Callbacks are passed with event data.
     *
     * @note This is related to DOM events only,  not Qrafty's own event system.
     * Of course, you can trigger Qrafty events in the callback function!
     *
     * @example
     * Normally you'd use Qrafty's built-in mouse component, but for the sake of an example let's pretend that doesn't exist.
     * The following code will add a stage-wide MouseDown event listener to the player, and log both which button was pressed
     * and the (x,y) coordinates in viewport/world/game space.
     * ~~~
     * var player = Qrafty.e("2D");
     *     player.onMouseDown = function(e) {
     *         Qrafty.log(e.mouseButton, e.realX, e.realY);
     *     };
     * Qrafty.addEvent(player, Qrafty.stage.elem, "mousedown", player.onMouseDown);
     * ~~~
     * @see Qrafty.removeEvent
     */
	addEvent: function (ctx, obj, type, callback) {
		if (arguments.length === 3) {
			callback = type;
			type = obj;
			obj = window.document;
		}

		//save anonymous function to be able to remove
		var id = ctx[0] || "",
			afn = function (e) {
				callback.call(ctx, e);
			};

		if (!this._events[id + obj + type + callback])
			this._events[id + obj + type + callback] = afn;
		else  {
			return;
		}

		obj.addEventListener(type, afn, false);

	},

	/**@
     * #Qrafty.removeEvent
     * @category Events, Misc
     * @kind Method
     *
     * @sign public this Qrafty.removeEvent(Object ctx, HTMLElement obj, String event, Function callback)
     * @param ctx - Context of the callback or the value of `this`
     * @param obj - Element the event is on
     * @param event - Name of the event
     * @param callback - Method executed when triggered
     *
     * Removes events attached by `Qrafty.addEvent()`. All parameters must
     * be the same that were used to attach the event including a reference
     * to the callback method.
     *
     * @see Qrafty.addEvent
     */
	removeEvent: function (ctx, obj, type, callback) {
		if (arguments.length === 3) {
			callback = type;
			type = obj;
			obj = window.document;
		}

		//retrieve anonymous function
		var id = ctx[0] || "",
			afn = this._events[id + obj + type + callback];

		if (afn) {
			obj.removeEventListener(type, afn, false);
			delete this._events[id + obj + type + callback];
		}
	}
});
