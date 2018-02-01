const BaseNode = require('./base');

class PropertyNode extends BaseNode {
  constructor(key) {
    super(...arguments);
    this.key = key;
  }

  get label() {
    return this.key;
  }

  toDot() {
    return `${this.id} [label="${this.label}" style="filled" fillcolor="#FFA3D7"]`;
  }
}

module.exports = PropertyNode;
