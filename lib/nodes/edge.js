const BaseNode = require('./base');

class Edge extends BaseNode {
  constructor(source, target) {
    super(...arguments);
    this.source = source;
    this.target = target;
  }

  toDot() {
    return `${this.source.id} -> ${this.target.id}`;
  }
}

module.exports = Edge;
