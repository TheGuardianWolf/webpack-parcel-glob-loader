var glob = require("glob");
var path = require("path");

module.exports = function(source) {
  this.cacheable();
  var regex = /import + ?((\w+) from )?([\'\"])(.*?)\3/gm;
  var importModules = /import +(\w+) +from +([\'\"])(.*?)\2/gm;
  var importFiles = /import +([\'\"])(.*?)\1/gm;
  var resourceDir = path.dirname(this.resourcePath);
  function replacer(match, fromStatement, obj, quote, filename) {
    var modules = [];
    var withModules = false;
    if (!glob.hasMagic(filename)) return match;
    var result = glob
      .sync(filename, {
        cwd: resourceDir
      })
      .map(function(file, index) {
        var fileName = quote + file + quote;
        if (match.match(importModules)) {
          var moduleName = obj + index;
          modules.push(moduleName);
          withModules = true;
          return 'import * as ' + moduleName + ' from ' + fileName;
        } else if (match.match(importFiles)) {
          return 'import ' + fileName;
        }
      })
      .join(';\n');
    if (result && withModules) {
      result += '\nlet ' + obj + ' = [' + modules.join(', ') + ']';
    }
    return result;
  }
  var res = source.replace(regex, replacer);
  return res;
};