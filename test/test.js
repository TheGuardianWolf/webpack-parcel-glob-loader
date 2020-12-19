var chai = require("chai"),
  sinon = require("sinon"),
  path = require("path");

var loader = require("../");

var expect = chai.expect,
  assert = chai.assert;

var context = {};

describe("loader", function () {
  this.beforeEach(function () {
    context = {
      resourcePath: path.resolve(__dirname, "mock", "test.js"),
      emitWarning: sinon.stub(),
      emitError: sinon.stub(),
    };
  });

  describe("from files", function () {
    describe('import "*.js"', function () {
      it("should expand glob import files", function () {
        // double quote
        var generatedCode = loader.call(context, 'import "./modules/*.js";');
        expect(generatedCode).to.equal('import "./modules/a.js"; import "./modules/b.js"; import "./modules/c.js";');

        generatedCode = loader.call(context, 'import "./modules/*.js"; import "z.js";');
        expect(generatedCode).to.equal(
          'import "./modules/a.js"; import "./modules/b.js"; import "./modules/c.js"; import "z.js";'
        );

        // single quote
        var generatedCode = loader.call(context, "import './modules/*.js';");
        expect(generatedCode).to.equal("import './modules/a.js'; import './modules/b.js'; import './modules/c.js';");
      });

      it("should honor comment after expanding glob import files", function () {
        var generatedCode = loader.call(context, '//import "./modules/*.js";');
        expect(generatedCode).to.equal('//import "./modules/a.js"; import "./modules/b.js"; import "./modules/c.js";');

        generatedCode = loader.call(context, '// import "./modules/*.js";');
        expect(generatedCode).to.equal('// import "./modules/a.js"; import "./modules/b.js"; import "./modules/c.js";');
      });

      it("should emit warning when import nothing", function () {
        var generatedCode = loader.call(context, 'import "./unknown/*.js";');
        assert.equal(context.emitWarning.called, true);
      });
    });

    describe('import modules from "*.js"', function () {
      it("should expand glob import files", function () {
        var generatedCode = loader.call(context, 'import modules from "./modules/*.js";');

        expect(generatedCode).to.equal(
          'import * as _modules0 from "./modules/a.js"; import * as _modules1 from "./modules/b.js"; import * as _modules2 from "./modules/c.js"; ' +
            'var modules = { "a": { "js": _modules0 }, "b": { "js": _modules1 }, "c": { "js": _modules2 } } ;'
        );
      });

      it("should recursively expand glob import files", function () {
        var generatedCode = loader.call(context, 'import modules from "./modules/**/*.js";');
        expect(generatedCode).to.equal(
          'import * as _modules0 from "./modules/a.js"; import * as _modules1 from "./modules/b.js"; import * as _modules2 from "./modules/c.js"; import * as _modules3 from "./modules/recursive/r.js"; ' +
            'var modules = { "a": { "js": _modules0 }, "b": { "js": _modules1 }, "c": { "js": _modules2 }, "recursive": { "r": { "js": _modules3 } } } ;'
        );
      });

      it("should expand glob import and group files with same base name", function () {
        var generatedCode = loader.call(context, 'import modules from "./modules/recursive/**/*.*";');
        expect(generatedCode).to.equal(
          'import * as _modules0 from "./modules/recursive/r.css"; import * as _modules1 from "./modules/recursive/r.js"; ' +
            'var modules = { "r": { "css": _modules0, "js": _modules1 } } ;'
        );
      });
    });

    describe("import from *.scss", function () {
      it("should import glob scss files", function () {
        var generatedCode = loader.call(context, '@import "./modules/*.scss";');
        expect(generatedCode).to.equal('@import "./modules/e.scss"; @import "./modules/f.scss";');
      });

      it("should honor comment after expanding glob import files", function () {
        var generatedCode = loader.call(context, '//@import "./modules/*.scss";');
        expect(generatedCode).to.equal('//@import "./modules/e.scss"; @import "./modules/f.scss";');

        generatedCode = loader.call(context, '// @import "./modules/*.scss";');
        expect(generatedCode).to.equal('// @import "./modules/e.scss"; @import "./modules/f.scss";');
      });
    });
  });

  describe("from node_modules", function () {
    it("should load node_modules files", function () {
      var generatedCode = loader.call(context, 'import "fake_module/js/*.js";');
      expect(generatedCode).to.equal(
        'import "fake_module/js/a.js"; import "fake_module/js/b.js"; import "fake_module/js/c.js";'
      );
    });

    it("should honor comment after expanding glob import files", function () {
      var generatedCode = loader.call(context, '// import "fake_module/js/*.js";');
      expect(generatedCode).to.equal(
        '// import "fake_module/js/a.js"; import "fake_module/js/b.js"; import "fake_module/js/c.js";'
      );
    });

    it("should emit error when node_modules is not found", function () {
      context.resourcePath = path.resolve("/tmp", "test.js");
      var generatedCode = loader.call(context, 'import "unknown/*.js";');
      assert.equal(context.emitError.called, true);
    });
  });
});
