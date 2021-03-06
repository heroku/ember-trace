const pretty = require('./utils/pretty');
const GraphNode = require('./nodes/graph');
const ModuleNode = require('./nodes/module');
const MustacheNode = require('./nodes/mustache');
const BlockNode = require('./nodes/block');
const ProgramNode = require('./nodes/program');

class Tracer {
  constructor(options = {}) {
    this.options = options;
    this.modules = {};
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

        exit() {
          current = current.parent;
        }
      },

      BlockStatement: {
        enter(block) {
          let node = new BlockNode(block);

          current.add(node);
          current = node;
        },

        exit() {
          current = current.parent;
        }
      },

      Program: {
        enter(program) {
          let node = new ProgramNode(program);

          current.add(node);
          current = node;
        },

        exit() {
          current = current.parent;
        }
      }
    };
  }

  dotFor(...moduleNames) {
    let graph = new GraphNode();
    let { filter } = this.options;

    moduleNames
      .map(name => this.modules[name])
      .filter(_ => _)
      .forEach(module => graph.add(module));

    graph.expand(this.modules);
    graph.generateEdges(graph, filter);

    return pretty(graph.toDot()) + '\n';
  }
}

module.exports = Tracer;
