# [Lit Amazons](//mothepro.github.io/lit-amazons)

> Game of Amazons made with web components

## Install

`yarn add @mothepro/lit-amazons`

## How to Use

`index.html`
```html
  <script type="module" src="//unpkg.com/@mothepro/amazons-engine@0.0.6/dist/esm/index.js"></script>
  <script type="module" src="//unpkg.com/@mothepro/lit-amazons/dist/esm/index.js"></script>
  <script type="module" src="index.js"></script>
  <lit-amazons .engine=${window.engine}></lit-amazons>
```

`index.js`
```javascript
  import Engine from '@mothepro/amazons-engine'
  window = new Engine
```

Take a look at the [demo](https://github.com/mothepro/lit-amazons/blob/master/demo/index.ts) for simple of usage.

TODO...
+ Support drag and drop on mobile
