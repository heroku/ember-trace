const { print } = require('@glimmer/syntax');
const pretty = require('./utils/pretty');
const normalize = require('./utils/normalize');

class Tracer {
  constructor() {
    this.modules = {};
  }

  addModule(module) {
    this.modules[module.name] = module;
  }

  visitorFor(moduleName) {
    let current = new ModuleNode(moduleName);

    this.modules[moduleName] = current;

    return {
      MustacheStatement: {
        enter(mustache) {
          let node = new MustacheNode(mustache);

          current.add(node);
          current = node;
        },

        exit(mustache) {
          current = current.parent;
        }
      },

      BlockStatement: {
        enter(block) {
          let node = new BlockNode(block);

          current.add(node);
          current = node;
        },

        exit(block) {
          current = current.parent;
        }
      },

      Program: {
        enter(program) {
          let node = new ProgramNode(program);

          current.add(node);
          current = node;
        },

        exit(program) {
          current = current.parent;
        }
      }
    };
  }

  dotFor(...moduleNames) {
    let graph = new GraphNode();

    moduleNames
      .map(name => this.modules[name])
      .filter(_ => _)
      .forEach(module => graph.add(module));

    graph.expand(this.modules);
    graph.generateEdges();

    return pretty(graph.toDot()) + '\n';
  }
}

class Node {
  constructor(...args) {
    this.constructorArgs = args;
    this.children = [];
  }

  get id() {
    let parts = [];

    if (this.parent) {
      parts.push(this.parent.id);
      parts.push(this.parent.children.indexOf(this));
    }

    return parts.join('__');
  }

  add(child) {
    this.children.push(child);
    child.parent = this;
  }

  childrenToDot() {
    return this.children
      .map(child => child.toDot())
      .join('\n')
      .replace(/^/mg, '  ');
  }

  generateEdges(graph) {
    this.children.forEach(child => child.generateEdges(graph));
  }

  expand(modules, trail = []) {
    this.children.forEach(child => child.expand(modules, trail));
  }

  clone() {
    let clone = new this.constructor(...this.constructorArgs);
    this.children.forEach(child => clone.add(child.clone()));
    return clone;
  }

  toDot() {
    return '';
  }
}

class GraphNode extends Node {
  get id() {
    return 'graph';
  }

  generateEdges() {
    super.generateEdges(this);
  }

  toDot() {
    return `
digraph {
  rankdir=LR
  graph [
    fontname="Courier"
  ]
  node [
    fontname="Courier"
    shape=rect
  ]

${this.childrenToDot()}
}
    `;
  }
}

class ModuleNode extends Node {
  constructor(name) {
    super(...arguments);
    this.name = name;
  }

  toDot() {
    if (this.parent instanceof GraphNode) {
      return `
subgraph cluster__${this.id} {
  label="${this.name}"
  style="filled"
  fillcolor="#CDECFF"

${this.childrenToDot()}
}
      `;
    } else {
      return this.childrenToDot();
    }
  }
}

function findSource(node, pair) {
  let [key] = pair.value.parts;

  return findBlockParam(node, key) ||
         findModule(node);
}

function findBlockParam(node, key) {
  while (node) {
    if (node instanceof ProgramNode && node.blockParams.includes(key)) {
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

class MustacheNode extends Node {
  constructor(astNode) {
    super(...arguments);
    this.astNode = astNode;
  }

  get label() {
    let slim = {
      type: this.astNode.type,
      path: this.astNode.path,
      params: [],
      hash: {
        type: 'Hash',
        pairs: []
      }
    };

    return print(slim).replace(/"/g, '\\"');
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
    let moduleName = `app/templates/components/${key}.hbs`;
    let moduleNode = modules[moduleName];

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

class BlockNode extends MustacheNode {
  get label() {
    let slim = {
      type: this.astNode.type,
      path: this.astNode.path,
      params: ['if', 'unless'].includes(this.astNode.path.original) ? this.astNode.params : [],
      hash: {
        type: 'Hash',
        pairs: []
      },
      program: {
        type: 'Program',
        blockParams: this.astNode.program.blockParams,
        body: []
      }
    };

    return print(slim).replace(/"/g, '\\"').replace(/}}[\s\S]+/, '}}');
  }
}

class ProgramNode extends Node {
  constructor(astNode) {
    super(...arguments);
    this.astNode = astNode;
  }

  get blockParams() {
    return this.astNode.blockParams;
  }

  get label() {
    if (this.parent instanceof BlockNode) {
      if (this.parent.astNode.path.original === 'if') {
        if (this.parent.children.indexOf(this) === 0) {
          return 'then';
        } else {
          return 'else';
        }
      }
      if (this.blockParams.length) {
        return `{{yield ${this.blockParams}}}`;
      } else {
        return '{{yield}}';
      }
    } else {
      return '';
    }
  }

  toDot() {
    if (this.parent instanceof BlockNode) {
      return `
subgraph cluster__${this.id} {
  label="${this.label}"
  style="filled,rounded"
  fillcolor="#E8FDF5"

${this.childrenToDot()}
}
      `;
    } else {
      return this.childrenToDot();
    }
  }
}

class PropertyNode extends Node {
  constructor(key) {
    super(...arguments);
    this.key = key;
  }

  toDot() {
    return `${this.id} [label="${this.key}" style="filled" fillcolor="#FFA3D7"]`;
  }
}

class Edge extends Node {
  constructor(source, target) {
    super(...arguments);
    this.source = source;
    this.target = target;
  }

  toDot() {
    return `${this.source.id} -> ${this.target.id}`;
  }
}

module.exports = Tracer;
