#!/usr/bin/env node
"use strict";

// Based off of https://github.com/Financial-Times/next-ci-shared-helpers/blob/9d39efd23cf591924b5c7323605eef1df510b797/helper-npm-install-peer-deps//L1

// Workaround for npm 6 where it does not
// automatically install peer dependencies.
//
// Parses `npm ls` for missing peer dependencies
// and then pipes the package name and version to `npm install`.


const execa = require("execa");
const fs = require("fs");
const process = require("process");
const path = require("path");
const findAllPeerDependencies = require('./find-all-peer-dependencies');

const packageJsonLocation = path.join(process.cwd(), "package.json");
const lockfile = path.join(process.cwd(), ".install-peer-deps-lock");

function splitNameAndVersion(p) {
	let index = p.lastIndexOf('@');
	return [p.slice(0, index), p.slice(index+1)]
}
async function main() {
	// The .install-peer-deps-lock file is used as a way to
	// stop the command from being recursively run by an
	// npm postinstall run-script.
	if (fs.existsSync(packageJsonLocation) && !fs.existsSync(lockfile)) {
		fs.writeFileSync(lockfile, "");
		const pds = await findAllPeerDependencies();
		console.log('Installing peer-dependencies:', pds);
        // TODO: Figure out how to detect real conflicts and log out the culprit
		// const meow = new Map;
		// for (const dep of pds) {
		// 	const [name, version] = splitNameAndVersion(dep);
		// 	if (meow.has(name) && meow.get(name) != version) {
        //         fs.unlinkSync(lockfile);
        //         console.error(`WE GOT OURSELVES A CONFLICT: ${name}@${version} and ${name}@${meow.get(name)}`);
        //         process.exit(1);
		// 	} else {
		// 		meow.set(name, version);
		// 	}
		// }
        if (pds.length > 0) {
            const childProcess = execa('npm', ['install', '--no-save', ...pds]);
            childProcess.stdout.pipe(process.stdout);
            childProcess.stderr.pipe(process.stderr);
            await childProcess;
        }
	}
}

let exit = 0;
main().catch((error) => {
	console.error(error);
	exit = 1;
}).finally(() => {
	fs.unlinkSync(lockfile);
	process.exit(exit);
});
