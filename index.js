var Promise = require('bluebird');
var _ = require('underscore');

function Dein(modules) {
  this.modules = modules || {};
}

Dein.prototype.register = function(name, func) {
  var module = {func: func, required: parseArguments(func)};
  return this.registerModule(name, module);
};

Dein.prototype.registerLiteral = function(name, literal) {
  return this.registerModule(name, {func: _.constant(literal), required: []});
};

Dein.prototype.registerModule = function(name, module) {
  return new Dein(_.extend({}, this.modules, _.object([[name, module]])));
};

Dein.prototype.resolve = function(name) {
  return resolve(this.modules, name, []);
};

module.exports = new Dein();

function resolve(modules, name, visited) {
  var module = modules[name];
  if (!module) {
    var error = new Error('Dependency ' + name + ' is not registered.')
    return Promise.reject(error);
  }
  if (visited.indexOf(name) >= 0) {
    var error = new Error('Circular dependency detected with ' + name + '.');
    return Promise.reject(error);
  }
  var dependencies = module.required.map(function(requirement) {
    return resolve(modules, requirement, visited.concat(name));
  });
  return Promise.all(dependencies).then(function(dependencies) {
    return module.func.apply(null, dependencies);
  });
}

function parseArguments(func) {
  var extractedArguments = func.toString().match(/function.*\(([\s\S]*?)\)/);
  if (!extractedArguments) {
    throw new Error('Could not parse function ' + func + '.');
  }
  return extractedArguments[1].split(',').filter(_.identity).map(trim);

  function trim(str) {
    return str.trim();
  }
}
