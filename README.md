# PostCSS Merge Selectors [![Build Status][ci-img]][ci]

[PostCSS] plugin to combine selectors that have duplicate rules. Can be configured to skip or only apply to specific rules..

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/georgeadamson/postcss-merge-selectors.svg
[ci]:      https://travis-ci.org/georgeadamson/postcss-merge-selectors

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-merge-selectors') ])
```

See [PostCSS] docs for examples for your environment.
