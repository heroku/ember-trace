const BaseNode = require('./base');
const BlockNode = require('./block');

class ProgramNode extends BaseNode {
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
        return `as |${this.blockParams}|`;
      } else {
        return '';
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

module.exports = ProgramNode;
