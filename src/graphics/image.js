//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";

//
// Define some variables required for webgl
//var fs = require("fs");

const shaders_sprite_vert = `attribute vec2 aPosition;
attribute vec3 aOrientation;
attribute vec2 aLayer;
attribute vec2 aTextureCoord;

varying mediump vec3 vTextureCoord;

uniform vec4 uViewport;
uniform mediump vec2 uTextureDimensions;

mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);
vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);

void main() {
  vec2 pos = aPosition;
  vec2 entityOrigin = aOrientation.xy;
  mat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));
  
  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;
  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0/(1.0+exp(aLayer.x) ), 1) );
  vTextureCoord = vec3(aTextureCoord, aLayer.y);
}`;

const shaders_sprite_frag = `varying mediump vec3 vTextureCoord;
  
uniform sampler2D uSampler;
uniform mediump vec2 uTextureDimensions;

void main(void) {
  highp vec2 coord =   vTextureCoord.xy / uTextureDimensions;
  mediump vec4 base_color = texture2D(uSampler, coord);
  gl_FragColor = vec4(base_color.rgb*base_color.a*vTextureCoord.z, base_color.a*vTextureCoord.z);
}`;

Qrafty.defaultShader("Image", new Qrafty.WebGLShader(
	shaders_sprite_vert,
	shaders_sprite_frag,
	[
		{ name: "aPosition",     width: 2 },
		{ name: "aOrientation",  width: 3 },
		{ name: "aLayer",        width: 2 },
		{ name: "aTextureCoord", width: 2 }
	],
	function(e, _entity) {
		var pos = e.pos;
		// Write texture coordinates
		e.program.writeVector("aTextureCoord",
			0, 0,
			0, pos._h,
			pos._w, 0,
			pos._w, pos._h
		);
	}
));

/**@
 * #Image
 * @category Graphics
 * @kind Component
 * 
 * Draw an image with or without repeating (tiling).
 *
 * If the entity's width and height are smaller than the width and height of the image source, the image will appear cropped.
 * If the entity's dimensions are larger than the dimensions of the image source, the exact appearance of the remaining space will depend on what renderer (WebGL, DOM, or Canvas) is used.
 * However, if tiling is enabled, the remaining space will be filled by a repeating pattern of the image.
 *
 * @note Image scaling is not supported by this component. Use a spritesheet, defined by `Qrafty.sprite`, consisting of a single `Sprite` instead.
 *
 * @see Sprite, Qrafty.sprite
 */
Qrafty.c("Image", {
	_repeat: "repeat",
	ready: false,

	init: function () {
		this.bind("Draw", this._drawImage);
		this.bind("LayerAttached", this._setupImage);
	},

	remove: function() {
		this.unbind("LayerAttached", this._setupImage);
		this.unbind("Draw", this._drawImage);
	},

	/**@
     * #.image
     * @comp Image
     * @kind Method
     * 
     * @trigger Invalidate - when the image is loaded
     * @sign public this .image(String url[, String repeat])
     * @param url - URL of the image
     * @param repeat - If the image should be repeated to fill the entity.  This follows CSS syntax: (`"no-repeat", "repeat", "repeat-x", "repeat-y"`), but defaults to `no-repeat`.
     *
     * Draw the specified image.
     *
     * @note The default value of repeat is `no-repeat`, which is different than the standard CSS default
     *
     * If the width and height are `0` and repeat is set to `no-repeat` the width and
     * height will automatically assume that of the image. This is an
     * easy way to create an image without needing sprites.
     *
     * If set to `no-repeat` and given dimensions larger than that of the image,
     * the exact appearance will depend on what renderer (WebGL, DOM, or Canvas) is used.
     *
     * @example
     * Will default to no-repeat. Entity width and height will be set to the images width and height
     * ~~~
     * var ent = Qrafty.e("2D, DOM, Image").image("myimage.png");
     * ~~~
     * Create a repeating background.
     * ~~~
     * var bg = Qrafty.e("2D, DOM, Image")
     *              .attr({w: Qrafty.viewport.width, h: Qrafty.viewport.height})
     *              .image("bg.png", "repeat");
     * ~~~
     *
     * @see Qrafty.sprite
     */
	image: function (url, repeat) {
		this.__image = url;
		this._repeat = repeat || "no-repeat";

		this.img = Qrafty.asset(url);
		if (!this.img) {
			this.img = new Image();
			Qrafty.asset(url, this.img);
			this.img.src = url;
			var self = this;

			this.img.onload = function () {
				self._setupImage(self._drawLayer);
			};
		} else {
			this._setupImage(this._drawLayer);
		}

		this.trigger("Invalidate");

		return this;
	},

	// called on image change or layer attachment
	_setupImage: function(layer){
		if (!this.img || !layer) return;

		if (layer.type === "Canvas") {
			this._pattern = this._drawContext.createPattern(this.img, this._repeat);
		} else if (layer.type === "WebGL") {
			this._establishShader("image:" + this.__image, Qrafty.defaultShader("Image"));
			this.program.setTexture( this._drawLayer.makeTexture(this.__image, this.img, (this._repeat!=="no-repeat")));
		}

		if (this._repeat === "no-repeat") {
			this.w = this.w || this.img.width;
			this.h = this.h || this.img.height;
		}

		this.ready = true;
		this.trigger("Invalidate");
	},

	_drawImage: function(e){
		if (e.type === "canvas") {
			//skip if no image
			if (!this.ready || !this._pattern) return;

			var context = e.ctx;

			context.fillStyle = this._pattern;

			context.save();
			context.translate(e.pos._x, e.pos._y);
			context.fillRect(0, 0, e.pos._w, e.pos._h);
			context.restore();
		} else if (e.type === "DOM") {
			if (this.__image) {
				e.style.backgroundImage = "url(" + this.__image + ")";
				e.style.backgroundRepeat = this._repeat;
			}
		} else if (e.type === "webgl") {
			e.program.draw(e, this);
		}

	}
});