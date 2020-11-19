const path = require("path");
//const webpack = require("webpack");
const dist = path.resolve(__dirname, "dist");
const fs = require("fs");

const name = "qrafty";

const generate = () => {
	const dev = process.env.NODE_ENV !== "production";
	const when = new Date();

	let previous = JSON.parse(fs.readFileSync(path.resolve(dist, "build.json"), "utf8"));

	let type = dev ? "dev" : "release";
	let version = dev ? previous.version : previous.version + 1;
	let filename = dev ? `${name}@${type}.js` : `${name}@${type}:${version}.js`;
	let total = previous.total + 1;

	return {dev, type, filename, when, version, total};
};

const build = generate();
fs.writeFileSync(path.resolve(dist, "build.json"), JSON.stringify(build, null, 2));

Object.assign(process.env, {
	BUILD_VERSION: build.version,
	BUILD_FILENAME: build.filename,
	DEVELOPMENT: build.dev
});

module.exports = {
	entry: `./src/${name}.js`,
	mode: build.dev ? "development" : "production",
	output: {
		filename: build.filename,
		path: dist,
	},

	plugins: [
		new class {
			apply(compiler) {
				compiler.hooks.done.tapAsync(name,
					(compilation, callback) => {
						let output = fs.readFileSync(path.resolve(dist, build.filename), "utf8");
						let license = fs.readFileSync(path.resolve(__dirname, "LICENSE"), "utf8");
						fs.writeFileSync(path.resolve(dist, `${name}@latest.js`), `/*\n${license}*/\n\n${output}`);

						console.log(`\nwrote to ${build.filename}...`);
						console.log(`and wrote to ${name}@latest.js...\n`);

						callback();
					}
				);
			}
		}
	],

	module: {
		rules: [
			{
				test: /\.js$/,
				loader: "string-replace-loader",
				options: {
					search: /\/\* @env (\w*?) \*\//ig,
					replace: (match, key) => {
						return process.env[key];
					}
				}
			}
		]
	}
};