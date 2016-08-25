# styx

Derives the control flow graph from a JavaScript AST in [ESTree](https://github.com/estree/estree) format.

> This project was created as a proof-of-concept implemention for my Bachelor's thesis in computer science:
> 
> - [Deriving Control Flow Graphs from JavaScript Programs](https://github.com/mariusschulz/bachelors-thesis/blob/master/thesis.pdf)


## Install

```
$ npm install styx
```


## Usage

With the `esprima` and `styx` npm packages installed, Styx can be used as follows:

```js
import Esprima from "esprima";
import * as Styx from "styx";

var code = "var x = 2 + 2;";
var ast = Esprima.parse(code);
var flowProgram = Styx.parse(ast);
var json = Styx.exportAsJson(flowProgram);

console.log(json);
```
