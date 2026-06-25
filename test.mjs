import assert from 'node:assert/strict';
import { test } from 'node:test';
import postcss from 'postcss';
import plugin  from './index.js';

function run (input, expected, opts = { }) {
  return postcss([ plugin(opts) ]).process(input, { from: undefined })
    .then(result => {
      assert.equal(result.css, expected);
      assert.equal(result.warnings().length, 0);
    });
}


test('Should have no effect when there are no identical styles', () => {
  return run(
    '.foo { width:0; } .bar { height:0; }',
    '.foo { width:0; } .bar { height:0; }',
    {}
  );
});


test('Should merge adjacent selectors that have identical styles', () => {
  return run(
    '.foo { width:0; height:0 } .bar { height:0; width:0 }',
    '.foo, .bar { width:0; height:0 }',
    { }
  );
});


test('Should not merge selectors that have different styles', () => {
  return run(
    '.foo { width:0; height:0 } A.foobar { top: 0 } .bar { height:0; width:0 }',
    '.foo, .bar { width:0; height:0 } A.foobar { top: 0 }',
    {}
  );
});


test('Should merge selectors and dedupe those with same name', () => {
  return run(
    '.foo { top:0 } .bar { top: 0 } .foo { top:0 } .baz { left: 10px }',
    '.foo, .bar { top:0 } .baz { left: 10px }',
    {}
  );
});


test('Should merge selector lists without repeating selectors', () => {
  return run(
    '.foo, .bar { top:0 } .bar, .baz { top:0 }',
    '.foo, .bar, .baz { top:0 }'
  );
});


test('Should merge selectors that match config matcher', () => {
  return run(
    '.foo1 { top:0 } .fooDummy { top:0 } .foo2 { top:0 } .fooDummy { top:0 }',
    '.foo1, .foo2 { top:0 } .fooDummy { top:0 } .fooDummy { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /\.foo\d+/ }
    }}
  );
});


test('Should apply default selector filter to named matchers', () => {
  return run(
    '.foo { top:0 } .bar { top:0 }',
    '.foo, .bar { top:0 }',
    { matchers : {
      whatever : {}
    }}
  );
});


test('Should not merge selectors that don\'t match config matcher', () => {
  return run(
    '.foo { top:0 } .bar { top:0 } .baz { top:0 }',
    '.foo { top:0 } .bar, .baz { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /bar|baz/ }
    }}
  );
});


test('Should merge selectors that are more complex than the over-simplified examples above', () => {
  return run(
    'div#foo-bar, .foo:before { margin:1rem; padding-top:1vw } [whatever] { top:10px } [data-foo="test"].bar { padding-top:1vw; margin:1rem }',
    'div#foo-bar, .foo:before, [data-foo="test"].bar { margin:1rem; padding-top:1vw } [whatever] { top:10px }',
    { matchers : {
      whatever : { selectorFilter : /foo/ }
    }}
  );
});


test('Should merge selectors at the position of the last occurrence (when "promote" flag set)', () => {
  return run(
    '.foo1 { top:0 } .bar { top:0 } .foo2 { top:0 } .bar { top:0 }',
    '.bar { top:0 } .foo1, .foo2 { top:0 } .bar { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /\.foo/, promote : true  }
    }}
  );
});


test('Should merge each matcher group separately', () => {
  return run(
    '.foo1 { top:0 } .bar1 { top:0 } .foo2 { top:0 } .bar2 { top:0 }',
    '.bar1, .bar2 { top:0 } .foo1, .foo2 { top:0 }',
    { matchers : {
      whatever1 : { selectorFilter : /\.foo/, promote : true  },
      whatever2 : { selectorFilter : /\.bar/, promote : false }
    }}
  );
});


test('Should merge identical selectors without being affected by comment nodes', () => {
  return run(
    '.foo1 {  /* comment1 */ top:0 } /* comment2 */ .bar1 { top:0 } .foo2 { top:0 /* comment3 */ } .bar2 { left:0 /* comment4 */ }',
    '.foo1, .bar1, .foo2 {  /* comment1 */ top:0 } /* comment2 */ .bar2 { left:0 /* comment4 */ }',
  );
});


test('Should throw when matcher config is empty', () => {
  assert.throws(
    () => plugin({ matchers : {} }),
    /opts\.matchers was specified but appears to be empty/
  );
});


test('Should not merge selectors inside at-rules with those outside', () => {
  return run(
    '.visible { opacity: 1; } @keyframes flash { 50%, from, to { opacity: 1; } 25%, 75% { opacity: 0; } }',
    '.visible { opacity: 1; } @keyframes flash { 50%, from, to { opacity: 1; } 25%, 75% { opacity: 0; } }',
  );
});


test('Should merge identical selectors inside the same at-rule', () => {
  return run(
    '@keyframes flash { 50% { opacity: 1; } 25%, 75% { opacity: 0; } from, to { opacity: 1; } }',
    '@keyframes flash { 50%, from, to { opacity: 1; } 25%, 75% { opacity: 0; } }'
  );
});


test('Should merge identical selectors inside identical at-rules', () => {
  return run(
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 480px) { .b { background-color: black; } .c { background-color: white; } }',
    '@media screen and (min-width: 480px) { .a, .b { background-color: black; } } @media screen and (min-width: 480px) { .c { background-color: white; } }'
  );
});


test('Should not merge selectors inside different at-rules', () => {
  return run(
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 481px) { .b { background-color: black; } }',
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 481px) { .b { background-color: black; } }'
  );
});


test('Should merge identical selectors inside identical nested at-rules', () => {
  return run(
    '@media screen { @supports (display: grid) { .a { color: red } } } @media screen { @supports (display: grid) { .b { color: red } } }',
    '@media screen { @supports (display: grid) { .a, .b { color: red } } }'
  );
});


test('Should not merge identical selectors inside different nested at-rules', () => {
  return run(
    '@media screen { @supports (display: grid) { .a { color: red } } } @media print { @supports (display: grid) { .b { color: red } } }',
    '@media screen { @supports (display: grid) { .a { color: red } } } @media print { @supports (display: grid) { .b { color: red } } }'
  );
});


test('Should delete at-rules rendered empty by merger', () => {
  return run(
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 480px) { .b { background-color: black; } }',
    '@media screen and (min-width: 480px) { .a, .b { background-color: black; } }'
  );
});


test('Does not affect at-rules which never had children', () => {
  return run(
    '@import "other.css"',
    '@import "other.css"'
  );
});
