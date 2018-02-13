class BaseNode {
  constructor(...args) {
    this.constructorArgs = args;
    this.children = [];
  }

  get id() {
    let parts = [];

    if (this.parent) {
      parts.push(this.parent.id);
      parts.push(this.parent.children.indexOf(this));
    }

    return parts.join('__');
  }

  add(child) {
    this.children.push(child);
    child.parent = this;
  }

  childrenToDot() {
    return this.children
      .map(child => child.toDot())
      .join('\n')
      .replace(/^/mg, '  ');
  }

  generateEdges(...args) {
    this.children.forEach(child => child.generateEdges(...args));
  }

  expand(modules, trail = []) {
    this.children.forEach(child => child.expand(modules, trail));
  }

  clone() {
    let clone = new this.constructor(...this.constructorArgs);
    this.children.forEach(child => clone.add(child.clone()));
    return clone;
  }

  toDot() {
    return '';
  }
}

module.exports = BaseNode;
