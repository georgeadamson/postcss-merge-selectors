# PostCSS Merge Selectors

[![NPM Version][npm-img]][npm]

[PostCSS] plugin to combine selectors that have equivalent rules. It can be configured to only merge rules whose selectors match specific filters, for when you want to be tidy without letting it loose on the whole stylesheet.

[PostCSS]: https://postcss.org/
[npm-img]: https://img.shields.io/npm/v/postcss-merge-selectors.svg
[npm]: https://www.npmjs.com/package/postcss-merge-selectors

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

This plugin is less smart than your browser. Combining selectors might satisfy your urge to tidy up generated CSS, but that warm fluffy feeling can wear off quickly when the new, smaller stylesheet applies things in a different place in the cascade.

In order to merge two selectors, one of the rules has to go away. That means its selector moves to another rule, and that can change which declarations win. Use the `selectorFilter` option to target selectors you understand, use `promote` if the merged rule needs to move further down the stylesheet, and test the resulting CSS carefully.

The plugin does try not to do obviously unsafe things. It compares rule bodies before merging, and avoids merging when declaration order can affect behavior, such as duplicate properties, shorthand/longhand pairs, `all`, differing `!important`, differing quoted value whitespace, or differing nested rule bodies. Comments do not affect matching.

## Install

```sh
npm install postcss-merge-selectors --save-dev
```

## Usage

```js
const postcss = require('postcss');
const mergeSelectors = require('postcss-merge-selectors');

postcss([
  mergeSelectors()
]).process(css, { from: undefined });
```

In `postcss.config.js`:

```js
module.exports = {
  plugins: [
    require('postcss-merge-selectors')()
  ]
};
```

## Options

By default, the plugin considers every selector, which is powerful and therefore a little bit exciting in the bad way:

```js
mergeSelectors();
```

You can supply a map of one or more matchers. The key for each matcher can be any name that helps jog your memory when you come back to this code after a holiday.

All selectors found by a matcher are grouped by their rule bodies. Where the bodies are equivalent, the selectors are combined.

<sub>If you are into SQL, it is a bit like this pseudocode: `SELECT CONCAT(selector), styles FROM stylesheet WHERE selector LIKE '%utilities%' GROUP BY styles`. I do not know if that helps, but it sounded plausible.</sub>

Example:

```js
mergeSelectors({
  matchers: {
    mergeMyUtilities: {
      selectorFilter: /^\.(u|is)-/,
      promote: true
    }
  }
});
```

Each matcher supports:

- `selectorFilter`: `String` or `RegExp` passed to PostCSS `walkRules()` to select merge candidates. Defaults to `/.*/`.
- `promote`: `Boolean`. When `false`, merged selectors stay at the first matching rule. When `true`, merged selectors move to the last matching rule.

## And what is this weird `promote: true` flag about?

Input:

```css
.foo { top: 0; }
.baz { top: 10px; }
.bar { top: 0; }
```

Default output:

```css
.foo, .bar { top: 0; }
.baz { top: 10px; }
```

With `promote: true`:

```css
.baz { top: 10px; }
.foo, .bar { top: 0; }
```

## Tests

```sh
npm test
```
