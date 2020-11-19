//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";
const document = window.document;

/**@
 * #DebugCanvas
 * @category Debug
 * @kind Component
 * 
 * @trigger DebugDraw - when the entity is ready to be drawn to the stage
 * @trigger NoCanvas - if the browser does not support canvas
 *
 * When this component is added to an entity it will be drawn by the DebugCanvas layer.
 *
 * Qrafty.debugCanvas.init() will be automatically called if it is not called already to initialize the canvas element.
 *
 * To visualise an object's MBR, use "WiredMBR" or "SolidMBR".
 * To visualise a "Collision" object's hitbox, use "WiredHitBox" or "SolidHitBox".
 * To visualize an entity's click area, use "WiredAreaMap" or "SolidAreaMap".
 *
 * @see DebugPolygon,  DebugRectangle
 */
Qrafty.c("DebugCanvas", {
	init: function () {
		this.requires("2D");
		if (!Qrafty.DebugCanvas.context)
			Qrafty.DebugCanvas.init();
		Qrafty.DebugCanvas.add(this);
		this._debug = {
			alpha: 1.0,
			lineWidth: 1
		};
		this.bind("RemoveComponent", this.onDebugRemove);
		this.bind("Remove", this.onDebugDestroy);
	},

	// When component is removed
	onDebugRemove: function (id) {
		if (id === "DebugCanvas") {
			Qrafty.DebugCanvas.remove(this);
		}
	},

	//When entity is destroyed
	onDebugDestroy: function (id) {
		Qrafty.DebugCanvas.remove(this);
	},

	/**@
     * #.debugAlpha
     * @comp DebugCanvas
     * @kind Method
     * 
     * @sign public  .debugAlpha(Number alpha)
     * @param alpha - The alpha level the component will be drawn with
     */
	debugAlpha: function (alpha) {
		this._debug.alpha = alpha;
		return this;
	},

	/**@
     * #.debugFill
     * @comp DebugCanvas
     * @kind Method
     * 
     * @sign public  .debugFill([String fillStyle])
     * @param fillStyle - The color the component will be filled with.  Defaults to "red". Pass the boolean false to turn off filling.
     * @example
     * ~~~
     * var myEntity = Qrafty.e("2D, Collision, SolidHitBox ").debugFill("purple")
     * ~~~
     */
	debugFill: function (fillStyle) {
		if (typeof fillStyle === "undefined")
			fillStyle = "red";
		this._debug.fillStyle = fillStyle;
		return this;
	},

	/**@
     * #.debugStroke
     * @comp DebugCanvas
     * @kind Method
     * 
     * @sign public  .debugStroke([String strokeStyle])
     * @param strokeStyle - The color the component will be outlined with.  Defaults to "red".  Pass the boolean false to turn this off.
     * @example
     * ~~~
     * var myEntity = Qrafty.e("2D, Collision, WiredHitBox ").debugStroke("white")
     * ~~~
     */
	debugStroke: function (strokeStyle) {
		if (typeof strokeStyle === "undefined")
			strokeStyle = "red";
		this._debug.strokeStyle = strokeStyle;
		return this;
	},

	debugDraw: function (ctx) {
		var ga = ctx.globalAlpha;
		var props = this._debug;

		if (props.alpha)
			ctx.globalAlpha = this._debug.alpha;

		if (props.strokeStyle)
			ctx.strokeStyle = props.strokeStyle;

		if (props.lineWidth)
			ctx.lineWidth = props.lineWidth;

		if (props.fillStyle)
			ctx.fillStyle = props.fillStyle;

		this.trigger("DebugDraw", ctx);

		ctx.globalAlpha = ga;

	}


});



/**@
 * #DebugRectangle
 * @category Debug
 * @kind Component
 *
 * A component for rendering an object with a position and dimensions to the debug canvas.
 *
 *
 * ~~~
 * var myEntity = Qrafty.e("2D, DebugRectangle")
 *                      .attr({x: 13, y: 37, w: 42, h: 42})
 *                      .debugStroke("green");
 * myEntity.debugRectangle(myEntity)
 *~~~
 * @see DebugCanvas
 */
