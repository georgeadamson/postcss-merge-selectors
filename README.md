# PostCSS Merge Selectors [![Build Status][ci-img]][ci] [![NPM Version][npm-img]][npm]

[PostCSS] plugin to combine selectors that have identical rules. Can be configured to only merge rules who's selectors match specific filters.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/georgeadamson/postcss-merge-selectors.svg
[ci]:      https://travis-ci.org/georgeadamson/postcss-merge-selectors
[npm-img]: https://badge.fury.io/js/postcss-merge-selectors.svg
[npm]:     https://badge.fury.io/js/postcss-merge-selectors.svg)](https://badge.fury.io/js/postcss-merge-selectors


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

This plugin isn't smart. It hasn't got a chuffing clue what your css is trying to achieve. Combining selectors might satisfy your urge to be tidy, but the warm fluffy feeling will subside pretty quickly when your new bijou css causes styles to be applied differently. In order to merge two selectors we have to move one of them. That means they may now override rules that used to be after them, or they may be overridden by rules that used to be before them. I recommend you use the `selectorFilter` option to only target specific selectors and the `promote` option if you need to move the resulting selectors further down the stylesheet. Test the resulting css carefully.

## Install

```shell
npm install postcss-merge-selectors --save-dev
```

## Usage

```js
var postcssMerge = require('postcss-merge-selectors');
postcss([ postcssMerge(opts) ]);
```

## Options

You supply a map of one or more "matchers". The key for each can be any name that'll help jog your memory when you look at your code again after returning from your holiday.

All the selectors found by a matcher will be grouped by their css rules where they're the same.

<sub>If you're into SQL then it's a bit like this (pseudocode) `SELECT CONCAT(selector), styles FROM stylesheet WHERE selector LIKE '%foobar%' GROUP BY styles` (I dunno if that helps but it seemed like a good idea at the time.)</sub>

Options for each matcher:
- `selectorFilter` (String|RegExp) to find several selectors as candidates for merge. Those with identical style declarations will be merged.
- `promote` (Boolean) to place merged selectors where the last rule matching selectorFilter was found in the css. false (default) will place them all where the first match was found.

Example:
```js
var opts = {
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

And what is this weird *promote:true* flag about?

<table>
  <thead>
    <tr>
      <th>Before</th>
      <th>After (default)</th>
      <th>After (with promote:true)</th>
  <tbody>
    <tr>
      <td>
        <div class="highlight highlight-source-js">
<pre>
  .foo { top: 0; }
  .baz { top: 10px; }
  .bar { top: 0; }
</pre>
        </div>
      </td>
      <td>
        <div class="highlight highlight-source-js">
<pre>
  .foo, .bar { top: 0; }
  .baz { top: 10px; }
</pre>
        </div>
      </td>
      <td>
        <div class="highlight highlight-source-css">
<pre>
  .baz { top: 10px; }
  .foo, .bar { top: 0; }
</pre>
        </div>
      </td>
    </tr>
  </tbody>
</table>

See [PostCSS] docs for examples for your environment.
