
// Postcss api docs: https://github.com/postcss/postcss/blob/master/docs/api.md

const postcss = require('postcss');
const list    = postcss.list;

const DEFAULT_MATCHER = {
  selectorFilter : /.*/,
  promote        : false
};
const DEFAULT_OPTIONS = {
  matchers : {
    default : DEFAULT_MATCHER
  }
};

function byDecl (node){
  return (node || this).type === 'decl';
}

function serialiseDeclarations (rule) {
  var nodes = rule.nodes ? rule.nodes.filter(byDecl).sort().map(String) : [];
  return nodes.join(';').replace(/\s+/g,'');
}

// Usage: array.filter(unique)
function unique (value, index, self) {
  return self.indexOf(value) === index;
}

function selectorMerger (matcherOpts) {
  const cache = {};

  return function analyseRule (ruleB) {

    const decl = serialiseDeclarations(ruleB);

    if (cache[decl]) {

      const ruleA = cache[decl];
      const a = list.comma(ruleA.selector);
      const b = list.comma(ruleB.selector);
      const mergedSelector = a.concat(b).filter(unique).join(', ');

      // Prepend selector to the most recent rule if desired:
      if (matcherOpts.promote){
        ruleB.selector = mergedSelector;
        ruleA.remove();
        cache[decl] = ruleB;
      // Otherwise append selector to the rule we found first:
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

  opts = Object.assign({}, DEFAULT_OPTIONS, opts);
  const matchers = Object.keys(opts.matchers || DEFAULT_OPTIONS.matchers);
  if (!matchers.length){ throw 'postcss-merge-selectors: opts.matchers was specified but appears to be empty.'; return; }
  
  matchers.forEach(name => 
    opts.matchers[name] = Object.assign(
      { 
        name,
        debug          : opts.debug,
        selectorFilter : DEFAULT_MATCHER.selectorFilter
      },
      DEFAULT_MATCHER,
      opts.matchers[name]
    )
  );

  return function (css /* , result */) {

    return matchers.forEach(name => {
      const matcher = opts.matchers[name];
      css.walkRules(matcher.selectorFilter, selectorMerger(matcher));
    })

  };
});
