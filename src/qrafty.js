// Define common features
//const Qrafty = import "./qrafty-common.js")(;
import Qrafty from "./qrafty-common";

// Define features only available in browser environment

import "./core/loader";
import "./inputs/dom-events";

// Needs to be required before any specific layers are

import "./graphics/layers";
import "./graphics/canvas";
import "./graphics/canvas-layer";
import "./graphics/webgl";
import "./graphics/webgl-layer";

import "./graphics/color";
import "./graphics/dom";
import "./graphics/dom-helper";
import "./graphics/dom-layer";
import "./graphics/drawing";
import "./graphics/gl-textures";
import "./graphics/renderable";
import "./graphics/html";
import "./graphics/image";
import "./graphics/particles";
import "./graphics/sprite-animation";
import "./graphics/sprite";
import "./graphics/text";
import "./graphics/viewport";

import "./isometric/diamond-iso";
import "./isometric/isometric";

// Needs to be required before any specific inputs are
import "./inputs/util";
import "./inputs/device";
import "./inputs/keyboard";
import "./inputs/lifecycle";
import "./inputs/mouse";
import "./inputs/pointer";
import "./inputs/touch";

import "./sound/sound";

import "./debug/debug-layer";

// Define some aliases for renamed properties
import aliases from "./aliases";
aliases.defineAliases(Qrafty);

if (window) {
	window.Qrafty = Qrafty;
	window.Crafty = Qrafty;
}

//module.exports = Qrafty;
export default Qrafty;