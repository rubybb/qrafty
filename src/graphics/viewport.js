//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";
const document = window.document;

Qrafty.extend({
	/**@
     * #Qrafty.viewport
     * @category Stage
     * @kind Property
     * 
     * @trigger ViewportScroll - when the viewport's x or y coordinates change
     * @trigger ViewportScale - when the viewport's scale changes
     * @trigger ViewportResize - when the viewport's dimension's change
     * @trigger InvalidateViewport - when the viewport changes
     * @trigger StopCamera - when any camera animations should stop, such as at the start of a new animation.
     * @trigger CameraAnimationDone - when a camera animation reaches completion
     *
     * Viewport is essentially a 2D camera looking at the stage. Can be moved or zoomed, which
     * in turn will react just like a camera moving in that direction.
     *
     * There are multiple camera animation methods available - these are the viewport methods with an animation time parameter and the `follow` method.
     * Only one animation can run at a time. Starting a new animation will cancel the previous one and the appropriate events will be fired.
     * 
     * Tip: At any given moment, the stuff that you can see is...
     * 
     * `x` between `(-Qrafty.viewport._x)` and `(-Qrafty.viewport._x + (Qrafty.viewport._width / Qrafty.viewport._scale))`
     * 
     * `y` between `(-Qrafty.viewport._y)` and `(-Qrafty.viewport._y + (Qrafty.viewport._height / Qrafty.viewport._scale))`
     *
     *
     * @example
     * Prevent viewport from adjusting itself when outside the game world.
     * Scale the viewport so that entities appear twice as large.
     * Then center the viewport on an entity over the duration of 3 seconds.
     * After that animation finishes, start following the entity.
     * ~~~
     * var ent = Qrafty.e('2D, DOM').attr({x: 250, y: 250, w: 100, h: 100});
     *
     * Qrafty.viewport.clampToEntities = false;
     * Qrafty.viewport.scale(2);
     * Qrafty.one("CameraAnimationDone", function() {
     *     Qrafty.viewport.follow(ent, 0, 0);
     * });
     * Qrafty.viewport.centerOn(ent, 3000);
     * ~~~
     */
	viewport: {
		/**@
         * #Qrafty.viewport.clampToEntities
         * @comp Qrafty.viewport
         * @kind Property
         *
         * Decides if the viewport functions should clamp to game entities.
         * When set to `true` functions such as Qrafty.viewport.mouselook() will not allow you to move the
         * viewport over areas of the game that has no entities.
         * For development it can be useful to set this to false.
         */
		clampToEntities: true,
		_width: 0,
		_height: 0,
		/**@
         * #Qrafty.viewport.x
         * @comp Qrafty.viewport
         * @kind Property
         *
         * Will move the stage and therefore every visible entity along the `x`
         * axis in the opposite direction.
         *
         * When this value is set, it will shift the entire stage. This means that entity
         * positions are not exactly where they are on screen. To get the exact position,
         * simply add `Qrafty.viewport.x` onto the entities `x` position.
         */
		_x: 0,
		/**@
         * #Qrafty.viewport.y
         * @comp Qrafty.viewport
         * @kind Property
         *
         * Will move the stage and therefore every visible entity along the `y`
         * axis in the opposite direction.
         *
         * When this value is set, it will shift the entire stage. This means that entity
         * positions are not exactly where they are on screen. To get the exact position,
         * simply add `Qrafty.viewport.y` onto the entities `y` position.
         */
		_y: 0,

		/**@
         * #Qrafty.viewport._scale
         * @comp Qrafty.viewport
         * @kind Property
         *
         * This value is the current scale (zoom) of the viewport. When the value is bigger than 1, everything
         * looks bigger (zoomed in). When the value is less than 1, everything looks smaller (zoomed out). This
         * does not alter the size of the stage itself, just the magnification of what it shows.
         * 
         * This is a read-only property: Do not set it directly. Instead, use `Qrafty.viewport.scale(...)`
         * or `Qrafty.viewport.zoom(...)`
         */

		_scale: 1,

		/**@
         * #Qrafty.viewport.bounds
         * @comp Qrafty.viewport
         * @kind Property
         *
         * A rectangle which defines the bounds of the viewport.
         * It should be an object with two properties, `max` and `min`,
         * which are each an object with `x` and `y` properties.
         *
         * If this property is null, Qrafty uses the bounding box of all the items
         * on the stage.  This is the initial value.  (To prevent this behavior, set `Qrafty.viewport.clampToEntities` to `false`)
         *
         * If you wish to bound the viewport along one axis but not the other, you can use `-Infinity` and `+Infinity` as bounds.
         *
         * @see Qrafty.viewport.clampToEntities
         *
         * @example
         * Set the bounds to a 500 by 500 square:
         *
         * ~~~
         * Qrafty.viewport.bounds = {min:{x:0, y:0}, max:{x:500, y:500}};
         * ~~~
         */
		bounds: null,

		/**@
         * #Qrafty.viewport.scroll
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign Qrafty.viewport.scroll(String axis, Number val)
         * @param axis - 'x' or 'y'
         * @param val - The new absolute position on the axis
         *
         * Will move the viewport to the position given on the specified axis
         *
         * @example
         * Will move the camera 500 pixels right of its initial position, in effect
         * shifting everything in the viewport 500 pixels to the left.
         *
         * ~~~
         * Qrafty.viewport.scroll('_x', 500);
         * ~~~
         */
		scroll: function (axis, val) {
			this[axis] = val;
			Qrafty.trigger("ViewportScroll");
			Qrafty.trigger("InvalidateViewport");
		},

		rect_object: { _x: 0, _y: 0, _w: 0, _h: 0},

		/**@
         * #Qrafty.viewport.rect
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public Object Qrafty.viewport.rect([Object out])
         * @param Object out - an optional Object to write the `rect` to
         * @return a rectangle encompassing the currently visible viewport region.
         *         Contains the `_x`,`_y`,`_w`,`_h` properties.
         *
         * Convenience method which returns a `rect` of the currently visible viewport region.
         * With no supplied `out` parameter, this method returns an internally reused object across invocations.
         * If you want to save the viewport region for later use, pass an `out` argument instead, where the region will be written to.
         *
         * @example
         * The `rect` is equivalent to the following properties:
         * ~~~
         * var rect = Qrafty.viewport.rect();
         *
         * rect._x === -Qrafty.viewport._x
         * rect._y === -Qrafty.viewport._y
         * rect._w === Qrafty.viewport._width / Qrafty.viewport._scale
         * rect._h === Qrafty.viewport._height / Qrafty.viewport._scale
         * ~~~
         */
		rect: function (out) {
			out = out || this.rect_object;
			out._x = -this._x;
			out._y = -this._y;
			out._w = this._width / this._scale;
			out._h = this._height / this._scale;
			return out;
		},

		/**@ 

         * #Qrafty.viewport.pan
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.pan(Number dx, Number dy, Number time[, String|function easingFn])
         * @param Number dx - The distance along the x axis
         * @param Number dy - The distance along the y axis
         * @param Number time - The duration in ms for the entire camera movement
         * @param easingFn - A string or custom function specifying an easing.  (Defaults to linear behavior.)  See Qrafty.easing for more information.
         *
         * Pans the camera a given number of pixels over the specified time
         *
         * @example
         * ~~~
         * // pan the camera 100 px right and down over the duration of 2 seconds using linear easing behaviour
         * Qrafty.viewport.pan(100, 100, 2000);
         * ~~~
         */
		pan: (function () {
			var targetX, targetY, startingX, startingY, easing;

			function updateFrame(e) {
				easing.tick(e.dt);
				var v = easing.value();
				Qrafty.viewport.x = (1-v) * startingX + v * targetX;
				Qrafty.viewport.y = (1-v) * startingY + v * targetY;
				Qrafty.viewport._clamp();

				if (easing.complete){
					stopPan();
					Qrafty.trigger("CameraAnimationDone");
				}
			}

			function stopPan(){
				Qrafty.unbind("UpdateFrame", updateFrame);
			}

			Qrafty._preBind("StopCamera", stopPan);

			return function (dx, dy, time, easingFn) {
				// Cancel any current camera control
				Qrafty.trigger("StopCamera");

				// Handle request to reset
				if (dx === "reset") {
					return;
				}

				startingX = Qrafty.viewport._x;
				startingY = Qrafty.viewport._y;
				targetX = startingX - dx;
				targetY = startingY - dy;

				easing = new Qrafty.easing(time, easingFn);

				// bind to event, using uniqueBind prevents multiple copies from being bound
				Qrafty.uniqueBind("UpdateFrame", updateFrame);
                       
			};
		})(),

		/**@
         * #Qrafty.viewport.follow
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.follow(Object target, Number offsetx, Number offsety)
         * @param Object target - An entity with the 2D component
         * @param Number offsetx - Follow target's center should be offsetx pixels away from viewport's center. Positive values puts target to the right of the screen.
         * @param Number offsety - Follow target's center should be offsety pixels away from viewport's center. Positive values puts target to the bottom of the screen.
         *
         * Follows a given entity with the 2D component. If following target will take a portion of
         * the viewport out of bounds of the world, following will stop until the target moves away.
         *
         * @example
         * ~~~
         * var ent = Qrafty.e('2D, DOM').attr({w: 100, h: 100});
         * Qrafty.viewport.follow(ent, 0, 0);
         * ~~~
         */
		follow: (function () {
			var oldTarget, offx, offy;

			function change() {
				var scale = Qrafty.viewport._scale;
				Qrafty.viewport.scroll("_x", -(this.x + (this.w / 2) - (Qrafty.viewport.width / 2 / scale) - offx * scale));
				Qrafty.viewport.scroll("_y", -(this.y + (this.h / 2) - (Qrafty.viewport.height / 2 / scale) - offy * scale));
				Qrafty.viewport._clamp();
			}

			function stopFollow(){
				if (oldTarget) {
					oldTarget.unbind("Move", change);
					oldTarget.unbind("ViewportScale", change);
					oldTarget.unbind("ViewportResize", change);
				}
			}

			Qrafty._preBind("StopCamera", stopFollow);

			return function (target, offsetx, offsety) {
				if (!target || !target.has("2D"))
					return;
				Qrafty.trigger("StopCamera");

				oldTarget = target;
				offx = (typeof offsetx !== "undefined") ? offsetx : 0;
				offy = (typeof offsety !== "undefined") ? offsety : 0;

				target.bind("Move", change);
				target.bind("ViewportScale", change);
				target.bind("ViewportResize", change);
				change.call(target);
			};
		})(),

		/**@
         * #Qrafty.viewport.centerOn
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.centerOn(Object target, Number time)
         * @param Object target - An entity with the 2D component
         * @param Number time - The duration in ms of the camera motion
         *
         * Centers the viewport on the given entity.
         *
         * @example
         * ~~~
         * var ent = Qrafty.e('2D, DOM').attr({x: 250, y: 250, w: 100, h: 100});
         * Qrafty.viewport.centerOn(ent, 3000);
         * ~~~
         */
		centerOn: function (targ, time) {
			var x = targ.x + Qrafty.viewport.x,
				y = targ.y + Qrafty.viewport.y,
				mid_x = targ.w / 2,
				mid_y = targ.h / 2,
				cent_x = Qrafty.viewport.width / 2 / Qrafty.viewport._scale,
				cent_y = Qrafty.viewport.height / 2 / Qrafty.viewport._scale,
				new_x = x + mid_x - cent_x,
				new_y = y + mid_y - cent_y;

			Qrafty.viewport.pan(new_x, new_y, time);
		},

		/**@
         * #Qrafty.viewport.zoom
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.zoom(Number amt, Number cent_x, Number cent_y, Number time[, String|function easingFn])
         * @param Number amt - amount to zoom in on the target by (eg. 2, 4, 0.5)
         * @param Number cent_x - the center to zoom on
         * @param Number cent_y - the center to zoom on
         * @param Number time - the duration in ms of the entire zoom operation
         * @param easingFn - A string or custom function specifying an easing.  (Defaults to linear behavior.)  See Qrafty.easing for more information.
         *
         * Zooms the camera in on a given point. amt > 1 will bring the camera closer to the subject
         * amt < 1 will bring it farther away. amt = 0 will reset to the default zoom level
         * Zooming is multiplicative. To reset the zoom amount, pass 0.
         *
         * @example
         * ~~~
         * // Make the entities appear twice as large by zooming in on the specified coordinates over the duration of 3 seconds using linear easing behavior
         * Qrafty.viewport.zoom(2, 100, 100, 3000);
         * ~~~
         */
		zoom: (function () {
            

			function stopZoom(){
				Qrafty.unbind("UpdateFrame", updateFrame);
			}
			Qrafty._preBind("StopCamera", stopZoom);

			var startingZoom, finalZoom, finalAmount, startingX, finalX, startingY, finalY, easing;

			function updateFrame(e){
				var amount, v;

				easing.tick(e.dt);

				// The scaling should happen smoothly -- start at 1, end at finalAmount, and at half way scaling should be by finalAmount^(1/2)
				// Since value goes smoothly from 0 to 1, this fufills those requirements
				amount = Math.pow(finalAmount, easing.value() );

				// The viewport should move in such a way that no point reverses
				// If a and b are the top left/bottom right of the viewport, then the below can be derived from
				//      (a_0-b_0)/(a-b) = amount,
				// and the assumption that both a and b have the same form
				//      a = a_0 * (1-v) + a_f * v,
				//      b = b_0 * (1-v) + b_f * v.
				// This is just an arbitrary parameterization of the only sensible path for the viewport corners to take.
				// And by symmetry they should be parameterized in the same way!  So not much choice here.
				if (finalAmount === 1)
					v = easing.value();  // prevent NaN!  If zoom is used this way, it'll just become a pan.
				else
					v = (1/amount - 1 ) / (1/finalAmount - 1);

				// Set new scale and viewport position
				Qrafty.viewport.scale( amount * startingZoom );
				Qrafty.viewport.scroll("_x", startingX * (1-v) + finalX * v );
				Qrafty.viewport.scroll("_y", startingY * (1-v) + finalY * v );
				Qrafty.viewport._clamp();

				if (easing.complete){
					stopZoom();
					Qrafty.trigger("CameraAnimationDone");
				}


			}

			return function (amt, cent_x, cent_y, time, easingFn){
				if (!amt) { // we're resetting to defaults
					Qrafty.viewport.scale(1);
					return;
				}

				if (arguments.length <= 2) {
					time = cent_x;
					cent_x = Qrafty.viewport.x - Qrafty.viewport.width;
					cent_y = Qrafty.viewport.y - Qrafty.viewport.height;
				}

				Qrafty.trigger("StopCamera");
				startingZoom = Qrafty.viewport._scale;
				finalAmount = amt;
				finalZoom = startingZoom * finalAmount;
                

				startingX = Qrafty.viewport.x;
				startingY = Qrafty.viewport.y;
				finalX = - (cent_x - Qrafty.viewport.width  / (2 * finalZoom) );
				finalY = - (cent_y - Qrafty.viewport.height / (2 * finalZoom) );

				easing = new Qrafty.easing(time, easingFn);

				Qrafty.uniqueBind("UpdateFrame", updateFrame);
			};

            
		})(),
		/**@
         * #Qrafty.viewport.scale
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.scale(Number amt)
         * @param Number amt - amount to zoom/scale in on the elements
         *
         * Adjusts the scale (zoom). When `amt` is 1, it is set to the normal scale,
         * e.g. an entity with `this.w == 20` would appear exactly 20 pixels wide.
         * When `amt` is 10, that same entity would appear 200 pixels wide (i.e., zoomed in
         * by a factor of 10), and when `amt` is 0.1, that same entity would be 2 pixels wide
         * (i.e., zoomed out by a factor of `(1 / 0.1)`).
         * 
         * If you pass an `amt` of 0, it is treated the same as passing 1, i.e. the scale is reset.
         *
         * This method sets the absolute scale, while `Qrafty.viewport.zoom` sets the scale relative to the existing value.
         * @see Qrafty.viewport.zoom
         *
         * @example
         * ~~~
         * Qrafty.viewport.scale(2); // Zoom in -- all entities will appear twice as large.
         * ~~~
         */
		scale: (function () {
			return function (amt) {
				this._scale = amt ? amt : 1;
				Qrafty.trigger("InvalidateViewport");
				Qrafty.trigger("ViewportScale");

			};
		})(),

		/**@
         * #Qrafty.viewport.mouselook
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.mouselook(Boolean active)
         * @param Boolean active - Activate or deactivate mouselook
         *
         * Toggle mouselook on the current viewport.
         * Simply call this function and the user will be able to
         * drag the viewport around.
         *
         * If the user starts a drag, "StopCamera" will be triggered, which will cancel any existing camera animations.
         */
		mouselook: (function () {
			var mouseSystem;

			var active = false,
				dragging = false,
				lastMouse = {x: 0, y: 0},
				diff = {x: 0, y: 0};

			function startFn (e) {
				if (dragging || e.target) return;

				Qrafty.trigger("StopCamera");
				// DEPRECATED: switch computation to use e.realX, e.realY
				lastMouse.x = e.clientX;
				lastMouse.y = e.clientY;
				dragging = true;
			}
			function moveFn (e) {
				if (!dragging) return;

				diff.x = e.clientX - lastMouse.x;
				diff.y = e.clientY - lastMouse.y;

				lastMouse.x = e.clientX;
				lastMouse.y = e.clientY;

				var viewport = Qrafty.viewport;
				viewport.x += diff.x / viewport._scale;
				viewport.y += diff.y / viewport._scale;
				viewport._clamp();
			}
			function stopFn (e) {
				if (!dragging) return;

				dragging = false;
			}

			return function (op) {
				// TODO: lock pointer events on controls system in future
				mouseSystem = Qrafty.s("Mouse");

				if (op && !active) {
					mouseSystem.bind("MouseDown", startFn);
					mouseSystem.bind("MouseMove", moveFn);
					mouseSystem.bind("MouseUp", stopFn);
					active = op;
				} else if (!op && active) {
					mouseSystem.unbind("MouseDown", startFn);
					mouseSystem.unbind("MouseMove", moveFn);
					mouseSystem.unbind("MouseUp", stopFn);
					active = op;
				}
			};
		})(),

		_clamp: function () {
			// clamps the viewport to the viewable area
			// under no circumstances should the viewport see something outside the boundary of the 'world'
			if (!this.clampToEntities) return;
			var bound = Qrafty.clone(this.bounds) || Qrafty.map.boundaries();
			bound.max.x *= this._scale;
			bound.min.x *= this._scale;
			bound.max.y *= this._scale;
			bound.min.y *= this._scale;
			if (bound.max.x - bound.min.x > Qrafty.viewport.width) {
				if (Qrafty.viewport.x < (-bound.max.x + Qrafty.viewport.width) / this._scale) {
					Qrafty.viewport.x = (-bound.max.x + Qrafty.viewport.width) / this._scale;
				} else if (Qrafty.viewport.x > -bound.min.x) {
					Qrafty.viewport.x = -bound.min.x;
				}
			} else {
				Qrafty.viewport.x = -1 * (bound.min.x + (bound.max.x - bound.min.x) / 2 - Qrafty.viewport.width / 2);
			}
			if (bound.max.y - bound.min.y > Qrafty.viewport.height) {
				if (Qrafty.viewport.y < (-bound.max.y + Qrafty.viewport.height) / this._scale) {
					Qrafty.viewport.y = (-bound.max.y + Qrafty.viewport.height) / this._scale;
				} else if (Qrafty.viewport.y > -bound.min.y) {
					Qrafty.viewport.y = -bound.min.y;
				}
			} else {
				Qrafty.viewport.y = -1 * (bound.min.y + (bound.max.y - bound.min.y) / 2 - Qrafty.viewport.height / 2);
			}
		},

		/**@
         * #Qrafty.viewport.init
         * @comp Qrafty.stage
         * @kind Method
         * 
         * @sign public void Qrafty.viewport.init([Number width, Number height][, String stage_elem])
         * @sign public void Qrafty.viewport.init([Number width, Number height][, HTMLElement stage_elem])
         * @param Number width - Width of the viewport
         * @param Number height - Height of the viewport
         * @param String or HTMLElement stage_elem - the element to use as the stage (either its id or the actual element).
         *
         * Initialize the viewport.
         * If the arguments 'width' or 'height' are missing, use `window.innerWidth` and `window.innerHeight` (full screen model).
         * The argument 'stage_elem' is used to specify a stage element other than the default, and can be either a string or an HTMLElement.  If a string is provided, it will look for an element with that id and, if none exists, create a div.  If an HTMLElement is provided, that is used directly.  Omitting this argument is the same as passing an id of 'cr-stage'.
         *
         * Usually you don't have to initialize the viewport by yourself, it's automatically initialized by calling `Qrafty.init()`. Multiple `init`s will create redundant stage elements. Use `Qrafty.viewport.width`, `Qrafty.viewport.height` or `Qrafty.viewport.reload` to adjust the current viewport's dimensions.
         *
         * @see Qrafty.device, Qrafty.domHelper, Qrafty.stage, Qrafty.viewport.reload
         */
		init: function (w, h, stage_elem) {
			// Handle specifying stage_elem without w & h
			if (typeof(stage_elem) === "undefined" && typeof(h) === "undefined" &&
                typeof(w) !=="undefined" && typeof(w) !== "number") {
				stage_elem = w;
				w = window.innerWidth;
				h = window.innerHeight;
			}

			// Define default graphics layers with default z-layers
			Qrafty.createLayer("DefaultCanvasLayer", "Canvas", {z: 20});
			Qrafty.createLayer("DefaultDOMLayer", "DOM", {z: 30});
			Qrafty.createLayer("DefaultWebGLLayer", "WebGL", {z: 10});
            
			// setters+getters for the viewport
			this._defineViewportProperties();

			// Set initial values -- necessary on restart
			this._x = 0;
			this._y = 0;
			this._scale = 1;
			this.bounds = null;

			// If no width or height is defined, the width and height is set to fullscreen
			this._width = w || window.innerWidth;
			this._height = h || window.innerHeight;

			/**@
             * #Qrafty.stage
             * @category Core
             * @kind CoreObject
             * 
             * The stage where all the DOM entities will be placed.
             */

			/**@
             * #Qrafty.stage.elem
             * @comp Qrafty.stage
             * @kind Property
             * 
             * The `#cr-stage` div element.
             */

			//create stage div to contain everything
			Qrafty.stage = {
				x: 0,
				y: 0,
				fullscreen: false,
				elem: stage_elem
			};

			//fullscreen, stop scrollbars
			if (!w && !h) {
				document.body.style.overflow = "hidden";
				Qrafty.stage.fullscreen = true;
			}

			Qrafty.addEvent(this, window, "resize", Qrafty.viewport.reload);

			Qrafty.addEvent(this, window, "blur", function () {
				if (Qrafty.settings.get("autoPause")) {
					if (!Qrafty._paused) Qrafty.pause();
				}
			});
			Qrafty.addEvent(this, window, "focus", function () {
				if (Qrafty._paused && Qrafty.settings.get("autoPause")) {
					Qrafty.pause();
				}
			});

			//make the stage unselectable
			Qrafty.settings.register("stageSelectable", function (v) {
				Qrafty.stage.elem.onselectstart = v ? function () {
					return true;
				} : function () {
					return false;
				};
			});
			Qrafty.settings.modify("stageSelectable", false);

			//make the stage have no context menu
			Qrafty.settings.register("stageContextMenu", function (v) {
				Qrafty.stage.elem.oncontextmenu = v ? function () {
					return true;
				} : function () {
					return false;
				};
			});
			Qrafty.settings.modify("stageContextMenu", false);

			Qrafty.settings.register("autoPause", function () {});
			Qrafty.settings.modify("autoPause", false);

			//add to the body and give it an ID if not exists
			if (!stage_elem) {
				document.body.appendChild(Qrafty.stage.elem);
				Qrafty.stage.elem.id = stage_elem;
			}

			var elem = Qrafty.stage.elem.style,
				offset;

			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";


			// resize events
			Qrafty.bind("ViewportResize", function(){Qrafty.trigger("InvalidateViewport");});

			if (Qrafty.mobile) {

				// remove default gray highlighting after touch
				if (typeof elem.webkitTapHighlightColor !== undefined) {
					elem.webkitTapHighlightColor = "rgba(0,0,0,0)";
				}

				var meta = document.createElement("meta"),
					head = document.getElementsByTagName("head")[0];

				//hide the address bar
				meta = document.createElement("meta");
				meta.setAttribute("name", "apple-mobile-web-app-capable");
				meta.setAttribute("content", "yes");
				head.appendChild(meta);

				Qrafty.addEvent(this, Qrafty.stage.elem, "touchmove", function (e) {
					e.preventDefault();
				});


			}
            
			elem.position = "relative";
			//find out the offset position of the stage
			offset = Qrafty.domHelper.innerPosition(Qrafty.stage.elem);
			Qrafty.stage.x = offset.x;
			Qrafty.stage.y = offset.y;

			Qrafty.uniqueBind("ViewportResize", this._resize);
		},

		_resize: function(){
			Qrafty.stage.elem.style.width = Qrafty.viewport.width + "px";
			Qrafty.stage.elem.style.height = Qrafty.viewport.height + "px";
		},

		// Create setters/getters for x, y, width, height
		_defineViewportProperties: function(){
			Object.defineProperty(this, "x", {
				set: function (v) {
					this.scroll("_x", v);
				},
				get: function () {
					return this._x;
				},
				configurable : true
			});
			Object.defineProperty(this, "y", {
				set: function (v) {
					this.scroll("_y", v);
				},
				get: function () {
					return this._y;
				},
				configurable : true
			});
			Object.defineProperty(this, "width", {
				set: function (v) {
					this._width = v;
					Qrafty.trigger("ViewportResize");
				},
				get: function () {
					return this._width;
				},
				configurable : true
			});
			Object.defineProperty(this, "height", {
				set: function (v) {
					this._height = v;
					Qrafty.trigger("ViewportResize");
				},
				get: function () {
					return this._height;
				},
				configurable : true
			});
		},

		/**@
         * #Qrafty.viewport.reload
         * @comp Qrafty.stage
         * @kind Method
         *
         * @sign public Qrafty.viewport.reload()
         *
         * Recalculate and reload stage width, height and position.
         * Useful when browser return wrong results on init (like safari on Ipad2).
         * You should also call this method if you insert custom DOM elements that affect Qrafty's stage offset.
         *
         */
		reload: function () {
			var w = window.innerWidth,
				h= window.innerHeight,
				offset;


			if (Qrafty.stage.fullscreen) {
				this._width = w;
				this._height = h;
				Qrafty.trigger("ViewportResize");
			}

			offset = Qrafty.domHelper.innerPosition(Qrafty.stage.elem);
			Qrafty.stage.x = offset.x;
			Qrafty.stage.y = offset.y;
		},

		/**@
         * #Qrafty.viewport.reset
         * @comp Qrafty.stage
         * @kind Method
         * 
         * @trigger StopCamera - called to cancel camera animations
         *
         * @sign public Qrafty.viewport.reset()
         *
         * Resets the viewport to starting values, and cancels any existing camera animations.
         * Called when scene() is run.
         */
		reset: function () {
			Qrafty.viewport.mouselook(false);
			Qrafty.trigger("StopCamera");
			// Reset viewport position and scale
			Qrafty.viewport.scroll("_x", 0);
			Qrafty.viewport.scroll("_y", 0);
			Qrafty.viewport.scale(1);
		},

		/**@
         * #Qrafty.viewport.onScreen
         * @comp Qrafty.viewport
         * @kind Method
         * 
         * @sign public Qrafty.viewport.onScreen(Object rect)
         * @param rect - A rectangle with field {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
         *
         * Test if a rectangle is completely in viewport
         */
		onScreen: function (rect) {
			return Qrafty.viewport._x + rect._x + rect._w > 0 && Qrafty.viewport._y + rect._y + rect._h > 0 &&
                Qrafty.viewport._x + rect._x < Qrafty.viewport.width && Qrafty.viewport._y + rect._y < Qrafty.viewport.height;
		}
	}
});
