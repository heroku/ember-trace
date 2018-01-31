const BaseNode = require('./base');

class GraphNode extends BaseNode {
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

module.exports = GraphNode;
