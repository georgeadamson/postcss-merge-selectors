
// Postcss api docs: https://github.com/postcss/postcss/blob/master/docs/api.md

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

function serializeAtRule (rule) {
  return `${rule.name}(${rule.params})`;
}

function serializeScope (rule) {
  var parent = rule.parent;
  if (parent.type === 'atrule') {
    return `${serializeScope(parent)}${serializeAtRule(parent)}>`;
  } else {
    return '';
  }
}

function serialiseDeclarations (rule) {
  var nodes = rule.nodes ? rule.nodes.filter(byDecl).sort().map(String) : [];
  return nodes.join(';').replace(/\s+/g,'');
}

// Usage: array.filter(unique)
function unique (value, index, self) {
  return self.indexOf(value) === index;
}

function removeRule (rule) {
  // Remove the entire parent rule (recursively) if this was the last child left
  if (rule.parent.nodes.length === 1 && rule.parent.type !== 'root') {
    removeRule(rule.parent);
  // Otherwise just remove this rule
  } else {
    rule.remove();
  }
}

function selectorMerger (matcherOpts, { list }) { // Added { list } here
  const cache = {};

  return function analyseRule (ruleB) {

    const decl = serializeScope(ruleB) + serialiseDeclarations(ruleB);

    if (cache[decl]) {

      const ruleA = cache[decl];
      const selectorA = list.comma(ruleA.selector); // Renamed 'a' to 'selectorA' for clarity
      const selectorB = list.comma(ruleB.selector); // Renamed 'b' to 'selectorB' for clarity
      const mergedSelector = selectorA.concat(selectorB).filter(unique).join(', ');

      // Prepend selector to the most recent rule if desired:
      if (matcherOpts.promote){
        ruleB.selector = mergedSelector;
        removeRule(ruleA);
        cache[decl] = ruleB;
      // Otherwise append selector to the rule we found first:
      } else {
        ruleA.selector = mergedSelector;
        removeRule(ruleB);
      }

    } else {

      cache[decl] = ruleB;

    }

    return;

  };

}

const plugin = (opts = {}) => {
  opts = Object.assign({}, DEFAULT_OPTIONS, opts);
  const matchers = Object.keys(opts.matchers || DEFAULT_OPTIONS.matchers);
  if (!matchers.length) {
    throw new Error('postcss-merge-selectors: opts.matchers was specified but appears to be empty.');
    // No return needed after throw
  }

  matchers.forEach(name => {
    opts.matchers[name] = Object.assign(
      {
        name,
        debug: opts.debug,
        selectorFilter: DEFAULT_MATCHER.selectorFilter
      },
      DEFAULT_MATCHER,
      opts.matchers[name]
    );
  });

  return {
    postcssPlugin: 'postcss-merge-selectors',
    Once(root, { list }) { // Pass list here
      matchers.forEach(name => {
        const matcher = opts.matchers[name];
        // Pass list to selectorMerger
        root.walkRules(matcher.selectorFilter, selectorMerger(matcher, { list }));
      });
    }
  };
};
plugin.postcss = true;
module.exports = plugin;
