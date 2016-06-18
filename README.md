# PostCSS Merge Selectors [![Build Status][ci-img]][ci]

[PostCSS] plugin to combine selectors that have identical rules. Can be configured to only merge rules who's selectors match specific filters.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/georgeadamson/postcss-merge-selectors.svg
[ci]:      https://travis-ci.org/georgeadamson/postcss-merge-selectors

Before:
```css
  .foo { top: 0; }
  .baz { left: 10px; }
  .bar { top: 0; }
```

After:
```css
  .foo, .bar { top: 0; }
  .baz { left: 10px; }
```

## There be dragons :(

Combining selectors might satisfy your urge to be tidy, but the warm fluffy feeling will subside when your compact and bijou css causes styles to be applied differently. In order to merge two selectors we have to move one of them. That means they may now override other rules, or other rules may now override them. I recommend you use the `selectorFilter` and `promote` options to only target specific selectors and test the resulting css carefully.

## Usage

```js
var const opts = { matchers : { myFoobarMerge : { selectorFilter : /foo|bar/ } } };
var merger = require('postcss-merge-selectors');
postcss([ merger(opts) ])
```

## Options

You supply a map of one or more "matchers". The key for each can be any name that helps you know what it's there for.

Options for each matcher:
- `selectorFilter` (String|RegExp) to find several selectors as candidates for merge. Those with identical style declarations will be merged.
- `promote` (Boolean) to place merged selectors where the last rule matching selectorFilter was found in the css. false (default) will place them all where the first match was found.

Example:
```js
  {
    matchers : {
      mergeAllMyFoobars : {
        selectorFilter : /.\foobar/,
        promote : true
      },
      someOtherMerge : {
        ...
      }
    }
  }
```

See [PostCSS] docs for examples for your environment.
