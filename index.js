
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

const SHORTHAND_LONGHANDS = {
  all: null,
  columns: ['column-count', 'column-width'],
  container: ['container-name', 'container-type'],
  'flex-flow': ['flex-direction', 'flex-wrap'],
  font: [
    'font-family',
    'font-feature-settings',
    'font-kerning',
    'font-language-override',
    'font-optical-sizing',
    'font-palette',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-synthesis',
    'font-variant',
    'font-variation-settings',
    'font-weight',
    'line-height'
  ],
  gap: ['column-gap', 'row-gap'],
  inset: ['bottom', 'left', 'right', 'top'],
  'inset-block': ['inset-block-end', 'inset-block-start'],
  'inset-inline': ['inset-inline-end', 'inset-inline-start'],
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'place-self': ['align-self', 'justify-self']
};

function normalizeText (value) {
  return String(value || '').trim();
}

function normalizeProperty (property) {
  return property.startsWith('--') ? property : property.toLowerCase();
}

function serializeAtRule (rule) {
  return `${rule.name}(${rule.params})`;
}

function serializeScopeNode (node) {
  if (node.type === 'atrule') {
    return serializeAtRule(node);
  } else if (node.type === 'rule') {
    return `rule(${normalizeText(node.selector)})`;
  } else {
    return `${node.type}(${normalizeText(node.toString())})`;
  }
}

function serializeScope (rule) {
  var parent = rule.parent;
  if (parent && parent.type !== 'root') {
    return `${serializeScope(parent)}${serializeScopeNode(parent)}>`;
  } else {
    return '';
  }
}

function serializeDeclaration (decl) {
  const important = decl.important ? '!important' : '';
  return `decl(${normalizeProperty(decl.prop)}:${normalizeText(decl.value)}${important})`;
}

function propertiesConflict (propA, propB) {
  if (propA === propB) {
    return true;
  } else if (propA === 'all') {
    return !propB.startsWith('--');
  } else if (propB === 'all') {
    return !propA.startsWith('--');
  } else if (propA.startsWith('--') || propB.startsWith('--')) {
    return false;
  } else if (propA.startsWith(`${propB}-`) || propB.startsWith(`${propA}-`)) {
    return true;
  } else {
    const longhandsA = SHORTHAND_LONGHANDS[propA] || [];
    const longhandsB = SHORTHAND_LONGHANDS[propB] || [];
    return longhandsA.includes(propB) || longhandsB.includes(propA);
  }
}

function declarationsAreOrderIndependent (declarations) {
  // CSS declaration order matters for duplicate properties and shorthand/longhand pairs.
  const properties = declarations.map(decl => normalizeProperty(decl.prop));
  return properties.every((propA, index) => {
    return properties.slice(index + 1).every(propB => !propertiesConflict(propA, propB));
  });
}

function serialiseDeclarations (declarations) {
  const serialized = declarations.map(serializeDeclaration);
  if (declarationsAreOrderIndependent(declarations)) {
    return serialized.sort().join(';');
  } else {
    return serialized.join(';');
  }
}

function serialiseNode (node) {
  if (node.type === 'decl') {
    return serializeDeclaration(node);
  } else if (node.type === 'rule') {
    return `rule(${normalizeText(node.selector)}){${serialiseBody(node)}}`;
  } else if (node.type === 'atrule') {
    return `${serializeAtRule(node)}{${serialiseBody(node)}}`;
  } else {
    return `${node.type}(${normalizeText(node.toString())})`;
  }
}

function serialiseBody (rule) {
  const nodes = rule.nodes ? rule.nodes.filter(node => node.type !== 'comment') : [];
  if (nodes.every(node => node.type === 'decl')) {
    return serialiseDeclarations(nodes);
  } else {
    return nodes.map(serialiseNode).join(';');
  }
}

function isAttachedToRoot (node) {
  let current = node;
  while (current.parent) {
    current = current.parent;
  }
  return current.type === 'root';
}

// Usage: array.filter(unique)
function unique (value, index, self) {
  return self.indexOf(value) === index;
}

function removeRule (rule) {
  if (!rule.parent) {
    return;
  }
  // Remove the entire parent rule (recursively) if this was the last child left
  if (rule.parent.nodes.length === 1 && rule.parent.type !== 'root') {
    removeRule(rule.parent);
  // Otherwise just remove this rule
  } else {
    rule.remove();
  }
}

function selectorMerger (matcherOpts, { list }) {
  const cache = new Map();

  return function analyseRule (ruleB) {
    if (!isAttachedToRoot(ruleB)) {
      return;
    }

    const decl = serializeScope(ruleB) + serialiseBody(ruleB);
    const ruleA = cache.get(decl);

    if (ruleA && isAttachedToRoot(ruleA)) {

      const selectorA = list.comma(ruleA.selector);
      const selectorB = list.comma(ruleB.selector);
      const mergedSelector = selectorA.concat(selectorB).filter(unique).join(', ');

      // Prepend selector to the most recent rule if desired:
      if (matcherOpts.promote){
        ruleB.selector = mergedSelector;
        removeRule(ruleA);
        cache.set(decl, ruleB);
      // Otherwise append selector to the rule we found first:
      } else {
        ruleA.selector = mergedSelector;
        removeRule(ruleB);
      }

    } else {

      cache.set(decl, ruleB);

    }

    return;

  };

}

const plugin = (opts = {}) => {
  opts = Object.assign({}, DEFAULT_OPTIONS, opts);
  const matchers = Object.keys(opts.matchers || DEFAULT_OPTIONS.matchers);
  if (!matchers.length) {
    throw new Error('postcss-merge-selectors: opts.matchers was specified but appears to be empty.');
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
    Once(root, { list }) {
      matchers.forEach(name => {
        const matcher = opts.matchers[name];
        root.walkRules(matcher.selectorFilter, selectorMerger(matcher, { list }));
      });
    }
  };
};
plugin.postcss = true;
module.exports = plugin;
