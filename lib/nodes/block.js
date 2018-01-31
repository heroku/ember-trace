const { print } = require('@glimmer/syntax');
const MustacheNode = require('./mustache');

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

module.exports = BlockNode;
