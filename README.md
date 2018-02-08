# ember-trace

[![npm version](https://badge.fury.io/js/ember-trace.svg)](https://badge.fury.io/js/ember-trace)

Generate [Graphviz] dataflow graphs for your Ember app.

Given some templates:

```
app/templates/
├── application.hbs
└── components
    ├── x-bar.hbs
    └── x-foo.hbs
```

Running ember trace:

```sh
$ ember trace app/templates/application.hbs
```

Will produce something like this:

![Example graph](./docs/images/example.png)

## Installation

```
ember install ember-trace
```

[Graphviz installation](http://graphviz.org/download/)

## Usage

```
ember trace app/templates/my-route.hbs
```

This command emits the graph to stdout in [Graphviz DOT format]. You’ll
probably want to pipe it straight into the `dot` program to generate the graph.

```
ember trace app/templates/my-route.hbs | dot -Tpdf > graph.pdf
```

Some ember-cli addons emit deprecation warnings on stdout, so you’ll want to
strip those before handing it over to `dot`.

```
ember trace app/templates/my-route.hbs | sed 's/^DEPRECATION.*$//g' | dot -Tpdf > graph.pdf
```

[Graphviz]: http://graphviz.org/
[Graphviz DOT format]: https://www.graphviz.org/doc/info/lang.html
