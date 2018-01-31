const BaseNode = require('./base');

class PropertyNode extends BaseNode {
  constructor(key) {
    super(...arguments);
    this.key = key;
  }

  toDot() {
    return `${this.id} [label="${this.key}" style="filled" fillcolor="#FFA3D7"]`;
  }
}

module.exports = PropertyNode;
