//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";

// common base functionality for all EventDispatchers
Qrafty.__eventDispatcher = function EventDispatcher() {};
Qrafty.__eventDispatcher.prototype = {
	// this method should be setup as the entry callback for DOM events
	processEvent: function (e) {
		this.dispatchEvent(e);
		return this.preventBubbling(e);
	},

	// main method that handles logic of incoming DOM events
	// to be implemented by instances
	dispatchEvent: function (e) {
		// normalize the event and prepare it for dispatching to Qrafty, a system or entities
		// set e.eventName to proper event to be triggered

		// dispatch the element to Qrafty, the proper system or entities
		// find the entity to dispatch to (e.g. mouse events) or dispatch it globally (e.g. key events)
	},

	// prevents interaction with page (e.g. scrolling of page), if DOM events target Qrafty's stage
	// automatically called for all incoming DOM events
	preventBubbling: function (e) {
		// only prevent something if DOM event targets Qrafty's stage
		// prevent bubbling up for all events except key events backspace and F1-F12.
		// prevent default actions for all events except key events backspace and F1-F12 and except actions on INPUT and TEXTAREA.
		// Among others this prevent the arrow keys from scrolling the parent page of an iframe hosting the game
		if (Qrafty.selected && !(e.key === 8 || e.key >= 112 && e.key <= 135)) {
			if (e.stopPropagation) e.stopPropagation();
			else e.cancelBubble = true;

			// Don't prevent default actions if target node is input or textarea.
			if (!e.target || (e.target.nodeName !== "INPUT" && e.target.nodeName !== "TEXTAREA")) {
				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
				return false;
			}
			return true;
		}
	}
};


Qrafty.extend({
	/**@
     * #Qrafty.selected
     * @category Input
     * @kind Property
     * @trigger QraftyFocus - is triggered when Qrafty's stage gets selected
     * @trigger QraftyBlur - is triggered when Qrafty's stage is no longer selected
     *
     * Check whether Qrafty's stage (`Qrafty.stage.elem`) is currently selected.
     *
     * After a click occurs inside Qrafty's stage, this property is set to `true`.
     * After a click occurs outside Qrafty's stage, this property is set to `false`.
     *
     * Defaults to true.
     *
     * @see Qrafty.stage#Qrafty.stage.elem
     */
	selected: true,

	detectBlur: function (e) {
		var selected = ((e.clientX > Qrafty.stage.x && e.clientX < Qrafty.stage.x + Qrafty.viewport.width) &&
            (e.clientY > Qrafty.stage.y && e.clientY < Qrafty.stage.y + Qrafty.viewport.height));

		if (!Qrafty.selected && selected) {
			Qrafty.trigger("QraftyFocus");
		}

		if (Qrafty.selected && !selected) {
			Qrafty.trigger("QraftyBlur");
		}

		Qrafty.selected = selected;
	}
});
