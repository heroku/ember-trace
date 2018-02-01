const { print } = require('@glimmer/syntax');
const BaseNode = require('./base');
const Edge = require('./edge');
const PropertyNode = require('./property');
const ModuleNode = require('./module');

class MustacheNode extends BaseNode {
  constructor(astNode) {
    super(...arguments);
    this.astNode = astNode;
  }

  get label() {
    let {
      path: { original },
      hash: { pairs },
      params,
      program: { blockParams = [] } = {}
    } = this.astNode;

    let result = `{{${original}`;

    if (params.length) {
      result += ' ';
      result += params.map(print).join(' ');
    }

    if (pairs.length) {
      result += '\\n';
      result += pairs.map(print).join('\\n');
      if (blockParams.length) {
        result += '\\n';
      }
    }

    if (blockParams.length) {
      result += ` as |${blockParams.join(' ')}|`;
    }

    result += '}}';

    return result.replace(/"/g, '\\"');
  }

  generateEdges(graph) {
    this.astNode.hash.pairs.forEach(pair => {
      if (pair.value.type !== 'PathExpression') { return; }

      let sourceKey = pair.value.original;
      let targetKey = pair.key;
      let source = findSource(this, pair);
      let sourceNode = source.children.find(child => child.key === sourceKey);
      if (!sourceNode) {
        sourceNode = new PropertyNode(sourceKey);
        source.add(sourceNode);
      }
      let targetNode = new PropertyNode(targetKey);
      this.add(targetNode);

      graph.add(new Edge(sourceNode, targetNode));

      if (sourceNode.key.includes('.')) {
        let [sourceRootKey] = pair.value.parts;
        let sourceRootNode = source.children.find(child => child.key === sourceRootKey);

        if (!sourceRootNode) {
          sourceRootNode = new PropertyNode(sourceRootKey);
          source.add(sourceRootNode);
        }

        if (!graph.children.find(child => child.source === sourceRootNode && child.target === sourceNode)) {
          graph.add(new Edge(sourceRootNode, sourceNode));
        }
      }

    });
    super.generateEdges(graph);
  }

  expand(modules, trail = []) {
    let key = this.astNode.path.original;
    let moduleNode = modules[`app/templates/components/${key}.hbs`] ||
                     modules[`app/components/${key}/template.hbs`];

    if (moduleNode && !trail.includes(key)) {
      this.add(moduleNode.clone());
      trail = [...trail, key];
    }

    super.expand(modules, trail);
  }

  toDot() {
    return `
subgraph cluster__${this.id} {
  label="${this.label}"
  style="filled,rounded"
  fillcolor="#9EEBCF"

${this.childrenToDot()}
}
    `;
  }
}

function findSource(node, pair) {
  let [key] = pair.value.parts;

  return findBlockParam(node, key) ||
         findModule(node);
}

function findBlockParam(node, key) {
  while (node) {
    if (node.blockParams && node.blockParams.includes(key)) {
      break;
    }
    node = node.parent;
  }

  return node;
}

function findModule(node) {
  while (node) {
    if (node instanceof ModuleNode) {
      if (node.parent instanceof MustacheNode) {
        node = node.parent;
      }
      break;
    }
    node = node.parent;
  }

  return node;
}

module.exports = MustacheNode;
