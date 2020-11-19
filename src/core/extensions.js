//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";
var document = (typeof window !== "undefined") && window.document;

/**@
 * #Qrafty.support
 * @category Misc, Core
 * @kind CoreObject
 * 
 * Determines feature support for what Qrafty can do.
 */
(function testSupport() {
	var support = Qrafty.support = {},
		ua = (typeof navigator !== "undefined" && navigator.userAgent.toLowerCase()) || (typeof process !== "undefined" && process.version),
		match = /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
            /(ms)ie ([\w.]+)/.exec(ua) ||
            /(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) ||
            /(v)\d+\.(\d+)/.exec(ua) || [],
		mobile = /iPad|iPod|iPhone|Android|webOS|IEMobile/i.exec(ua);

	/**@
     * #Qrafty.mobile
     * @comp Qrafty.device
     * @kind Property
     *
     * Determines if Qrafty is running on mobile device.
     *
     * If Qrafty.mobile is equal true Qrafty does some things under hood:
     * ~~~
     * - set viewport on max device width and height
     * - set Qrafty.stage.fullscreen on true
     * - hide window scrollbars
     * ~~~
     *
     * @see Qrafty.viewport
     */
	if (mobile) Qrafty.mobile = mobile[0];

	/**@
     * #Qrafty.support.defineProperty
     * @comp Qrafty.support
     * @kind Property
     * 
     * Is `Object.defineProperty` supported?
     */
	support.defineProperty = (function () {
		if (!("defineProperty" in Object)) return false;
		try { Object.defineProperty({}, "x", {});
		} catch (e) {
			return false;
		}
		return true;
	})();

	/**@
     * #Qrafty.support.audio
     * @comp Qrafty.support
     * @kind Property
     * 
     * Is HTML5 `Audio` supported?
     */
	support.audio = (typeof window !== "undefined") && ("canPlayType" in document.createElement("audio"));

	/**@
     * #Qrafty.support.prefix
     * @comp Qrafty.support
     * @kind Property
     * 
     * Returns the browser specific prefix (`Moz`, `O`, `ms`, `webkit`, `node`).
     */
	support.prefix = (match[1] || match[0]);

	//browser specific quirks
	if (support.prefix === "moz") support.prefix = "Moz";
	if (support.prefix === "o") support.prefix = "O";
	if (support.prefix === "v") support.prefix = "node";

	if (match[2]) {
		/**@
         * #Qrafty.support.versionName
         * @comp Qrafty.support
         * @kind Property
         * 
         * Version of the browser
         */
		support.versionName = match[2];

		/**@
         * #Qrafty.support.version
         * @comp Qrafty.support
         * @kind Property
         * 
         * Version number of the browser as an Integer (first number)
         */
		support.version = +(match[2].split("."))[0];
	}

	/**@
     * #Qrafty.support.canvas
     * @comp Qrafty.support
     * @kind Property
     * 
     * Is the `canvas` element supported?
     */
	support.canvas = (typeof window !== "undefined") && ("getContext" in document.createElement("canvas"));

	/**@
     * #Qrafty.support.webgl
     * @comp Qrafty.support
     * @kind Property
     * 
     * Is WebGL supported on the canvas element?
     */
	if (support.canvas) {
		var gl;
		try {
			var c = document.createElement("canvas");
			gl = c.getContext("webgl") || c.getContext("experimental-webgl");
			gl.viewportWidth = support.canvas.width;
			gl.viewportHeight = support.canvas.height;
		} catch (e) {}
		support.webgl = !! gl;
	} else {
		support.webgl = false;
	}

	/**@
     * #Qrafty.support.css3dtransform
     * @comp Qrafty.support
     * @kind Property
     * 
     * Is css3Dtransform supported by browser.
     */
	support.css3dtransform = (typeof window !== "undefined") && ((typeof document.createElement("div").style.Perspective !== "undefined") || (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined"));

	/**@
     * #Qrafty.support.deviceorientation
     * @comp Qrafty.support
     * @kind Property
     * Is deviceorientation event supported by browser.
     */
	support.deviceorientation = (typeof window !== "undefined") && ((typeof window.DeviceOrientationEvent !== "undefined") || (typeof window.OrientationEvent !== "undefined"));

	/**@
     * #Qrafty.support.devicemotion
     * @comp Qrafty.support
     * @kind Property
     * 
     * Is devicemotion event supported by browser.
     */
	support.devicemotion = (typeof window !== "undefined") && (typeof window.DeviceMotionEvent !== "undefined");

})();
