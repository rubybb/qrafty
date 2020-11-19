//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";
const document = window.document;

// figure out which eventName to listen to for mousewheel events
var mouseWheelEvent = typeof document.onwheel !== "undefined" ? "wheel" : // modern browsers
	typeof document.onmousewheel !== "undefined" ? "mousewheel" : // old Webkit and IE
		"DOMMouseScroll"; // old Firefox

//initialize the input events onload
Qrafty._preBind("Load", function () {
	Qrafty.addEvent(this, document.body, "mouseup", Qrafty.detectBlur);
	Qrafty.addEvent(Qrafty.s("Keyboard"), window, "blur", Qrafty.s("Keyboard").resetKeyDown);
	Qrafty.addEvent(Qrafty.s("Mouse"), window, "mouseup", Qrafty.s("Mouse").resetButtonDown);
	Qrafty.addEvent(Qrafty.s("Touch"), window, "touchend", Qrafty.s("Touch").resetTouchPoints);
	Qrafty.addEvent(Qrafty.s("Touch"), window, "touchcancel", Qrafty.s("Touch").resetTouchPoints);

	Qrafty.addEvent(Qrafty.s("Keyboard"), "keydown", Qrafty.s("Keyboard").processEvent);
	Qrafty.addEvent(Qrafty.s("Keyboard"), "keyup", Qrafty.s("Keyboard").processEvent);

	Qrafty.addEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "mousedown", Qrafty.s("Mouse").processEvent);
	Qrafty.addEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "mouseup", Qrafty.s("Mouse").processEvent);
	Qrafty.addEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "mousemove", Qrafty.s("Mouse").processEvent);
	Qrafty.addEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "click", Qrafty.s("Mouse").processEvent);
	Qrafty.addEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "dblclick", Qrafty.s("Mouse").processEvent);

	Qrafty.addEvent(this, Qrafty.stage.elem, "touchstart", this._touchDispatch);
	Qrafty.addEvent(this, Qrafty.stage.elem, "touchmove", this._touchDispatch);
	Qrafty.addEvent(this, Qrafty.stage.elem, "touchend", this._touchDispatch);
	Qrafty.addEvent(this, Qrafty.stage.elem, "touchcancel", this._touchDispatch);
	Qrafty.addEvent(this, Qrafty.stage.elem, "touchleave", this._touchDispatch);

	Qrafty.addEvent(Qrafty.s("MouseWheel"), Qrafty.stage.elem, mouseWheelEvent, Qrafty.s("MouseWheel").processEvent);
});

Qrafty.bind("Pause", function () {
	// Reset pressed keys and buttons
	Qrafty.s("Keyboard").resetKeyDown();
	Qrafty.s("Mouse").resetButtonDown();
});

Qrafty._preBind("QraftyStop", function () {
	// Reset pressed keys and buttons
	Qrafty.s("Keyboard").resetKeyDown();
	Qrafty.s("Mouse").resetButtonDown();
});

Qrafty._preBind("QraftyStop", function () {
	Qrafty.removeEvent(this, document.body, "mouseup", Qrafty.detectBlur);
	Qrafty.removeEvent(Qrafty.s("Keyboard"), window, "blur", Qrafty.s("Keyboard").resetKeyDown);
	Qrafty.removeEvent(Qrafty.s("Mouse"), window, "mouseup", Qrafty.s("Mouse").resetButtonDown);
	Qrafty.removeEvent(Qrafty.s("Touch"), window, "touchend", Qrafty.s("Touch").resetTouchPoints);
	Qrafty.removeEvent(Qrafty.s("Touch"), window, "touchcancel", Qrafty.s("Touch").resetTouchPoints);

	Qrafty.removeEvent(Qrafty.s("Keyboard"), "keydown", Qrafty.s("Keyboard").processEvent);
	Qrafty.removeEvent(Qrafty.s("Keyboard"), "keyup", Qrafty.s("Keyboard").processEvent);

	if (Qrafty.stage) {
		Qrafty.removeEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "mousedown", Qrafty.s("Mouse").processEvent);
		Qrafty.removeEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "mouseup", Qrafty.s("Mouse").processEvent);
		Qrafty.removeEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "mousemove", Qrafty.s("Mouse").processEvent);
		Qrafty.removeEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "click", Qrafty.s("Mouse").processEvent);
		Qrafty.removeEvent(Qrafty.s("Mouse"), Qrafty.stage.elem, "dblclick", Qrafty.s("Mouse").processEvent);

		Qrafty.removeEvent(this, Qrafty.stage.elem, "touchstart", this._touchDispatch);
		Qrafty.removeEvent(this, Qrafty.stage.elem, "touchmove", this._touchDispatch);
		Qrafty.removeEvent(this, Qrafty.stage.elem, "touchend", this._touchDispatch);
		Qrafty.removeEvent(this, Qrafty.stage.elem, "touchcancel", this._touchDispatch);
		Qrafty.removeEvent(this, Qrafty.stage.elem, "touchleave", this._touchDispatch);

		Qrafty.removeEvent(Qrafty.s("MouseWheel"), Qrafty.stage.elem, mouseWheelEvent, Qrafty.s("MouseWheel").processEvent);
	}
});
