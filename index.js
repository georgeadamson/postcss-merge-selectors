
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

  const defaultOptions = {
    groups : [
      {
        selectorFilter : /.*/,  // string|RegExp
        promote        : false
      }
    ]
  };

  opts = opts || defaultOptions;

  return function (css /* , result */) {

    const defaultFilter = defaultOptions.groups[0].selectorFilter;
    const groups = opts.groups && opts.groups.length > 0 ? opts.groups : defaultOptions.groups;

    return groups.forEach(group => {
      css.walkRules(group.selectorFilter || defaultFilter, selectorMerger(group));
    })

  };
});
