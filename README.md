# PostCSS Merge Selectors

[![NPM Version][npm-img]][npm]

[PostCSS] plugin that merges selectors when their rule bodies are equivalent.

It is useful when generated CSS repeats the same declarations under different selectors and you want a smaller, tidier stylesheet.

[PostCSS]: https://postcss.org/
[npm-img]: https://img.shields.io/npm/v/postcss-merge-selectors.svg
[npm]: https://www.npmjs.com/package/postcss-merge-selectors

## Example

Input:

```css
.foo { top: 0; }
.baz { left: 10px; }
.bar { top: 0; }
```

Output:

```css
.foo, .bar { top: 0; }
.baz { left: 10px; }
```

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

By default, the plugin considers every selector:

```js
mergeSelectors();
```

You can provide named matchers to limit which selectors are eligible for merging:

```js
mergeSelectors({
  matchers: {
    utilities: {
      selectorFilter: /^\.(u|is)-/,
      promote: true
    }
  }
});
```

Each matcher supports:

- `selectorFilter`: `String` or `RegExp` passed to PostCSS `walkRules()` to select merge candidates. Defaults to `/.*/`.
- `promote`: `Boolean`. When `false`, merged selectors stay at the first matching rule. When `true`, merged selectors move to the last matching rule.

## Promote

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

## Safety Notes

Merging selectors can change cascade behavior because one rule is removed and its selector is moved onto another rule. Use `selectorFilter` to target CSS you control, and test the resulting stylesheet.

The plugin compares rule bodies before merging. It avoids merging when declaration order can affect behavior, such as duplicate properties, shorthand/longhand pairs, `all`, differing `!important`, differing quoted value whitespace, or differing nested rule bodies.

Comments do not affect matching.

## Tests

```sh
npm test
```
