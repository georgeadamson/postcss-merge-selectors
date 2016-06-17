import postcss from 'postcss';
import test    from 'ava';
import plugin  from './';

function run (t, input, expected, opts = { }) {
  return postcss([ plugin(opts) ]).process(input)
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


test('Should merge selectors at the position of the last occurrence (when flag set)', t => {
  return run(t,
    '.foo1 { top:0 } .bar { top:0 } .foo2 { top:0 } .bar { top:0 }',
    '.bar { top:0 } .foo1, .foo2 { top:0 } .bar { top:0 }',
    { matchers : {
      whatever : { selectorFilter : /\.foo/, promote : true  }
    }}
  );
});


test('Should merge selectors at the position of the last occurrence (when flag set)', t => {
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