Qrafty.c("DebugRectangle", {
	init: function () {
		this.requires("2D, DebugCanvas");
	},

	/**@
     * #.debugRectangle
     * @comp DebugRectangle
     * @kind Method
     * 
     * @sign public  .debugRectangle(Object rect)
     * @param rect - an object with _x, _y, _w, and _h to draw
     *
     * Sets the rectangle that this component draws to the debug canvas.
     *
     */
	debugRectangle: function (rect) {
		this.debugRect = rect;
		this.unbind("DebugDraw", this.drawDebugRect);
		this.bind("DebugDraw", this.drawDebugRect);
		return this;

	},

	drawDebugRect: function (ctx) {

		var rect = this.debugRect;
		if (rect === null || rect === undefined)
			return;
		if (rect._h && rect._w) {
			if (this._debug.fillStyle)
				ctx.fillRect(rect._x, rect._y, rect._w, rect._h);
			if (this._debug.strokeStyle)
				ctx.strokeRect(rect._x, rect._y, rect._w, rect._h);
		}

	}



});


/**@
 * #WiredMBR
 * @category Debug
 * @kind Component
 *
 * Adding this component to an entity will cause its MBR to be drawn to the debug canvas as an outline.
 *
 * The methods of DebugCanvas can be used to control this component's appearance.
 *
 * @see 2D, DebugRectangle, DebugCanvas
 */
Qrafty.c("WiredMBR", {
	init: function () {
		this.requires("DebugRectangle")
			.debugStroke("purple");
	},

	events: {
		"PreRender": function () {
			// Internal method for updating the MBR drawn.
			this.debugRectangle(this._mbr || this);
		}
	}
});


/**@
 * #SolidMBR
 * @category Debug
 * @kind Component
 *
 * Adding this component to an entity will cause its MBR to be drawn to the debug canvas.
 *
 * The methods of DebugCanvas can be used to control this component's appearance.
 *
 * @see 2D, DebugRectangle, DebugCanvas
 */
var solidMBR = {
	init: function () {
		this.requires("DebugRectangle")
			.debugFill("pink");
	},

	events: {
		"PreRender": function () {
			// Internal method for updating the MBR drawn.
			this.debugRectangle(this._mbr || this);
		}
	}
};
Qrafty.c("SolidMBR", solidMBR);
// DEPRECATED: remove this in an upcoming release
Qrafty.c("VisibleMBR", solidMBR);


/**@
 * #DebugPolygon
 * @category Debug
 * @kind Component
 *
 * For drawing a polygon to the debug canvas
 *
 * The methods of DebugCanvas can be used to control this component's appearance -- by default it is neither filled nor outlined
 *
 * @see DebugCanvas
 */
Qrafty.c("DebugPolygon", {
	init: function () {
		this.requires("2D, DebugCanvas");
	},


	/**@
     * #.debugPolygon
     * @comp DebugPolygon
     * @kind Method
     * 
     * @sign public  .debugPolygon(Polygon poly)
     * @param poly - a polygon to render
     *
     * Sets the polygon that this component renders to the debug canvas.
     *
     */
	debugPolygon: function (poly) {
		this.polygon = poly;
		this.unbind("DebugDraw", this.drawDebugPolygon);
		this.bind("DebugDraw", this.drawDebugPolygon);
		return this;
	},

	drawDebugPolygon: function (ctx) {
		if (typeof this.polygon === "undefined")
			return;

		ctx.beginPath();
		var p = this.polygon.points, l = p.length;
		for (var i=0; i<l; i+=2){
			ctx.lineTo(p[i], p[i+1]);
		}
		ctx.closePath();

		if (this._debug.fillStyle)
			ctx.fill();
		if (this._debug.strokeStyle)
			ctx.stroke();
	}
});


/**@
 * #WiredHitBox
 * @category Debug
 * @kind Component
 *
 * Adding this component to an entity with a Collision component will cause its collision polygon to be drawn to the debug canvas as an outline
 *
 * The methods of DebugCanvas can be used to control this component's appearance.
 * @see DebugPolygon, DebugCanvas
 */
Qrafty.c("WiredHitBox", {
	init: function () {
		this.requires("DebugPolygon")
			.debugStroke("red")
			.matchHitBox();
		this.bind("NewHitbox", this.matchHitBox);
	},
	matchHitBox: function () {
		this.debugPolygon(this.map);
	}
});

/**@
 * #SolidHitBox
 * @category Debug
 * @kind Component
 *
 * Adding this component to an entity with a Collision component will cause its collision polygon to be drawn to the debug canvas, with a default alpha level of 0.7.
 *
 * The methods of DebugCanvas can be used to control this component's appearance.
 * @see DebugPolygon, DebugCanvas
 */
Qrafty.c("SolidHitBox", {
	init: function () {
		this.requires("Collision, DebugPolygon")
			.debugFill("orange").debugAlpha(0.7)
			.matchHitBox();
		this.bind("NewHitbox", this.matchHitBox);
	},
	matchHitBox: function () {
		this.debugPolygon(this.map);
	}
});

