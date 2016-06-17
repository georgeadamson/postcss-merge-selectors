import postcss from 'postcss';
import test    from 'ava';

import plugin from './';

function run (t, input, expected, opts = { }) {
  return postcss([ plugin(opts) ]).process(input)
    .then(result => {
      t.deepEqual(result.css, expected);
      t.deepEqual(result.warnings().length, 0);
    });
}

// Write tests here

test('Should merge adjacent selectors that have identical styles', t => {
  return run(t,
    '.foo { width:0; height:0 } .bar { height:0; width:0 }',
    '.foo, .bar { height:0; width:0 }',
    {}
  );
});


test('Should not merge selectors that have different styles', t => {
  return run(t,
    '.foo { width:0; height:0 } A.foobar { top: 0 } .bar { height:0; width:0 }',
    '.foo, .bar { height:0; width:0 } A.foobar { top: 0 }',
    {}
  );
});


test('Should merge selectors and dedupe those with same name', t => {
  return run(t,
    '.foo { top:0 } .bar { top: 0 } .foo { top:0 }',
    '.foo, .bar { top:0 }',
    {}
  );
});

test('Should merge selectors that match config group', t => {
  return run(t,
    '.foo1 { top:0 } .fooDummy { top:0 } .foo2 { top:0 } .fooDummy { top:0 }',
    '.foo1, .foo2 { top:0 } .fooDummy { top:0 } .fooDummy { top:0 }',
    { groups : [
      { selectorFilter : /\.foo\d+/ }
    ]}
  );
});

test('Should merge selectors at the position of the last occurrence (when flag set)', t => {
  return run(t,
    '.foo1 { top:0 } .bar { top:0 } .foo2 { top:0 } .bar { top:0 }',
    '.bar { top:0 } .foo1, .foo2 { top:0 } .bar { top:0 }',
    { groups : [
      { selectorFilter : /\.foo/, promote : true  }
    ]}
  );
});

test('Should merge selectors at the position of the last occurrence (when flag set)', t => {
  return run(t,
    '.foo1 { top:0 } .bar1 { top:0 } .foo2 { top:0 } .bar2 { top:0 }',
    '.bar1, .bar2 { top:0 } .foo1, .foo2 { top:0 }',
    { groups : [
      { selectorFilter : /\.foo/, promote : true  },
      { selectorFilter : /\.bar/, promote : false }
    ]}
  );
});
