# dein - dependency injection framework

A small dependency injection framework for node.js.

- Register modules with dependencies.
- Register literals without dependencies.
- Dependency injection framework is immutable.

# Quick Start

```bash
npm install dein
```

```javascript
var dein = require('dein');
```

# Examples

```javascript
dein
  .registerLiteral('someString', 'Hello World')
  .register('someModule', function(someString) {
    return someString + '!!!';
  })
  .resolve('someModule')
  .then(function(result) {
    console.log('Result: ' + result);
    // Expected: `Result: Hello World!!!
  });
```

# Tests

```bash
npm test
```
