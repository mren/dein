# dein - dependency injection framework

A small dependency injection framework for node.js.

- Register modules with dependencies.
- Register literals without dependencies.
- Dependency injection framework is immutable.

## Features

- dein is lazy. Only dependencies which are used are resolved
- dein allows async dependency resolution by using promises.
  You can mix synchronous factory methods with asynchronous ones.
- dein will automatically find the required dependency.
  No need to define the order of dependencies.

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
