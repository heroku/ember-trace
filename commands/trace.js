const { denodeify } = require('rsvp');
const glob = denodeify(require('glob'));
const fs = require('fs');
const writeFile = denodeify(fs.writeFile);
const Tracer = require('../lib/tracer');
const { preprocess, traverse } = require('@glimmer/syntax');

module.exports = {
  name: 'trace',
  description: 'Generate a graph of templates',
  works: 'insideProject',

  anonymousOptions: ['<entrypoint>'],

  availableOptions: [
    { name: 'output', type: 'Path', aliases: ['o'] }
  ],

  run({ output }, [entrypoint]) {
    let tracer = new Tracer();

    return glob('app/**/*.hbs')
      .then(files => {
        files.forEach(file => {
          let hbs = fs.readFileSync(file, { encoding: 'utf8' });
          let ast = preprocess(hbs);
          let visitor = tracer.visitorFor(file);

          traverse(ast, visitor);
        });

        let dot = tracer.dotFor(entrypoint);

        if (output) {
          return writeFile(output, dot);
        } else {
          this.ui.write(dot);
        }
      });
  }
};
