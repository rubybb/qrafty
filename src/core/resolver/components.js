import Qrafty from "../core";

export default function (args = [], actual = false) {
	
	let components = [...args];
	if (args.length === 1 && args[0].indexOf(",") !== -1) {
		components = args[0].split(/\s*,\s*/);
	}
	
	if (actual) return components.map(name => Qrafty.c(name));
	return components;
}
