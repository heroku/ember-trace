const MustacheNode = require('./mustache');

class BlockNode extends MustacheNode {
  get label() {
    return super.label.replace('{{', '{{#');
  }
}

module.exports = BlockNode;
