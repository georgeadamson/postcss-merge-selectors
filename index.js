
// Postcss api docs: https://github.com/postcss/postcss/blob/master/docs/api.md

const postcss = require('postcss');
const list    = postcss.list;

function byDecl (node){
  return (node || this).type === 'decl';
}

function serialiseDeclarations (rule) {
  var nodes = rule.nodes ? rule.nodes.filter(byDecl).sort().map(String) : [];
  return nodes.join(';').replace(/\s+/g,'');
}

// function intersect (a, b, not) {
//   return a.filter(c => {
//     const index = ~b.indexOf(c);
//     return not ? !index : index;
//   });
// }

// function difference (a, b) {
//   return intersect(a, b, true).concat(intersect(b, a, true));
// }

// Usage: array.filter(unique)
function unique (value, index, self) {
  return self.indexOf(value) === index;
}

function selectorMerger (matcherOpts) {
  const cache = {};

  return function analyseRule (ruleB) {

    const decl = serialiseDeclarations(ruleB);
    if (matcherOpts.debug) console.log(decl);

    if (cache[decl]) {

      const ruleA = cache[decl];
      const a = list.comma(ruleA.selector);
      const b = list.comma(ruleB.selector);
      const mergedSelector = a.concat(b).filter(unique).join(', ');

      if (matcherOpts.promote){
        ruleB.selector = mergedSelector;
        ruleA.remove();
        cache[decl] = ruleB;
      } else {
        ruleA.selector = mergedSelector;
        ruleB.remove();
      }

    } else {

      cache[decl] = ruleB;

    }

    return;

  };

}

module.exports = postcss.plugin('postcss-merge-selectors', function (opts) {

  const DEFAULT_FILTER = /.*/;
  const DEFAULT_OPTIONS = {
    matchers : {
      default : {
        selectorFilter : DEFAULT_FILTER,
        promote        : false
      }
    }
  };

  opts = Object.assign({}, DEFAULT_OPTIONS, opts);
  const matchers = Object.keys(opts.matchers || DEFAULT_OPTIONS.matchers);
  if (!matchers.length){ throw 'postcss-merge-selectors: opts.matchers was specified but must not be empty.'; return; }
  matchers.forEach(name => opts.matchers[name] = Object.assign({ name, debug : opts.debug }, DEFAULT_OPTIONS.matchers.default, opts.matchers[name]));

  return function (css /* , result */) {

    return matchers.forEach(name => {
      const matcher = opts.matchers[name];
      if (matcher.debug) console.log('Start matcher:', matcher.name);
      css.walkRules(matcher.selectorFilter || DEFAULT_FILTER, selectorMerger(matcher));
      if (matcher.debug) console.log('End matcher:', matcher.name);
    })

  };
});
