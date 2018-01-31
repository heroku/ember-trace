const BaseNode = require('./base');
const GraphNode = require('./graph');

class ModuleNode extends BaseNode {
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

module.exports = ModuleNode;
