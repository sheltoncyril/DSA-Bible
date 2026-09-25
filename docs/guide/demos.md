# Demo reference

All interactive widgets live in `docs/assets/js/tree-lab.js` and are loaded on every page. To use one, drop a `<div>` into any Markdown file. No build step, no imports.

Trees are written in **LeetCode level order**: `[A,B,C,null,D]`. Labels can be letters or numbers. Use letters when the demo computes numbers (like height), so labels are never confused with answers.

## `tree-lab`: step-through recursion visualizer

```html
<div class="tree-lab" data-problem="height" data-tree="[A,B,C,D,E]"></div>
```

| Attribute | Meaning |
|---|---|
| `data-problem` | One problem id (see table below) |
| `data-problems` | Comma-separated ids; shows a **Problem** switcher. Use instead of `data-problem`. |
| `data-tree` | Starting tree |
| `data-variant` | Problem variant, e.g. `nodes` for height counted in nodes |
| `data-show-null` | `false` hides the calls on empty children (default: shown) |

Built-in problems:

| id | What it traces |
|---|---|
| `height` | Height; variants `edges` (default) and `nodes` |
| `size` | Number of nodes |
| `sum` | Sum of values (numeric trees) |
| `max` | Maximum value (numeric trees) |
| `leaves` | Number of leaves (two base cases) |
| `depth` | Top-down depth labelling (parameter passed down) |
| `minDepthBuggy` | The naive `1 + min(L, R)` min-depth, with the bug called out |
| `minDepth` | Correct min-depth |
| `diameter` | Height plus a shared `best`, i.e. diameter |

<div class="tree-lab" data-problems="height,size,leaves" data-tree="[A,B,C,null,D]"></div>

## `tree-ask`: "be one node" quiz

The reader clicks a node, sees only the children's answers, and types what that node returns.

```html
<div class="tree-ask" data-problem="height" data-tree="[A,B,C,D,E]"></div>
```

Works with any problem that defines `explain` (`height`, `size`, `sum`, `max`, `leaves`).

<div class="tree-ask" data-problem="leaves" data-tree="[A,B,C,D,E,null,F]"></div>

## `tree-measure`: depth vs height

```html
<div class="tree-measure" data-tree="[A,B,C,D,E,null,F]"></div>
```

<div class="tree-measure" data-tree="[A,B,C,D,E,null,F]"></div>

## `rb-lab`: red-black tree insert

Insert values and step through `fix_insert`: roles (cur / parent / grandpa / uncle), the three rules as pass/fail pills, the pseudocode line, and rotations animating in place. Lives in `rb-lab.js`.

```html
<div class="rb-lab" data-insert="10,30,20"></div>
```

`data-insert` pre-inserts values and opens on the first step of the **last** insert.

<div class="rb-lab" data-insert="20,10,30,5"></div>

## Adding a new problem to the visualizer

Add an entry to `PROBLEMS` in `tree-lab.js`. A problem is the real recursive algorithm, written in JS, that reports each step to a tracer `t`:

```js
PROBLEMS.countOdd = {
  name: 'Count odd values',
  numeric: true,                          // needs numeric labels
  locals: ['L', 'R'],                     // shown in each stack frame
  badge: function (v) { return 'odd=' + v; },
  code: function () {                     // Python shown in the Code pane (line numbers are 1-based)
    return [
      'def count_odd(node):',
      '    if node is None:',
      '        return 0',
      '    L = count_odd(node.left)',
      '    R = count_odd(node.right)',
      '    return (node.val % 2) + L + R'
    ];
  },
  run: function (t, n) {
    t.call(n, 'count_odd(' + (n.isNull ? '∅' : n.val) + ')');   // push a frame
    t.step(1, 'Called.', 'call');                                  // (line, narration, kind)
    if (n.isNull) return t.ret(0, 3, 'Empty: 0. Back to {to}.', 'base');
    t.step(4, 'Ask left.', 'ask', { ask: n.left.id });
    var L = this.run(t, n.left);  t.set('L', L);
    t.step(5, 'Ask right.', 'ask', { ask: n.right.id });
    var R = this.run(t, n.right); t.set('R', R);
    var res = (Number(n.val) % 2) + L + R;
    t.mark(n, res);                                               // badge on the node
    return t.ret(res, 6, 'Total ' + res + '. Back to {to}.');     // pop the frame
  }
};
```

Tracer calls:

| Call | Effect |
|---|---|
| `t.call(node, signature, args?)` | Push a stack frame. `args` (object) is shown in the frame. |
| `t.step(line, message, kind?, {ask: childId}?)` | Record a step. `kind` ∈ `call`, `ask`, `resume`, `line`, `base`, `return`, `warn`. |
| `t.set(name, value)` | Set a local in the current frame. |
| `t.mark(node, value)` | Show a badge on a node. |
| `t.global(name, value)` | Show a shared variable above the stack (like `best` in diameter). |
| `t.ret(value, line, message, kind?)` | Record the return, pop the frame, return `value`. `{to}` in messages becomes the caller's label. |

Every missing child is an explicit placeholder with `isNull: true` (and `.parent`, `.side`), so `n.left` is never `null`: check `n.isNull` instead.

Optional: `variants: [{id, label}]` (dropdown; `run` receives the id as its 3rd argument), `explain(n, L, R, variant)` (enables `tree-ask`), `final(result, root, variant)` (custom last message), `start(root)` (custom first-call text).

## Demos for other topics

For a topic that isn't trees (graphs, DP tables, sorting…), create a new file such as `docs/assets/js/dp-lab.js`, add it to `extra_javascript` in `mkdocs.yml`, and follow the same pattern: find `div`s by class on page load, keep all state inside the widget, and use CSS variables that switch under `[data-md-color-scheme="slate"]` so dark mode works.
