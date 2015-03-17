/*
 * validate.js
 *
 * Standalone validation script that runs after package is installed to verify the 
 * required NPM global packages are installed
 */

var child_process = require("child_process");

var IS_WINDOWS = (process.platform.indexOf("win")===0),
	NPM_GLOBALS = ["yo", "bower", "cordova"];

function npm(action, npm_args, stdio, callback) {
	var cmd = "npm";
	var child_args = [action, "-g"];
	if(npm_args) {
		child_args = child_args.concat(npm_args);
	}
	if(IS_WINDOWS) {
		child_args.unshift("/c", cmd);
		cmd = "cmd";
	}
	var child = child_process.spawn(cmd, child_args, {cwd:process.cwd(), stdio:stdio});
	var stdout = "";
	child.stdout && child.stdout.on("data", function (data) {
		stdout += data;
	});
	child.on("exit", function(code) {
		var err;
		if(code!==0) {
			err = {code:code};
		}
		callback(err, stdout);
	});
	child.on("error", callback);
	return child;
}

function list(callback) {
	var list_flags = ["-json", "-depth=0"],
		list_stdio = ["ignore", "pipe", "ignore"];
	npm("list", list_flags.concat(NPM_GLOBALS), list_stdio, function(err, data) {
		if(err) {
			callback(err, {});
		} else {
			try {
				var items = JSON.parse(data).dependencies || {};
				callback(undefined, items);
			} catch(e) {
				callback(e, {});
			}
		}
	});
}

module.exports = function Validate() {
	list(function(err, items) {
		if(err) {
			console.warn("Warning: Unable to check existing NPM globals. Make sure the "
					+ "following NPM packages are globally installed for full functionality: "
					+ NPM_GLOBALS.join(" "));
		}
		for(var i=0; i<NPM_GLOBALS.length; i++) {
			if(!items[NPM_GLOBALS[i]]) {
				console.warn("Warning: " + NPM_GLOBALS[i] + " is missing. Please install with "
						+ "'npm install -g " + NPM_GLOBALS[i] + "'.");
			}
		}
	});
};

if(require.main === module) {
	module.exports();
}
