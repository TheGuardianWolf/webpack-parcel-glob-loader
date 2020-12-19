var glob = require("glob");
var path = require("path");
var fs = require("fs");

function get(obj, objPath, defaults) {
  try {
    var val = objPath.reduce(function (obj, path) {
      if (obj[path] != null) {
        return obj[path];
      } else {
        throw "Empty";
      }
    }, obj);
    return val;
  } catch (e) {
    if (e === "Empty") {
      return defaults;
    }
    throw e;
  }
}

function set(obj, objPath, value) {
  objPath.reduce(function (obj, path, index) {
    if (index === objPath.length - 1) {
      obj[path] = value;
    } else if (obj[path] == null) {
      obj[path] = {};
    }

    return obj[path];
  }, obj);
}

function walkUpToFindNodeModulesPath(context) {
  var tempPath = path.resolve(context, "node_modules");
  var upDirPath = path.resolve(context, "../");

  if (fs.existsSync(tempPath) && fs.lstatSync(tempPath).isDirectory()) {
    return tempPath;
  } else if (upDirPath === context) {
    return undefined;
  } else {
    return walkUpToFindNodeModulesPath(upDirPath);
  }
}

function isNodeModule(str) {
  return !str.match(/^\./);
}

function moduleOrDefault(moduleName) {
  return moduleName + ".default != null ? " + moduleName + ".default : " + moduleName;
}

function buildModuleTree(modules) {
  var dirs = modules.map(function (m) {
    return m.path.dir.split(path.sep);
  });
  var minDirLevel = Math.min.apply(
    null,
    dirs.map(function (d) {
      return d.length;
    })
  );

  return modules.reduce(function (tree, m, i) {
    var basename = m.path.name;
    var ext = m.path.ext;

    if (basename && basename.length > 0 && ext && ext.length > 0) {
      var dir = dirs[i].slice(minDirLevel);
      dir.push(basename);

      var treeLevel = get(tree, dir);

      if (treeLevel == null) {
        set(tree, dir, { [ext.substr(1)]: m.importName });
      } else {
        treeLevel[ext.substr(1)] = m.importName;
      }
    }

    return tree;
  }, {});
}

function buildModuleAssignment(moduleTree, quote, hasNext) {
  var assignment = "";

  if (typeof moduleTree === "object") {
    assignment += "{ ";
    Object.entries(moduleTree).forEach(function (entry, index, list) {
      var key = entry[0];
      var value = entry[1];

      assignment += quote + key + quote + ": " + buildModuleAssignment(value, quote, index < list.length - 1);
    });

    assignment += hasNext ? "}, " : "} ";

    return assignment;
  } else if (typeof moduleTree === "string") {
    assignment += moduleTree;
    assignment += hasNext ? ", " : " ";
  }

  return assignment;
}

module.exports = function (source) {
  this.cacheable && this.cacheable(true);

  var self = this;
  var regex = /@?import + ?((\w+) +from )?([\'\"])(.*?);?\3/gm;
  var importModules = /import +(\w+) +from +([\'\"])(.*?)\2/gm;
  var importFiles = /import +([\'\"])(.*?)\1/gm;
  var importSass = /@import +([\'\"])(.*?)\1/gm;
  var resourceDir = path.dirname(this.resourcePath);

  var nodeModulesPath = walkUpToFindNodeModulesPath(resourceDir);

  function replacer(match, fromStatement, obj, quote, filename) {
    var modules = [];
    var withModules = false;

    if (!filename.match(/\*/)) return match;

    var globRelativePath = filename.match(/!?([^!]*)$/)[1];
    var prefix = filename.replace(globRelativePath, "");
    var cwdPath;

    if (isNodeModule(globRelativePath)) {
      if (!nodeModulesPath) {
        self.emitError(new Error("Cannot find node_modules directory."));
        return match;
      }

      cwdPath = nodeModulesPath;
    } else {
      cwdPath = resourceDir;
    }

    var result = glob
      .sync(globRelativePath, {
        cwd: cwdPath,
      })
      .map((file, index) => {
        var fileName = quote + prefix + file + quote;

        if (match.match(importSass)) {
          return "@import " + fileName;
        } else if (match.match(importModules)) {
          var moduleName = "_" + obj + index;
          modules.push({
            importName: moduleName,
            path: path.parse(prefix + file),
          });
          withModules = true;
          return "import * as " + moduleName + " from " + fileName;
        } else if (match.match(importFiles)) {
          return "import " + fileName;
        } else {
          self.emitWarning('Unknown import: "' + match + '"');
        }
      })
      .join("; ");

    if (result && withModules) {
      var moduleTree = buildModuleTree(modules);
      result += "; var " + obj + " = " + buildModuleAssignment(moduleTree, quote);
    }

    if (!result) {
      self.emitWarning('Empty results for "' + match + '"');
    }

    return result;
  }

  var res = source.replace(regex, replacer);
  return res;
};
