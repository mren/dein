function Dein(modules) {
  this.modules = modules || {};
  this.cache = {};
}

function parseArguments(func) {
  const funcString = func.toString();
  const identity = value => value;
  const trim = str => str.trim();

  if (funcString.startsWith('function ')) {
    const extractedArguments = func.toString().match(/function.*?\(([\s\S]*?)\)/);
    if (!extractedArguments) {
      throw new Error(`Could not parse function ${func}.`);
    }
    return extractedArguments[1].split(',').filter(identity).map(trim);
  }
  if (funcString.startsWith('class ')) {
    const extractedClassArguments = func.toString().match(/constructor.*?\(([\s\S]*?)\)/);
    if (!extractedClassArguments) {
      throw new Error(`Could not parse class ${func}.`);
    }
    return extractedClassArguments[1].split(',').filter(identity).map(trim);
  }
  if (funcString.includes('=>')) {
    if (funcString[0] === '(') {
      const argumentString = funcString.substr(1, funcString.indexOf(')') - 1).replace(/ /g, '');
      return argumentString === '' ? [] : argumentString.split(',');
    }
    return [funcString.replace(' ', '').split('=')[0]];
  }
  throw new Error(`Unexpected Function (${funcString}).`);
}
Dein.prototype.parseArguments = parseArguments;


function object(list) {
  const result = {};
  list.forEach((elem) => {
    result[elem[0]] = elem[1];
  });
  return result;
}
Dein.prototype.object = object;

const functionToModule = func => ({ func, required: parseArguments(func) });

function register(name, func) {
  return this.registerModule(name, functionToModule(func));
}
Dein.prototype.register = register;

function registerModules(modules) {
  return Object.keys(modules)
    .map(name => ({ name, module: functionToModule(modules[name]) }))
    .reduce((that, result) => that.registerModule(result.name, result.module), this);
}
Dein.prototype.registerModules = registerModules;

function registerLiteral(name, literal) {
  const constant = value => () => value;
  return this.registerModule(name, { func: constant(literal), required: [] });
}
Dein.prototype.registerLiteral = registerLiteral;

function registerModule(name, module) {
  return new Dein(Object.assign({}, this.modules, object([[name, module]])));
}
Dein.prototype.registerModule = registerModule;

function resolveModule(modules, name, visited) {
  const module = modules[name];
  if (!module) {
    const notRegisteredError = new Error(`Dependency ${name} is not registered.`);
    return Promise.reject(notRegisteredError);
  }
  if (visited.indexOf(name) >= 0) {
    const circle = visited.concat(name).join(' -> ');
    const circularError = new Error(`Circular dependency with \`${circle}\` detected.`);
    return Promise.reject(circularError);
  }
  if (this.cache[name]) {
    return this.cache[name];
  }
  const dependencies = module.required
    .map(requirement => this.resolveModule(modules, requirement, visited.concat(name)));

  const initializeModule = (args) => {
    const isClass = /^class\s/.test(module.func.toString());
    if (isClass) {
      return new (module.func.bind.apply(module.func, [module.func].concat(args)))();
    }
    return module.func.apply(null, args);
  };
  const result = Promise.all(dependencies)
    .then(initializeModule);
  this.cache[name] = result;
  return result;
}
Dein.prototype.resolveModule = resolveModule;

function resolve(name) {
  return this.resolveModule(this.modules, name, []);
}
Dein.prototype.resolve = resolve;

module.exports = new Dein();
