
// Postcss api docs: https://github.com/postcss/postcss/blob/master/docs/api.md

const postcss = require('postcss');
const list    = postcss.list;

function serialiseDeclarations (rule) {
  var nodes = rule.nodes ? rule.nodes.sort().map(String) : [];
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

function selectorMerger (groupOpts) {
  const cache = {};

  return function analyseRule (ruleB) {

    const decl = serialiseDeclarations(ruleB);

    if (cache[decl]) {

      const ruleA = cache[decl];
      const a = list.comma(ruleA.selector);
      const b = list.comma(ruleB.selector);
      const mergedSelector = a.concat(b).filter(unique).join(', ');

      if (groupOpts.promote){
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
    groups : {
      default : {
        selectorFilter : DEFAULT_FILTER,
        promote        : false
      }
    }
  };

  opts = Object.assign({}, DEFAULT_OPTIONS, opts);

  return function (css /* , result */) {

    const groupNames = Object.keys(opts.groups || DEFAULT_OPTIONS.groups);
    groupNames.forEach(name => Object.assign({ groupName : name }, DEFAULT_OPTIONS.groups.default, opts.groups[name]));

    return groupNames.forEach(name => {
      const group = opts.groups[name];
      css.walkRules(group.selectorFilter || DEFAULT_FILTER, selectorMerger(group));
    })

  };
});
