"use strict";

const execa = require("execa");
const debug = function (...args) {
    console.debug('install-all-peer-dependencies:', ...args);
}
function isJSON(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (error) {
		return false;
	}
}

async function getPeerDependenciesRecursive(packages = [], results) {
	for (const [name, version] of packages) {
		let {stdout: peerDependencies} = await execa("npm", ["info", `${name}@${version}`, "peerDependencies", "--json"]);
		if (isJSON(peerDependencies)) {
			peerDependencies = JSON.parse(peerDependencies);
			if (Array.isArray(peerDependencies)) {
				peerDependencies = peerDependencies[0];
			}
		}
		let {stdout: resolvedVersion} = await execa("npm", ["info", `${name}@${version}`, "version", "--json"]);
		if (isJSON(resolvedVersion)) {
			resolvedVersion = JSON.parse(resolvedVersion);
			if (Array.isArray(resolvedVersion)) {
				resolvedVersion = resolvedVersion[0];
			}
		}
		const id = `${name}@${resolvedVersion}`;
		if (!results.has(id)) {
			results.add(id);
			if (peerDependencies) {
				await getPeerDependenciesRecursive(Object.entries(peerDependencies), results);
			}
		}
	}
	return Array.from(results);
}

async function getPeerDependencies(packages = []) {
	const results = new Set;
    return await getPeerDependenciesRecursive(packages, results);
}

async function getMissingRootPeerDependencies() {
	let missingPeerDependencies = new Set;
	try {
		await execa("npm", ["ls", "--parseable"]);
	} catch (error) {
		for (const line of error.stderr.split("\n")) {
			if (line.startsWith('npm ERR! peer dep missing:')) {
				const missingDep = line.replace(/^npm ERR! peer dep missing: (.*),.*/, "$1");
				missingPeerDependencies.add(missingDep);
			}
		}
	}
    missingPeerDependencies = Array.from(missingPeerDependencies);
    if (global.verbose) {
        if (missingPeerDependencies.length) {
            debug('Found root missing peer-dependencies:', missingPeerDependencies)
        } else {
            debug('Found no missing peer-dependencies.')
        }
    }
	return Array.from(missingPeerDependencies);
}

function splitNameAndVersion(p) {
	let index = p.lastIndexOf('@');
	return [p.slice(0, index), p.slice(index+1)]
}

module.exports = async function findAllPeerDependencies() {
    let mpds = await getMissingRootPeerDependencies();
    mpds = mpds.map(splitNameAndVersion)
    const pds = await getPeerDependencies(mpds);
    return pds;
}
