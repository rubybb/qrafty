//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";

Qrafty.extend({
	/**@
     * #Qrafty.isometric
     * @category 2D
     * @kind CoreObject
     * 
     * Place entities in a 45deg isometric fashion. The alignment of this
     * grid's axes for tile placement is 90 degrees.  If you are looking
     * to have the grid of tile indicies for this.place aligned to the tiles
     * themselves, use DiamondIso instead.
     */
	isometric: {
		_tile: {
			width: 0,
			height: 0
		},
		_elements: {},
		_pos: {
			x: 0,
			y: 0
		},
		_z: 0,
		/**@
         * #Qrafty.isometric.size
         * @comp Qrafty.isometric
         * @kind Method
         * 
         * @sign public this Qrafty.isometric.size(Number tileSize)
         * @param tileSize - The size of the tiles to place.
         *
         * Method used to initialize the size of the isometric placement.
         * Recommended to use a size values in the power of `2` (128, 64 or 32).
         * This makes it easy to calculate positions and implement zooming.
         *
         * @example
         * ~~~
         * var iso = Qrafty.isometric.size(128);
         * ~~~
         *
         * @see Qrafty.isometric.place
         */
		size: function (width, height) {
			this._tile.width = width;
			this._tile.height = height > 0 ? height : width / 2; //Setup width/2 if height isn't set
			return this;
		},
		/**@
         * #Qrafty.isometric.place
         * @comp Qrafty.isometric
         * @kind Method
         * 
         * @sign public this Qrafty.isometric.place(Number x, Number y, Number z, Entity tile)
         * @param x - The `x` position to place the tile
         * @param y - The `y` position to place the tile
         * @param z - The `z` position or height to place the tile
         * @param tile - The entity that should be position in the isometric fashion
         *
         * Use this method to place an entity in an isometric grid.
         *
         * @example
         * ~~~
         * var iso = Qrafty.isometric.size(128);
         * iso.place(2, 1, 0, Qrafty.e('2D, DOM, Color').color('red').attr({w:128, h:128}));
         * ~~~
         *
         * @see Qrafty.isometric.size
         */
		place: function (x, y, z, obj) {
			var pos = this.pos2px(x, y);
			pos.top -= z * (this._tile.height / 2);
			obj.x = pos.left + Qrafty.viewport._x;
			obj.y = pos.top + Qrafty.viewport._y;
			obj.z += z;
			return this;
		},
		/**@
         * #Qrafty.isometric.pos2px
         * @comp Qrafty.isometric
         * @kind Method
         * 
         * @sign public Object Qrafty.isometric.pos2px(Number x,Number y)
         * @param x - A position along the x axis
         * @param y - A position along the y axis
         * @return An object with `left` and `top` fields {left Number,top Number}
         *
         * This method converts a position in x and y coordinates to one in pixels
         *
         * @example
         * ~~~
         * var iso = Qrafty.isometric.size(128,96);
         * var position = iso.pos2px(100,100); //Object { left=12800, top=4800}
         * ~~~
         */
		pos2px: function (x, y) {
			return {
				left: x * this._tile.width + (y & 1) * (this._tile.width / 2),
				top: y * this._tile.height / 2
			};
		},
		/**@
         * #Qrafty.isometric.px2pos
         * @comp Qrafty.isometric
         * @kind Method
         * 
         * @sign public Object Qrafty.isometric.px2pos(Number left,Number top)
         * @param top - Offset from the top in pixels
         * @param left - Offset from the left in pixels
         * @return An object with `x` and `y` fields representing the position
         *
         * This method converts a position in pixels to x,y coordinates
         *
         * @example
         * ~~~
         * var iso = Qrafty.isometric.size(128,96);
         * var px = iso.pos2px(12800,4800);
         * Qrafty.log(px); //Object { x=100, y=100}
         * ~~~
         */
		px2pos: function (left, top) {
			return {
				x: -Math.ceil(-left / this._tile.width - (top & 1) * 0.5),
				y: top / this._tile.height * 2
			};
		},
		/**@
         * #Qrafty.isometric.centerAt
         * @comp Qrafty.isometric
         * @kind Method
         * 
         * @sign public Obect Qrafty.isometric.centerAt()
         * @returns An object with `top` and `left` fields represneting the viewport's current center
         *
         * @sign public this Qrafty.isometric.centerAt(Number x, Number y)
         * @param x - The x position to center at
         * @param y - The y position to center at
         *
         * This method centers the Viewport at an `x,y` location or gives the current centerpoint of the viewport
         *
         * @example
         * ~~~
         * var iso = Qrafty.isometric.size(128,96).centerAt(10,10); //Viewport is now moved
         * //After moving the viewport by another event you can get the new center point
         * Qrafty.log(iso.centerAt());
         * ~~~
         */
		centerAt: function (x, y) {
			if (typeof x === "number" && typeof y === "number") {
				var center = this.pos2px(x, y);
				Qrafty.viewport._x = -center.left + Qrafty.viewport.width / 2 - this._tile.width / 2;
				Qrafty.viewport._y = -center.top + Qrafty.viewport.height / 2 - this._tile.height / 2;
				return this;
			} else {
				return {
					top: -Qrafty.viewport._y + Qrafty.viewport.height / 2 - this._tile.height / 2,
					left: -Qrafty.viewport._x + Qrafty.viewport.width / 2 - this._tile.width / 2
				};
			}
		},
		/**@
         * #Qrafty.isometric.area
         * @comp Qrafty.isometric
         * @kind Method
         * 
         * @sign public Object Qrafty.isometric.area()
         * @return An obect with `x` and `y` fields, each of which have a start and end field.
         * In other words, the object has this structure: `{x:{start Number,end Number},y:{start Number,end Number}}`
         *
         * This method returns an object representing the bounds of the viewport
         *
         * @example
         * ~~~
         * var iso = Qrafty.isometric.size(128,96).centerAt(10,10); //Viewport is now moved
         * var area = iso.area(); //get the area
         * for(var y = area.y.start;y <= area.y.end;y++){
         *   for(var x = area.x.start ;x <= area.x.end;x++){
         *       iso.place(x,y,0,Qrafty.e("2D,DOM,gras")); //Display tiles in the Screen
         *   }
         * }
         * ~~~
         */
		area: function () {
			//Get the center Point in the viewport
			var center = this.centerAt();
			var start = this.px2pos(-center.left + Qrafty.viewport.width / 2, -center.top + Qrafty.viewport.height / 2);
			var end = this.px2pos(-center.left - Qrafty.viewport.width / 2, -center.top - Qrafty.viewport.height / 2);
			return {
				x: {
					start: start.x,
					end: end.x
				},
				y: {
					start: start.y,
					end: end.y
				}
			};
		}
	}
});
