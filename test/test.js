'use strict';

const assert = require('assert');

const sinon = require('sinon');

const dein = require('../');

describe('dein', () => {
  it('should resolve dependencies.', () => {
    function hello() {
      return 'world';
    }
    return dein
      .register('hello', hello)
      .resolve('hello')
      .then(result => assert.strictEqual(result, 'world'));
  });

  it('should resolve literals.', () => dein
    .registerLiteral('dependency', 'a')
    .resolve('dependency')
    .then(result => assert.strictEqual(result, 'a'))
  );

  it('should resolve modules with dependencies.', () => {
    function suffixFun() {
      return '!';
    }
    function sayHello(hello, suffix) {
      return `say ${hello}${suffix}`;
    }
    return dein
      .registerLiteral('hello', 'world')
      .register('suffix', suffixFun)
      .register('sayHello', sayHello)
      .resolve('sayHello')
      .then(result => assert.strictEqual(result, 'say world!'));
  });

  it('should throw an error on unregistered dependencies.', () => dein
    .resolve('hello')
    .catch(err => assert.strictEqual(err.message, 'Dependency hello is not registered.'))
  );

  it('should catch circular dependencies.', () => {
    function circular1Fun(circular2) {
      return circular2;
    }

    function circular2Fun(circular1) {
      return circular1;
    }
    return dein
      .register('circular1', circular1Fun)
      .register('circular2', circular2Fun)
      .resolve('circular1')
      .catch((err) => {
        const expected = 'Circular dependency with `circular1 -> circular2 -> circular1` detected.';
        assert.strictEqual(err.message, expected);
      });
  });

  it('should work with literal promises.', () => dein
    .registerLiteral('promise', Promise.resolve('hello'))
    .resolve('promise')
    .then(result => assert.strictEqual(result, 'hello'))
  );

  it('should work with promises.', () => {
    function getPromise() {
      return Promise.resolve('hello');
    }
    return dein
      .register('promise', getPromise)
      .resolve('promise')
      .then(result => assert.strictEqual(result, 'hello'));
  });

  it('should work with multiline function arguments', () => {
    function functionWithArgumentsSpanningMultipleLines(
      first,
      second,
      third) {
      return first + second + third;
    }
    return dein
      .registerLiteral('first', 1)
      .registerLiteral('second', 2)
      .registerLiteral('third', 3)
      .register('result', functionWithArgumentsSpanningMultipleLines)
      .resolve('result')
      .then(result => assert.strictEqual(result, 6));
  });

  it('should work with simple array functions', () => {
    const hello = name => `Hello ${name}.`;
    return dein
      .registerLiteral('name', 'Alice')
      .register('hello', hello)
      .resolve('hello')
      .then(result => assert.strictEqual(result, 'Hello Alice.'));
  });

  it('should work with bracket array functions', () => {
    const hello = (salutation, name) => `${salutation} ${name}.`;
    return dein
      .registerLiteral('salutation', 'Hello')
      .registerLiteral('name', 'Alice')
      .register('hello', hello)
      .resolve('hello')
      .then(result => assert.strictEqual(result, 'Hello Alice.'));
  });

  it('should parse simple function', () => {
    function fun(a, b, c) {
      return a + b + c;
    }
    assert.deepStrictEqual(dein.parseArguments(fun), ['a', 'b', 'c']);
  });

  it('should parse arrow function', () => {
    const fun = (a, b, c) => a + b + c;
    assert.deepStrictEqual(dein.parseArguments(fun), ['a', 'b', 'c']);
  });

  it('should parse empty arrow function', () => {
    const fun = () => true;
    assert.deepStrictEqual(dein.parseArguments(fun), []);
  });

  it('should parse simple function with inside arrow function', () => {
    function fun(a, b, c) {
      const arrow = (x, y) => x + y;
      return arrow(arrow(a, b), c);
    }
    assert.deepStrictEqual(dein.parseArguments(fun), ['a', 'b', 'c']);
  });

  it('should parse one line function with inline function call', () => {
    function fun(a) { return a(true); }
    assert.deepStrictEqual(dein.parseArguments(fun), ['a']);
  });

  it('should have object helper function', () => {
    assert.deepStrictEqual(dein.object([['a', 1], ['b', 2]]), { a: 1, b: 2 });
  });

  it('should resolve javascript classes', () => {
    class Class { constructor(a, b) { this.dependencies = { a, b }; } }
    return dein
      .registerLiteral('a', true)
      .registerLiteral('b', false)
      .register('class', Class)
      .resolve('class')
      .then(result => assert.deepEqual(result.dependencies, { a: true, b: false }));
  });

  it('should resolve every element only once', () => {
    const stub = sinon.stub().returns(true);
    const dependencyInjection = dein
      .register('singleton', () => stub());
    return Promise.all([
      dependencyInjection.resolve('singleton'),
      dependencyInjection.resolve('singleton'),
    ]).then(() => sinon.assert.calledOnce(stub));
  });

  it('should register a dictionary', () => dein
    .registerModules({
      a: b => b,
      b: () => true,
    })
    .resolve('a')
    .then(result => assert(result))
  );

  it('should keep cache to each instance', () => {
    const parent = dein.register('a', () => 'a');
    const child = parent.register('b', () => 'b');
    return child.resolve('b')
      .then(() => {
        assert.deepStrictEqual(parent.cache, {});
        assert(child.cache.b);
        assert.notDeepStrictEqual(child.cache, parent.cache);
      });
  });

  it('should use annotations by', () => dein.registerModules({
    dependencyA: () => 1,
    dependencyB: () => 2,
    minified: Object.assign(((a, b) => a + b), { $inject: ['dependencyA', 'dependencyB'] }),
  })
    .resolve('minified')
    .then(result => assert.strictEqual(result, 3))
  );
});
