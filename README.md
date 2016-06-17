# PostCSS Merge Selectors [![Build Status][ci-img]][ci]

[PostCSS] plugin to combine selectors that have duplicate rules. Can be configured with filters to only merge rules with specific selectors.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/georgeadamson/postcss-merge-selectors.svg
[ci]:      https://travis-ci.org/georgeadamson/postcss-merge-selectors

```css
  .foo { top: 0; }
  .bar { top: 0; }
  .baz { left: 10px; }
  .foo { top: 0; }
```

```css
  .foo, .bar { top: 0; }
  .baz { left: 10px; }
```

## Usage

```js
postcss([ require('postcss-merge-selectors') ])
```

## Options

```js
  {
    groups : [
      {
        selectorFilter : /.\foo/, // (String|RegExp) to find several selectors as candidates for merge. Default /.*/
        promote : true            // (Boolean) to place the grouped selectors where the last match was found in the css. Default false
      }
      ...
    ]
  }
```

See [PostCSS] docs for examples for your environment.
