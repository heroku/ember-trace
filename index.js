'use strict';

module.exports = {
  name: require('./package').name,

  includedCommands() {
    return require('./commands');
  }
};
