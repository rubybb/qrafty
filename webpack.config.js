const path = require("path");
const core = require("@actions/core");
const dist = path.resolve(__dirname, "dist");
const fs = require("fs");

const name = "qrafty";

const generate = () => {
	const dev = process.env.GITHUB_ACTIONS ? !process.env.GITHUB_REF.includes("release") : true;
	const type = dev ? "dev" : "release";

	const version = process.env.GITHUB_SHA?.slice(0, 10) || 0;
	const on = process.env["npm_config_user_agent"];
	const when = new Date();

	const filename = `${name}@${version}-${type}.js`;

	return {dev, type, filename, when, on, version};
};

const build = generate();
Object.keys(build).map(key => core.setOutput(key, build[key]));
console.log(JSON.stringify(build, null, 2));

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