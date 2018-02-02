# ember-trace

[![npm version](https://badge.fury.io/js/ember-trace.svg)](https://badge.fury.io/js/ember-trace)

Generate [Graphviz] dataflow graphs for your Ember app.

## Installation

```
ember install ember-trace
```

[Graphviz installation](http://graphviz.org/download/)

## Usage

```
ember trace app/templates/my-route.hbs
```

This commands emits the graph to stdout in [Graphviz DOT format]. You’ll
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
