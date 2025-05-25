import postcss from 'postcss';
import test    from 'ava';
import plugin  from './index.js';

function run (t, input, expected, opts = { }) {
  return postcss([ plugin(opts) ]).process(input, { from: undefined })
    .then(result => {
      t.deepEqual(result.css, expected);
      t.deepEqual(result.warnings().length, 0);
    });
}


test('Should have no effect when there are no identical styles', t => {
  return run(t,
    '.foo { width:0; } .bar { height:0; }',
    '.foo { width:0; } .bar { height:0; }',
    {}
  );
});


test('Should merge adjacent selectors that have identical styles', t => {
  return run(t,
    '.foo { width:0; height:0 } .bar { height:0; width:0 }',
    '.foo, .bar { width:0; height:0 }',
    { }
  );
});


test('Should not merge selectors that have different styles', t => {
  return run(t,
    '.foo { width:0; height:0 } A.foobar { top: 0 } .bar { height:0; width:0 }',
    '.foo, .bar { width:0; height:0 } A.foobar { top: 0 }',
    {}
  );
});


test('Should merge selectors and dedupe those with same name', t => {
  return run(t,
    '.foo { top:0 } .bar { top: 0 } .foo { top:0 } .baz { left: 10px }',
    '.foo, .bar { top:0 } .baz { left: 10px }',
    {}
  );
});


test('Should merge selectors that match config matcher', t => {
  return run(t,
    '.foo1 { top:0 } .fooDummy { top:0 } .foo2 { top:0 } .fooDummy { top:0 }',
    '.foo1, .foo2 { top:0 } .fooDummy { top:0 } .fooDummy { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /\.foo\d+/ }
    }}
  );
});


test('Should not merge selectors that don\'t match config matcher', t => {
  return run(t,
    '.foo { top:0 } .bar { top:0 } .baz { top:0 }',
    '.foo { top:0 } .bar, .baz { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /bar|baz/ }
    }}
  );
});


test('Should merge selectors that are more complex than the over-simplified examples above', t => {
  return run(t,
    'div#foo-bar, .foo:before { margin:1rem; padding-top:1vw } [whatever] { top:10px } [data-foo="test"].bar { padding-top:1vw; margin:1rem }',
    'div#foo-bar, .foo:before, [data-foo="test"].bar { margin:1rem; padding-top:1vw } [whatever] { top:10px }',
    { matchers : {
      whatever : { selectorFilter : /foo/ }
    }}
  );
});


test('Should merge selectors at the position of the last occurrence (when "promote" flag set)', t => {
  return run(t,
    '.foo1 { top:0 } .bar { top:0 } .foo2 { top:0 } .bar { top:0 }',
    '.bar { top:0 } .foo1, .foo2 { top:0 } .bar { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /\.foo/, promote : true  }
    }}
  );
});


test('Should merge each matcher group separately', t => {
  return run(t,
    '.foo1 { top:0 } .bar1 { top:0 } .foo2 { top:0 } .bar2 { top:0 }',
    '.bar1, .bar2 { top:0 } .foo1, .foo2 { top:0 }',
    { matchers : {
      whatever1 : { selectorFilter : /\.foo/, promote : true  },
      whatever2 : { selectorFilter : /\.bar/, promote : false }
    }}
  );
});


test('Should merge identical selectors without being affected by comment nodes', t => {
  return run(t,
    '.foo1 {  /* comment1 */ top:0 } /* comment2 */ .bar1 { top:0 } .foo2 { top:0 /* comment3 */ } .bar2 { left:0 /* comment4 */ }',
    '.foo1, .bar1, .foo2 {  /* comment1 */ top:0 } /* comment2 */ .bar2 { left:0 /* comment4 */ }',
  );
});


test('Should not merge selectors inside at-rules with those outside', t => {
  return run(t,
    '.visible { opacity: 1; } @keyframes flash { 50%, from, to { opacity: 1; } 25%, 75% { opacity: 0; } }',
    '.visible { opacity: 1; } @keyframes flash { 50%, from, to { opacity: 1; } 25%, 75% { opacity: 0; } }',
  );
});


test('Should merge identical selectors inside the same at-rule', t => {
  return run(t,
    '@keyframes flash { 50% { opacity: 1; } 25%, 75% { opacity: 0; } from, to { opacity: 1; } }',
    '@keyframes flash { 50%, from, to { opacity: 1; } 25%, 75% { opacity: 0; } }'
  );
});


test('Should merge identical selectors inside identical at-rules', t => {
  return run(t,
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 480px) { .b { background-color: black; } .c { background-color: white; } }',
    '@media screen and (min-width: 480px) { .a, .b { background-color: black; } } @media screen and (min-width: 480px) { .c { background-color: white; } }'
  );
});


test('Should not merge selectors inside different at-rules', t => {
  return run(t,
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 481px) { .b { background-color: black; } }',
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 481px) { .b { background-color: black; } }'
  );
});


test('Should delete at-rules rendered empty by merger', t => {
  return run(t,
    '@media screen and (min-width: 480px) { .a { background-color: black; } } @media screen and (min-width: 480px) { .b { background-color: black; } }',
    '@media screen and (min-width: 480px) { .a, .b { background-color: black; } }'
  );
});


test('Does not affect at-rules which never had children', t => {
  return run(t,
    '@import "other.css"',
    '@import "other.css"'
  );
});
