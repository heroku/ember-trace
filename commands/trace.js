const { denodeify } = require('rsvp');
const glob = denodeify(require('glob'));
const fs = require('fs');
const writeFile = denodeify(fs.writeFile);
const Tracer = require('../lib/tracer');
const { preprocess, traverse } = require('@glimmer/syntax');

module.exports = {
  name: 'trace',
  description: 'Generates a dataflow graph from the given template in Graphviz DOT format',
  works: 'insideProject',

  anonymousOptions: ['<entrypoint>'],

  availableOptions: [
    { name: 'output', type: 'Path', aliases: ['o'] }
  ],

  run({ output }, [entrypoint]) {
    let tracer = new Tracer();
    let [,root] = entrypoint.match(/^(.+?\/app\/)(.+)$/);

    return glob(`${root}**/*.hbs`)
      .then(files => {
        files.forEach(file => {
          let hbs = fs.readFileSync(file, { encoding: 'utf8' });
          let ast = preprocess(hbs);
          let moduleName = file.replace(root, '');
          let visitor = tracer.visitorFor(moduleName);

          traverse(ast, visitor);
        });

        let dot = tracer.dotFor(entrypoint.replace(root, ''));

        if (output) {
          return writeFile(output, dot);
        } else {
          this.ui.write(dot);
        }
      });
  }
};
