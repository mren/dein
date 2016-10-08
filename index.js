function Dein(modules) {
  this.modules = modules || {};
}

function parseArguments(func) {
  const funcString = func.toString();
  if (funcString.startsWith('function ')) {
    const extractedArguments = func.toString().match(/function.*?\(([\s\S]*?)\)/);
    if (!extractedArguments) {
      throw new Error(`Could not parse function ${func}.`);
    }
    const identity = value => value;
    const trim = str => str.trim();
    return extractedArguments[1].split(',').filter(identity).map(trim);
  }
  if (funcString.includes('=>')) {
    if (funcString[0] === '(') {
      const argumentString = funcString.substr(1, funcString.indexOf(')') - 1).replace(/ /g, '');
      return argumentString === '' ? [] : argumentString.split(',');
    }
    return [funcString.replace(' ', '').split('=')[0]];
  }
  throw new Error('Unexpected Function.');
}
Dein.prototype.parseArguments = parseArguments;


function object(list) {
  const result = {};
  list.forEach(elem => {
    result[elem[0]] = elem[1];
  });
  return result;
}
Dein.prototype.object = object;

function register(name, func) {
  const module = { func, required: parseArguments(func) };
  return this.registerModule(name, module);
}
Dein.prototype.register = register;

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
    const circularError = new Error(`Circular dependency detected with ${name}.`);
    return Promise.reject(circularError);
  }
  const dependencies = module.required
    .map(requirement => resolveModule(modules, requirement, visited.concat(name)));
  return Promise.all(dependencies)
    .then(args => module.func.apply(null, args));
}

function resolve(name) {
  return resolveModule(this.modules, name, []);
}
Dein.prototype.resolve = resolve;

module.exports = new Dein();
