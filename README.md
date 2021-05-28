# install-all-peer-dependencies

A command-line interface to install all peer dependencies automatically.

In NPM versions 3 to 6, peer dependencies are not automatically installed, this package can be used to automatically install peer dependencies.

## How to use

Install the package as a development dependency:
```
npm install --save-dev install-all-peer-dependencies
```

Add a `postinstall` npm run-script to `package.json` which runs the package:
```json
"scripts": {
  "postinstall": "install-all-peer-dependencies"
}
```

Now after every `npm install`, the install-all-peer-dependencies will run and install all the peer dependencies.
