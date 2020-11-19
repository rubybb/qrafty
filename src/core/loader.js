//var Qrafty = require("../core/core.js");
import Qrafty from "../core/core";

Qrafty.extend({
	/**@
     * #Qrafty.assets
     * @category Assets
     * @kind Property
     * 
     * An object containing every asset used in the current Qrafty game.
     * The key is the URL and the value is the `Audio` or `Image` object.
     *
     * If loading an asset, check that it is in this object first to avoid loading twice.
     *
     * @example
     * ~~~
     * var isLoaded = !!Qrafty.assets["images/sprite.png"];
     * ~~~
     * @see Qrafty.load
     */
	assets: {},
	__paths: { audio: "", images: "" },
	/**@
     * #Qrafty.paths
     * @category Assets
     * @kind Method
     * 
     * @sign public void Qrafty.paths([Object paths])
     * @param paths - Object containing paths for audio and images folders
     *
     * Function to define custom folder for audio and images. You should use
     * this function to avoid typing the same paths again and again when
     * loading assets with the Qrafty.load() function.
     *
     * If you do not give a object you get the current paths for both audio
     * and images back.
     *
     * You do not have to define paths.
     *
     * @example
     *
     *
     * Setting folders:
     * ~~~
     * Qrafty.paths({ audio: "custom/audio/path/", images: "custom/images/path/" });
     *
     * Qrafty.load({
     *   "audio": {
     *     "ray": ['ray.mp3'] // This loads ray.mp3 from custom/audio/path/ray.mp3
     *   }
     * }, function() {
     *   Qrafty.log('loaded');
     * });
     * ~~~
     *
     * @see Qrafty.load
     */
	paths: function(p) {
		if (typeof p === "undefined") {
			return this.__paths;
		} else {
			if(p.audio)
				this.__paths.audio = p.audio;
			if(p.images)
				this.__paths.images = p.images;
		}
	},

	/**@
     * #Qrafty.asset
     * @category Assets
     * @kind Method
     * 
     * @trigger NewAsset - After setting new asset - Object - key and value of new added asset.
     * @sign public void Qrafty.asset(String key, Object asset)
     * @param key - asset url.
     * @param asset - `Audio` or `Image` object.
     *
     * Add new asset to assets object.
     *
     * @sign public void Qrafty.asset(String key)
     * @param key - asset url.
     *
     *
     * Get asset from assets object.
     *
     * @example
     * ~~~
     * Qrafty.asset(key, value);
     * var asset = Qrafty.asset(key); //object with key and value fields
     * ~~~
     *
     * @see Qrafty.assets
     */
	asset: function (key, value) {
		if (arguments.length === 1) {
			return Qrafty.assets[key];
		}

		if (!Qrafty.assets[key]) {
			Qrafty.assets[key] = value;
			this.trigger("NewAsset", {
				key: key,
				value: value
			});
			return value;
		}
	},
	/**@
     * #Qrafty.imageWhitelist
     * @category Assets
     * @kind Method
     *
     * A list of file extensions that can be loaded as images by Qrafty.load
     *
     * @example
     * ~~~
     * // add tif extension to list of supported image files
     * Qrafty.imageWhitelist.push("tif");
     *
     * var assets = {
     *     "sprites": {
     *         "sprite.tif": {   //set a tif sprite
     *            "tile": 64,
     *            "tileh": 32,
     *            "map": { "sprite_car": [0, 0] }
     *         }
     *     },
     *     "audio": {
     *         "jump": "jump.mp3";
     *     }
     * };
     *
     * Qrafty.load( assets, // preload the assets
     *     function() {     //when loaded
     *         Qrafty.audio.play("jump"); //Play the audio file
     *         Qrafty.e('2D, DOM, sprite_car'); // create entity with sprite
     *     },
     *
     *     function(e) { //progress
     *     },
     *
     *     function(e) { //uh oh, error loading
     *     }
     * );
     * ~~~
     *
     * @see Qrafty.asset
     * @see Qrafty.load
     */
	imageWhitelist: ["jpg", "jpeg", "gif", "png", "svg"],
	/**@
     * #Qrafty.load
     * @category Assets
     * @kind Method
     * 
     * @sign public void Qrafty.load(Object assets, Function onLoad[, Function onProgress[, Function onError]])
     * @param assets - Object JSON formatted (or JSON string), with assets to load (accepts sounds, images and sprites)
     * @param onLoad - Callback when the assets are loaded
     * @param onProgress - Callback when an asset is loaded. Contains information about assets loaded
     * @param onError - Callback when an asset fails to load
     *
     * Preloader for all assets. Takes a JSON formatted object (or JSON string) of files and adds them to the
     * `Qrafty.assets` object, as well as setting sprites accordingly.
     *
     * Format must follow the pattern shown in the example below, but it's not required to pass all "audio",
     * "images" and "sprites" properties, only those you'll need. For example, if you don't need to preload
     * sprites, you can omit that property.
     *
     * By default, Qrafty will assume all files are in the current path.  For changing these,
     * use the function `Qrafty.paths`.
     *
     * Files with suffixes in `imageWhitelist` (case insensitive) will be loaded.
     *
     * It's possible to pass the full file path(including protocol), instead of just the filename.ext, in case
     * you want some asset to be loaded from another domain.
     *
     * If `Qrafty.support.audio` is `true`, files with the following suffixes `mp3`, `wav`, `ogg` and
     * `mp4` (case insensitive) can be loaded.
     *
     * The `onProgress` function will be passed on object with information about
     * the progress including how many assets loaded, total of all the assets to
     * load and a percentage of the progress.
     * ~~~
     * { loaded: j, total: total, percent: (j / total * 100), src:src }
     * ~~~
     *
     * `onError` will be passed with the asset that couldn't load.
     *
     * When `onError` is not provided, the onLoad is loaded even when some assets are not successfully loaded.
     * Otherwise, onLoad will be called no matter whether there are errors or not.
     *
     * @example
     * ~~~
     * var assetsObj = {
     *     "audio": {
     *         "beep": ["beep.wav", "beep.mp3", "beep.ogg"],
     *         "boop": "boop.wav",
     *         "slash": "slash.wav"
     *     },
     *     "images": ["badguy.bmp", "goodguy.png"],
     *     "sprites": {
     *         "animals.png": {
     *             "tile": 50,
     *             "tileh": 40,
     *             "map": { "ladybug": [0,0], "lazycat": [0,1], "ferociousdog": [0,2] }
     *             "paddingX": 5,
     *             "paddingY": 5,
     *             "paddingAroundBorder": 10
     *         },
     *         "vehicles.png": {
     *             "tile": 150,
     *             "tileh": 75,
     *             "map": { "car": [0,0], "truck": [0,1] }
     *         }
     *     },
     * };
     *
     * Qrafty.load(assetsObj, // preload assets
     *     function() { //when loaded
     *         Qrafty.scene("main"); //go to main scene
     *         Qrafty.audio.play("boop"); //Play the audio file
     *         Qrafty.e('2D, DOM, lazycat'); // create entity with sprite
     *     },
     *
     *     function(e) { //progress
     *     },
     *
     *     function(e) { //uh oh, error loading
     *     }
     * );
     * ~~~
     *
     * @see Qrafty.paths
     * @see Qrafty.assets
     * @see Qrafty.imageWhitelist
     * @see Qrafty.removeAssets
     */
	load: function (data, oncomplete, onprogress, onerror) {

		if (Array.isArray(data)) {
			Qrafty.log("Calling Qrafty.load with an array of assets no longer works; see the docs for more details.");
			return;
		}

		data = (typeof data === "string" ? JSON.parse(data) : data);

		var j = 0,
			total = (data.audio ? Object.keys(data.audio).length : 0) +
                (data.images ? Object.keys(data.images).length : 0) +
                (data.sprites ? Object.keys(data.sprites).length : 0),
			current, fileUrl, obj, type, asset,
			paths = Qrafty.paths(),
			getExt = function(f) {
				return f.substr(f.lastIndexOf(".") + 1).toLowerCase();
			},
			getFilePath = function(type,f) {
				return (f.search("://") === -1 ? (type === "audio" ? paths.audio + f : paths.images + f) : f);
			},
			// returns null if 'a' is not already a loaded asset, obj otherwise
			isAsset = function(a) {
				return Qrafty.asset(a) || null;
			},
			isSupportedAudio = function(f) {
				return Qrafty.support.audio && Qrafty.audio.supports(getExt(f));
			},
			isValidImage = function(f) {
				return Qrafty.imageWhitelist.indexOf(getExt(f)) !== -1;
			},
			onImgLoad = function(obj,url) {
				obj.onload = pro;
				if (Qrafty.support.prefix === "webkit")
					obj.src = ""; // workaround for webkit bug
				obj.src = url;
			};

		//Progress function

		function pro() {
			var src = this.src;

			//Remove events cause audio trigger this event more than once(depends on browser)
			if (this.removeEventListener)
				this.removeEventListener("canplaythrough", pro, false);

			j++;
			//if progress callback, give information of assets loaded, total and percent
			if (onprogress)
				onprogress({
					loaded: j,
					total: total,
					percent: (j / total * 100),
					src: src
				});

			if (j === total && oncomplete) oncomplete();
		}
		//Error function

		function err() {
			var src = this.src;
			if (onerror)
				onerror({
					loaded: j,
					total: total,
					percent: (j / total * 100),
					src: src
				});

			j++;
			if (j === total && oncomplete) oncomplete();
		}

		for (type in data) {
			for(asset in data[type]) {
				if (!data[type].hasOwnProperty(asset))
					continue; // maintain compatibility to other frameworks while iterating array

				current = data[type][asset];
				obj = null;

				if (type === "audio") {
					if (typeof current === "object") {
						var files = [];
						for (var i in current) {
							fileUrl = getFilePath(type, current[i]);
							if (!isAsset(fileUrl) && isSupportedAudio(current[i]) && !Qrafty.audio.sounds[asset])
								files.push(fileUrl);
						}
						if (files.length > 0)
							obj = Qrafty.audio.add(asset, files);
					} else if (typeof current === "string") {
						fileUrl = getFilePath(type, current);
						if (!isAsset(fileUrl) && isSupportedAudio(current) && !Qrafty.audio.sounds[asset])
							obj = Qrafty.audio.add(asset, fileUrl);
					}
					//extract actual audio obj if audio creation was successfull
					if (obj)
						obj = obj.obj;

					//addEventListener is supported on IE9 , Audio as well
					if (obj && obj.addEventListener)
						obj.addEventListener("canplaythrough", pro, false);
				} else {
					asset = (type === "sprites" ? asset : current);
					fileUrl = getFilePath(type, asset);
					if (!isAsset(fileUrl) && isValidImage(asset)) {
						obj = new Image();
						if (type === "sprites")
							Qrafty.sprite(current.tile, current.tileh, fileUrl, current.map,
								current.paddingX, current.paddingY, current.paddingAroundBorder);
						Qrafty.asset(fileUrl, obj);
						onImgLoad(obj, fileUrl);
					}
				}

				if (obj) {
					obj.onerror = err;
				} else {
					err.call({src: fileUrl});
				}
			}
		}

		// If we aren't trying to handle *any* of the files, that's as complete as it gets!
		if (total === 0 && oncomplete) oncomplete();

	},
	/**@
     * #Qrafty.removeAssets
     * @category Assets
     * @kind Method
     *
     * @sign public void Qrafty.removeAssets(Object assets)
     * @param data - Object JSON formatted (or JSON string), with assets to remove (accepts sounds, images and sprites)
     *
     * Removes assets (audio, images, sprites - and related sprite components) in order to allow the browser
     * to free memory.
     *
     * Recieves a JSON fomatted object (or JSON string) containing 'audio', 'images' and/or 'sprites'
     * properties with assets to be deleted. Follows a similar format as Qrafty.load 'data' argument. If
     * you pass the exact same object passed to Qrafty.load, that will delete everything loaded that way.
     * For sprites, if you want to keep some specific component, just don't pass that component's name in
     * the sprite 'map'.
     *
     * Note that in order to remove the sprite components related to a given sprite, it's required to
     * pass the 'map' property of that sprite, and although its own properties's values (the properties refer
     * to sprite components) are not used in the removing process, omitting them will cause an error (since
     * 'map' is an object, thus it's properties can NOT omitted - however, they can be null, or undefined).
     * It will work as long as the 'map' objects' properties have any value. Or if you define 'map' itself
     * as an array, like:
     * "map": [ "car", "truck" ] instead of "map": { "car": [0,0], "truck": [0,1] }.
     * This is examplified below ("animals.png" VS. "vehicles.png" sprites).
     *
     * @example
     * ~~~
     * var assetsToRemoveObj = {
     *     "audio": {
     *         "beep": ["beep.wav", "beep.mp3", "beep.ogg"],
     *         "boop": "boop.wav"
     *     },
     *     "images": ["badguy.bmp", "goodguy.png"],
     *     "sprites": {
     *         "animals.png": {
     *             "map": { "ladybug": [0,0], "lazycat": [0,1] },
     *         },
     *         "vehicles.png": {
     *             "map": [ "car", "truck" ]
     *         }
     *     }
     * }
     *
     * Qrafty.removeAssets(assetsToRemoveObj);
     * ~~~
     *
     * @see Qrafty.load
     */
	removeAssets: function(data) {

		data = (typeof data === "string" ? JSON.parse(data) : data);

		var current, fileUrl, type, asset,
			paths = Qrafty.paths(),
			getFilePath = function(type,f) {
				return (f.search("://") === -1 ? (type === "audio" ? paths.audio + f : paths.images + f) : f);
			};

		for (type in data) {
			for (asset in data[type]) {
				if (!data[type].hasOwnProperty(asset))
					continue; // maintain compatibility to other frameworks while iterating array

				current = data[type][asset];

				if (type === "audio") {
					if (typeof current === "object") {
						for (var i in current) {
							fileUrl = getFilePath(type, current[i]);
							if (Qrafty.asset(fileUrl))
								Qrafty.audio.remove(asset);
						}
					}
					else if (typeof current === "string") {
						fileUrl = getFilePath(type, current);
						if (Qrafty.asset(fileUrl))
							Qrafty.audio.remove(asset);
					}
				} else {
					asset = (type === "sprites" ? asset : current);
					fileUrl = getFilePath(type, asset);
					if (Qrafty.asset(fileUrl)) {
						if (type === "sprites")
							for (var comp in current.map)
								delete Qrafty.components()[comp];
						delete Qrafty.assets[fileUrl];
					}
				}
			}
		}
	}
});