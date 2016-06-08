function Dein(modules) {
  this.modules = modules || {};
}

Dein.prototype.register = function(name, func) {
  var module = {func: func, required: parseArguments(func)};
  return this.registerModule(name, module);
};

Dein.prototype.registerLiteral = function(name, literal) {
  return this.registerModule(name, {func: constant(literal), required: []});
};

Dein.prototype.registerModule = function(name, module) {
  return new Dein(Object.assign({}, this.modules, object([[name, module]])));
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
  return extractedArguments[1].split(',').filter(identity).map(trim);

  function trim(str) {
    return str.trim();
  }
}

function constant(value) {
    return function() {
        return value;
    }
}

function identity(value) {
    return value
}

function object(list) {
    var result = {};
    for (var i = 0; i < list.length; i++) {
        result[list[i][0]] = list[i][1];
    }
    return result;
};
