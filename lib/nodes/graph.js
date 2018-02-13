const BaseNode = require('./base');

class GraphNode extends BaseNode {
  get id() {
    return 'graph';
  }

  generateEdges(...args) {
    super.generateEdges(...args);
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

module.exports = GraphNode;