/**@
 * #WiredAreaMap
 * @category Debug
 * @kind Component
 *
 * Adding this component to an entity with an AreaMap component will cause its click polygon to be drawn to the debug canvas as an outline.
 * Following click areas exist for an entity (in decreasing order of priority): AreaMap, Hitbox, MBR. Use the appropriate debug components to display them.
 *
 * The methods of DebugCanvas can be used to control this component's appearance.
 * @see DebugPolygon, DebugCanvas
 */
Qrafty.c("WiredAreaMap", {
	init: function () {
		this.requires("DebugPolygon")
			.debugStroke("green")
			.matchAreaMap();
		this.bind("NewAreaMap", this.matchAreaMap);
	},
	matchAreaMap: function () {
		this.debugPolygon(this.mapArea);
	}
});

/**@
 * #SolidAreaMap
 * @category Debug
 * @kind Component
 *
 * Adding this component to an entity with an AreaMap component will cause its click polygon to be drawn to the debug canvas, with a default alpha level of 0.7.
 * Following click areas exist for an entity (in decreasing order of priority): AreaMap, Hitbox, MBR. Use the appropriate debug components to display them.
 *
 * The methods of DebugCanvas can be used to control this component's appearance.
 * @see DebugPolygon, DebugCanvas
 */
Qrafty.c("SolidAreaMap", {
	init: function () {
		this.requires("DebugPolygon")
			.debugFill("lime").debugAlpha(0.7)
			.matchAreaMap();
		this.bind("NewAreaMap", this.matchAreaMap);
	},
	matchAreaMap: function () {
		this.debugPolygon(this.mapArea);
	}
});

Qrafty.DebugCanvas = {
	context: null,
	entities: [],
	onetimeEntities: [],
	add: function (ent) {
		this.entities.push(ent);
	},

	remove: function (ent) {
		var list = this.entities;
		for (var i = list.length - 1; i >= 0; i--)
			if (list[i] === ent)
				list.splice(i, 1);

	},

	// Mostly copied from canvas.init()
	// Called the first time a "DebugCanvas" component is added to an entity
	// We should consider how to abstract the idea of multiple canvases
	init: function () {
		if (!Qrafty.DebugCanvas.context) {
			//check if canvas is supported
			if (!Qrafty.support.canvas) {
				Qrafty.trigger("NoCanvas");
				Qrafty.stop();
				return;
			}

			//create an empty canvas element
			var c;
			c = document.createElement("canvas");
			c.width = Qrafty.viewport.width;
			c.height = Qrafty.viewport.height;
			c.style.position = "absolute";
			c.style.left = "0px";
			c.style.top = "0px";
			c.id = "debug-canvas";
			// The debug canvas should be on the very top; the highest a regular zindex can get is ~10000
			c.style.zIndex = 100000;

			Qrafty.stage.elem.appendChild(c);
			Qrafty.DebugCanvas.context = c.getContext("2d");
			Qrafty.DebugCanvas._canvas = c;



		}
		//Bind rendering of canvas context (see drawing.js)
		Qrafty.unbind("RenderScene", Qrafty.DebugCanvas.renderScene);
		Qrafty.bind("RenderScene", Qrafty.DebugCanvas.renderScene);

	},


	// copied from drawAll()
	renderScene: function (rect) {
		rect = rect || Qrafty.viewport.rect();
		var q = Qrafty.DebugCanvas.entities,
			i = 0,
			l = q.length,
			ctx = Qrafty.DebugCanvas.context,
			current;

		var view = Qrafty.viewport;
		ctx.setTransform(view._scale, 0, 0, view._scale, Math.round(view._x*view._scale), Math.round(view._y*view._scale));

		ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

		var lastLayer = null;
		for (; i < l; i++) {
			current = q[i];

			// If necessary, update the view transform to match the current entities layer
			// If the current entity has no layer, switch back to the viewport's transform
			if (lastLayer !== current._drawLayer){
				if (current._drawLayer) {
					view = current._drawLayer._viewportRect();
					ctx.setTransform(view._scale, 0, 0, view._scale, Math.round(-view._x*view._scale), Math.round(-view._y*view._scale));
				} else {
					view = Qrafty.viewport;
					ctx.setTransform(view._scale, 0, 0, view._scale, Math.round(view._x*view._scale), Math.round(view._y*view._scale));
				}
				lastLayer = current._drawLayer;
			}
			current.debugDraw(ctx);
		}

	}

};
