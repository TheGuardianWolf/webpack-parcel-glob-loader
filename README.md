[![npm version](https://badge.fury.io/js/webpack-parcel-glob-loader.svg)](https://badge.fury.io/js/webpack-parcel-glob-loader)

# webpack-parcel-glob-loader

**NOTE:** This package is _NOT_ for Parcel, it is a compatiblity loader for Webpack.

ES6 import with glob patterns in Parcel 1 compatible style.

(Forked from https://github.com/fred104/webpack-import-glob-loader)

Expands globbing patterns for ES6 `import` statements. When importing as module, the resulting
object is available as another object in a hierarchical structure. Please see the [tests](https://github.com/TheGuardianWolf/webpack-parcel-glob-loader/blob/master/test/test.js)
for more examples of how things work.

During migration for a Parcel build project to the Webpack build system, I encountered an issue
with glob patterns not being recognised in Webpack natively. I found several loaders that could
transform the glob import into an array structure, but the code was built with the Parcel glob
import in mind. Thus I created my own loader to import in this style so that I can maintain build
compatiblity.

I find the Parcel style glob imports to be superior due to the resulting module object containing
both file extension and basenames, instead of an array of unidentifiable modules.

This project uses the [pnpm](https://pnpm.js.org/) package manager.

---

```js
import modules from "./foo/**/*.js";
```

Expands into

```js
import * as module0 from "./foo/1.js";
import * as module1 from "./foo/bar/2.js";
import * as module2 from "./foo/bar/3.js";

var modules = [module0, module1, module2];
```

---

For importing from node module

```js
import modules from "a-node-module/**/*.js";
```

Expands into

```js
import * as module0 from "a-node-module/foo/1.js";
import * as module1 from "a-node-module/foo/bar/2.js";
import * as module2 from "a-node-module/foo/bar/3.js";

var modules = { "1": { "js": module0 }, "bar": { "2": { "js": module1 }, "3": { "js": module2 } } } ;
```

---

**For side effects:**

```js
import "./foo/**/*.scss";
```

Expands into

```js
import "./foo/1.scss";
import "./foo/bar/2.scss";
```

---

**For sass:**

```scss
@import "./foo/**/*.scss";
```

Expands into

```scss
@import "./foo/1.scss";
@import "./foo/bar/2.scss";
```

---

## Install

```sh
npm install webpack-parcel-glob-loader --save-dev
```

## Usage

You can use it one of two ways, the recommended way is to use it as a preloader

```js
// ./webpack.config.js

module.exports = {
  ...
  module: {
    rules: [
      {
          test: /\.js$/,
          use: 'webpack-parcel-glob-loader'
      },
      {
          test: /\.scss$/,
          use: 'webpack-parcel-glob-loader'
      },
    ]
  }
};
```

Alternatively you can use it as a chained loader

```js
// foo/bar.js
import "./**/*.js";

// index.js
import "webpack-parcel-glob-loader!foo/bar.js";
```
