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
      params
    } = this.astNode;

    let result = `{{${original}`;

    if (params.length) {
      result += ' ';
      result += params.map(print).join(' ');
    }

    if (pairs.length) {
      result += '\\n';
      result += pairs.map(print).join('\\n');
    }

    result += '}}';

    return result.replace(/"/g, '\\"');
  }

  generateEdges(graph) {
    let generate = (sourceKey, targetKey) => {
      let [sourceRootKey] = sourceKey.split('.');
      let source = findSource(this, sourceRootKey);
      let sourceNode = source.children.find(child => child.key === sourceKey);

      if (!sourceNode) {
        sourceNode = new PropertyNode(sourceKey);
        source.add(sourceNode);
      }

      let targetNode = new PropertyNode(targetKey);

      this.add(targetNode);

      graph.add(new Edge(sourceNode, targetNode));

      if (sourceRootKey !== sourceKey) {
        let sourceRootNode = source.children.find(child => child.key === sourceRootKey);

        if (!sourceRootNode) {
          sourceRootNode = new PropertyNode(sourceRootKey);
          source.add(sourceRootNode);
        }

        if (!graph.children.some(child => child.source === sourceRootNode && child.target === sourceNode)) {
          graph.add(new Edge(sourceRootNode, sourceNode));
        }
      }
    };

    this.astNode.params.forEach((param, i) => {
      if (param.type !== 'PathExpression') { return; }

      let sourceKey = param.original;
      let targetKey = `params[${i}]`;

      generate(sourceKey, targetKey);

      if (this.astNode.path.original === 'yield') {
        let mustache = findModule(this);
        if (!(mustache instanceof MustacheNode)) { return; }
        let block = mustache.children.find(n => n.blockParams && n.blockParams[i]);
        if (!block) { return; }
        let blockKey = block.blockParams[i];
        let blockPropNode = block.children.find(n => n.key === blockKey);

        if (!blockPropNode) {
          blockPropNode = new PropertyNode(targetKey);
          block.add(blockPropNode);
        }

        let sourceNode = this.children.find(n => n.key === targetKey);

        graph.add(new Edge(sourceNode, blockPropNode));
      }
    });

    this.astNode.hash.pairs.forEach(pair => {
      if (pair.value.type !== 'PathExpression') { return; }

      let sourceKey = pair.value.original;
      let targetKey = pair.key;

      generate(sourceKey, targetKey);
    });

    super.generateEdges(graph);
  }

  expand(modules, trail = []) {
    let key = this.astNode.path.original;
    let moduleNode = modules[`templates/components/${key}.hbs`] ||
                     modules[`components/${key}/template.hbs`];

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

function findSource(node, key) {
  return findBlockParam(node, key) || findModule(node);
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
