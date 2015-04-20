var assert = require('assert');

var dein = require('../')

describe('dein', function() {

  it('should resolve dependencies.', function() {
    return dein
      .register('hello', hello)
      .resolve('hello')
      .then(function(result) {
        assert.strictEqual(result, 'world');
      });

    function hello() {
      return 'world';
    }
  });

  it('should resolve literals.', function() {
    return dein
      .registerLiteral('dependency', 'a')
      .resolve('dependency')
      .then(function(result) {
        assert.strictEqual(result, 'a');
      });
  });

  it('should resolve modules with dependencies.', function() {
    return dein
      .registerLiteral('hello', 'world')
      .register('suffix', suffix)
      .register('sayHello', sayHello)
      .resolve('sayHello')
      .then(function(result) {
        assert.strictEqual(result, 'say world!');
      });

    function sayHello(hello, suffix) {
      return 'say ' + hello + suffix;
    }

    function suffix() {
      return '!';
    }
  });

  it('should throw an error on unregistered dependencies.', function() {
    return dein
      .resolve('hello')
      .catch(function(err) {
        assert.strictEqual(err.message, 'Dependency hello is not registered.');
      })
  });

  it('should catch circular dependencies.', function() {
    return dein
      .register('circular1', circular1)
      .register('circular2', circular2)
      .resolve('circular1')
      .catch(function(err) {
        var expected = 'Circular dependency detected with circular1.';
        assert.strictEqual(err.message, expected);
      });

    function circular1(circular2) {
    }

    function circular2(circular1) {
    }
  });

  it('should work with literal promises.', function() {
    return dein
      .registerLiteral('promise', Promise.resolve('hello'))
      .resolve('promise')
      .then(function(result) {
        assert.strictEqual(result, 'hello');
      });
  });

  it('should work with promises.', function() {
    return dein
      .register('promise', getPromise)
      .resolve('promise')
      .then(function(result) {
        assert.strictEqual(result, 'hello');
      });

    function getPromise() {
      return Promise.resolve('hello');
    }
  });

  it('should work with multiline function arguments', function() {
    return dein
      .registerLiteral('first', 1)
      .registerLiteral('second', 2)
      .registerLiteral('third', 3)
      .register('result', functionWithArgumentsSpanningMultipleLines)
      .resolve('result')
      .then(function(result) {
        assert.strictEqual(result, 6);
      });

    function functionWithArgumentsSpanningMultipleLines(
      first,
      second,
      third) {
        return first + second + third;
      }
  });
});
