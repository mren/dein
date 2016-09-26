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
const dein = require('dein');
```

# Examples

```javascript
dein
  .registerLiteral('someString', 'Hello World')
  .register('someModule', someString => `${someString}!!!`)
  .resolve('someModule')
  .then((result) => {
    console.log('Result: ' + result);
    // Expected: `Result: Hello World!!!
  });
```

# Tests

```bash
npm test
```
