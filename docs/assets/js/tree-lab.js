/*
 * tree-lab.js — interactive binary-tree widgets for the DSA Bible.
 *
 * Widgets (drop the div into any Markdown page):
 *
 *   <div class="tree-lab" data-problem="height" data-tree="[A,B,C,D,E]"></div>
 *       Step-through recursion visualizer: tree, code, call stack, narration.
 *       data-problems="height,size"  -> adds a problem switcher
 *       data-variant="nodes"         -> problem variant (height: edges|nodes)
 *       data-show-null="false"       -> hide the calls on empty (None) children
 *
 *   <div class="tree-ask" data-problem="height" data-tree="[...]"></div>
 *       "Leap of faith" quiz: click a node, you only see your children's answers.
 *
 *   <div class="tree-measure" data-tree="[...]"></div>
 *       Click a node to see its depth (path up) vs its height (path down).
 *
 * Trees are written in LeetCode level order: [A,B,C,null,D]. Labels can be
 * letters or numbers. Adding a new recursive problem = adding an entry to
 * PROBLEMS below (see docs/guide/demos.md).
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------------ utils

  function h(tag, attrs, parent, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function s(tag, attrs, parent, text) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.setAttribute('class', attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmt(v) {
    if (v === undefined) return '—';
    if (v === -Infinity) return '−∞';
    if (v === Infinity) return '∞';
    if (typeof v === 'number' && v < 0) return '−' + Math.abs(v);
    return String(v);
  }

  function lbl(n) { return n.isNull ? '∅' : n.val; }

  // ------------------------------------------------------------- tree model

  var uid = 0;

  function makeNode(val) {
    return { id: 'n' + (uid++), val: String(val), isNull: false, left: null, right: null, parent: null, side: null };
  }

  function isNullTok(t) { return t === '' || /^(null|none|nil|#|-)$/i.test(t); }

  function parseTree(text) {
    var str = String(text || '').trim();
    if (str.charAt(0) === '[') str = str.slice(1);
    if (str.charAt(str.length - 1) === ']') str = str.slice(0, -1);
    var toks = str.split(',').map(function (x) { return x.trim().replace(/^['"]|['"]$/g, ''); });
    if (!toks.length || isNullTok(toks[0])) throw new Error('The tree needs at least a root node, e.g. [A,B,C].');
    var root = makeNode(toks[0]);
    var queue = [root];
    var i = 1;
    while (queue.length && i < toks.length) {
      var cur = queue.shift();
      ['left', 'right'].forEach(function (side) {
        if (i >= toks.length) return;
        var t = toks[i++];
        if (!isNullTok(t)) {
          var c = makeNode(t);
          c.parent = cur; c.side = side; cur[side] = c; queue.push(c);
        }
      });
    }
    if (countReal(root) > 31) throw new Error('Keep it to 31 nodes or fewer so the picture stays readable.');
    fillNulls(root);
    return root;
  }

  // Every missing child becomes an explicit "∅" placeholder, because
  // height(None) is a real call that really happens.
  function fillNulls(n) {
    ['left', 'right'].forEach(function (side) {
      if (!n[side]) {
        n[side] = { id: n.id + side.charAt(0), val: '∅', isNull: true, left: null, right: null, parent: n, side: side };
      } else fillNulls(n[side]);
    });
  }

  function countReal(n) { return !n || n.isNull ? 0 : 1 + countReal(n.left) + countReal(n.right); }

  function walk(n, fn) { if (!n) return; fn(n); walk(n.left, fn); walk(n.right, fn); }

  function isLeaf(n) { return !n.isNull && n.left.isNull && n.right.isNull; }

  function allNumeric(root) {
    var ok = true;
    walk(root, function (n) { if (!n.isNull && isNaN(Number(n.val))) ok = false; });
    return ok;
  }

  function serialize(root) {
    var out = [], q = [root];
    while (q.length) {
      var n = q.shift();
      if (!n || n.isNull) { out.push('null'); continue; }
      out.push(n.val); q.push(n.left, n.right);
    }
    while (out[out.length - 1] === 'null') out.pop();
    return '[' + out.join(',') + ']';
  }

  function randomTree(numeric) {
    var count = 5 + Math.floor(Math.random() * 6);
    var root = { left: null, right: null, d: 0 };
    var nodes = [root];
    var guard = 0;
    while (nodes.length < count && guard++ < 500) {
      var p = nodes[Math.floor(Math.random() * nodes.length)];
      var side = Math.random() < 0.5 ? 'left' : 'right';
      if (p[side] || p.d >= 4) continue;
      var c = { left: null, right: null, d: p.d + 1 };
      p[side] = c; nodes.push(c);
    }
    // label in level order so A is on top
    var q = [root], k = 0;
    while (q.length) {
      var n = q.shift();
      n.val = numeric ? String(1 + Math.floor(Math.random() * 20)) : String.fromCharCode(65 + k++);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    return serialize(root);
  }

  function heightOf(n) { return n.isNull ? -1 : 1 + Math.max(heightOf(n.left), heightOf(n.right)); }
  function depthOf(n) { var d = 0; while (n.parent) { d++; n = n.parent; } return d; }

  // ----------------------------------------------------------------- layout

  var COL = 48, ROW = 72, PAD = 34, NULL_W = 0.6;

  function layout(root, showNull) {
    var pos = {}, x = 0, maxD = 0;
    (function go(n, d) {
      if (n.isNull && !showNull) return;
      if (!n.isNull) go(n.left, d + 1);
      var w = n.isNull ? NULL_W : 1;
      pos[n.id] = { x: PAD + (x + w / 2) * COL, y: PAD + d * ROW };
      x += w;
      maxD = Math.max(maxD, d);
      if (!n.isNull) go(n.right, d + 1);
    })(root, 0);
    return { pos: pos, w: x * COL + PAD * 2, h: maxD * ROW + PAD * 2 + (showNull ? 10 : 0) };
  }

  // --------------------------------------------------------------- TreeView

  function TreeView(host, root, opts) {
    this.host = host;
    this.root = root;
    this.opts = opts || {};
    this.build();
  }

  TreeView.prototype.build = function () {
    var self = this;
    this.host.innerHTML = '';
    var L = layout(this.root, this.opts.showNull);
    this.L = L;
    var svg = s('svg', {
      viewBox: '0 0 ' + L.w + ' ' + L.h,
      class: 'tl-svg',
      role: 'img',
      'aria-label': 'Binary tree diagram'
    }, this.host);
    svg.style.maxWidth = Math.max(L.w * 1.15, 260) + 'px';
    svg.style.minWidth = Math.min(L.w * 0.7, 560) + 'px';   // scroll sideways on phones rather than shrink to unreadable
    this.svg = svg;
    var gE = s('g', { class: 'tl-edges' }, svg);
    var gN = s('g', { class: 'tl-nodes' }, svg);
    this.gO = s('g', { class: 'tl-overlay' }, svg);
    this.nodes = {};
    this.edges = {};
    walk(this.root, function (n) {
      var p = L.pos[n.id];
      if (!p) return;
      if (n.parent) {
        var q = L.pos[n.parent.id];
        self.edges[n.id] = s('line', {
          x1: q.x, y1: q.y, x2: p.x, y2: p.y,
          class: 'tl-edge' + (n.isNull ? ' tl-edge-null' : '')
        }, gE);
      }
      var g = s('g', { class: n.isNull ? 'tl-null' : 'tl-node', transform: 'translate(' + p.x + ',' + p.y + ')' }, gN);
      if (n.isNull) {
        s('rect', { x: -10, y: -10, width: 20, height: 20, rx: 5, class: 'tl-shape' }, g);
        s('text', { class: 'tl-label', dy: '0.35em' }, g, '∅');
      } else {
        s('circle', { r: 19, class: 'tl-shape' }, g);
        s('text', { class: 'tl-label', dy: '0.35em' }, g, n.val);
      }
      var b = s('g', { class: 'tl-badge', transform: n.isNull ? 'translate(0,24)' : 'translate(0,-31)' }, g);
      var br = s('rect', { y: -10, height: 20, rx: 10 }, b);
      var bt = s('text', { dy: '0.35em' }, b);
      if (self.opts.onClick && !n.isNull) {
        g.classList.add('tl-clickable');
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', 'Node ' + n.val);
        g.addEventListener('click', function () { self.opts.onClick(n); });
        g.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); self.opts.onClick(n); }
        });
      }
      self.nodes[n.id] = { n: n, g: g, badge: b, br: br, bt: bt, base: n.isNull ? 'tl-null' : 'tl-node' };
    });
  };

  TreeView.prototype.setState = function (id, cls) {
    var v = this.nodes[id];
    if (!v) return;
    v.g.setAttribute('class', v.base + (cls ? ' ' + cls : '') + (this.opts.onClick && !v.n.isNull ? ' tl-clickable' : ''));
  };

  TreeView.prototype.setBadge = function (id, text, cls) {
    var v = this.nodes[id];
    if (!v) return;
    if (text == null) { v.badge.style.display = 'none'; return; }
    v.badge.style.display = '';
    v.bt.textContent = text;
    var w = Math.max(22, text.length * 7.4 + 12);
    v.br.setAttribute('x', -w / 2);
    v.br.setAttribute('width', w);
    v.badge.setAttribute('class', 'tl-badge' + (cls ? ' ' + cls : ''));
  };

  TreeView.prototype.setEdge = function (childId, cls) {
    var e = this.edges[childId];
    if (!e) return;
    var n = this.nodes[childId] && this.nodes[childId].n;
    e.setAttribute('class', 'tl-edge' + (n && n.isNull ? ' tl-edge-null' : '') + (cls ? ' ' + cls : ''));
  };

  TreeView.prototype.clearOverlay = function () { this.gO.innerHTML = ''; };

  // Little "↑ 2" pill floating on the edge the value travels along.
  TreeView.prototype.pill = function (childId, text, cls) {
    var n = this.nodes[childId] && this.nodes[childId].n;
    if (!n || !n.parent) return;
    var a = this.L.pos[n.id], b = this.L.pos[n.parent.id];
    if (!a || !b) return;
    var x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    var g = s('g', { class: 'tl-pill ' + (cls || ''), transform: 'translate(' + x + ',' + y + ')' }, this.gO);
    var w = Math.max(28, text.length * 7.6 + 14);
    s('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 11 }, g);
    s('text', { dy: '0.35em' }, g, text);
  };

  // ----------------------------------------------------------------- Tracer
  //
  // Problems are plain recursive functions that report what they are doing
  // to a Tracer. The tracer snapshots the whole world (stack, values) at each
  // step so the UI can scrub forwards and backwards.

  function Tracer(record) {
    this.record = record !== false;
    this.steps = [];
    this.stack = [];
    this.vals = {};
    this.results = {};
    this.done = {};
    this.globals = {};
  }

  Tracer.prototype.top = function () { return this.stack[this.stack.length - 1]; };

  Tracer.prototype.call = function (node, sig, args) {
    this.stack.push({ node: node, sig: sig, args: args || {}, locals: {}, line: 1 });
  };

  Tracer.prototype.set = function (k, v) { this.top().locals[k] = v; };
  Tracer.prototype.mark = function (node, v) { this.vals[node.id] = v; };
  Tracer.prototype.global = function (k, v) { this.globals[k] = v; };

  Tracer.prototype.step = function (line, msg, kind, extra) {
    var top = this.top();
    if (top && line) top.line = line;
    if (!this.record) return;
    var parent = this.stack[this.stack.length - 2];
    var to = parent ? parent.node.val : 'the original caller';
    this.steps.push({
      line: line,
      msg: String(msg).replace(/\{to\}/g, to),
      kind: kind || 'line',
      activeId: top ? top.node.id : null,
      isNullStep: !!(top && top.node.isNull),
      ask: extra && extra.ask,
      stack: this.stack.map(function (f) {
        var o = {}, a = {}, k;
        for (k in f.locals) o[k] = f.locals[k];
        for (k in f.args) a[k] = f.args[k];
        return { id: f.node.id, sig: f.sig, locals: o, args: a, line: f.line, isNull: f.node.isNull };
      }),
      vals: Object.assign({}, this.vals),
      done: Object.assign({}, this.done),
      globals: Object.assign({}, this.globals)
    });
  };

  Tracer.prototype.ret = function (value, line, msg, kind) {
    this.step(line, msg, kind || 'return');
    if (this.record) this.steps[this.steps.length - 1].ret = { value: value };
    var f = this.stack.pop();
    this.done[f.node.id] = true;
    this.results[f.node.id] = value;
    return value;
  };

  // --------------------------------------------------------------- problems

  function num(n) { return Number(n.val); }

  var PROBLEMS = {};

  PROBLEMS.height = {
    name: 'Height',
    locals: ['left_h', 'right_h'],
    variants: [
      { id: 'edges', label: 'Count edges (empty = −1, leaf = 0)' },
      { id: 'nodes', label: 'Count nodes (empty = 0, leaf = 1)' }
    ],
    badge: function (v) { return 'h=' + fmt(v); },
    code: function (v) {
      return [
        'def height(node):',
        '    if node is None:',
        '        return ' + (v === 'nodes' ? '0 ' : '-1') + '        # empty tree',
        '    left_h = height(node.left)',
        '    right_h = height(node.right)',
        '    return 1 + max(left_h, right_h)'
      ];
    },
    run: function (t, n, v) {
      var base = v === 'nodes' ? 0 : -1;
      var plus = v === 'nodes' ? 'one for ' + n.val + ' itself' : 'one for the edge down to that child';
      t.call(n, 'height(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'height(∅): ' + n.parent.val + '’s ' + n.side + ' side is empty — but the call still happens.', 'call');
        t.step(2, 'Is node None? Yes! This is the base case — the only question we can answer without asking anyone.');
        return t.ret(base, 3, 'An empty tree has height ' + fmt(base) + ' by definition. Return ' + fmt(base) + ' to {to} immediately.', 'base');
      }
      t.step(1, 'height(' + n.val + ') starts. ' + n.val + ' has no idea how tall it is — and it won’t try to work it out alone.', 'call');
      t.step(2, 'Is ' + n.val + ' None? No. So ' + n.val + ' needs its children’s help.');
      t.step(4, n.val + ' asks its left child (' + lbl(n.left) + '): “how tall are you?” …then pauses on this line until the answer comes back.', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left, v);
      t.set('left_h', l);
      t.step(4, n.val + ' wakes up exactly where it paused. Left said ' + fmt(l) + ', so ' + n.val + ' writes left_h = ' + fmt(l) + ' on its own notepad (stack frame).', 'resume');
      t.step(5, 'Now ' + n.val + ' asks its right child (' + lbl(n.right) + ') the same question, and pauses again.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right, v);
      t.set('right_h', r);
      t.step(5, 'Right said ' + fmt(r) + '. ' + n.val + ' now has both answers: left_h = ' + fmt(l) + ', right_h = ' + fmt(r) + '.', 'resume');
      var res = 1 + Math.max(l, r);
      t.mark(n, res);
      return t.ret(res, 6, n.val + ': 1 + max(' + fmt(l) + ', ' + fmt(r) + ') = ' + fmt(res) + ' — the taller child, plus ' + plus + '. Hand ' + fmt(res) + ' back to {to}.');
    },
    explain: function (n, l, r, v) {
      var res = 1 + Math.max(l, r);
      return {
        answer: res,
        formula: '1 + max(' + fmt(l) + ', ' + fmt(r) + ') = ' + fmt(res),
        hint: 'Take the taller of your two children’s answers, then add 1 ' + (v === 'nodes' ? 'for yourself.' : 'for the edge from you down to that child.')
      };
    }
  };

  PROBLEMS.size = {
    name: 'Size (count nodes)',
    locals: ['left_n', 'right_n'],
    badge: function (v) { return 'n=' + fmt(v); },
    code: function () {
      return [
        'def size(node):',
        '    if node is None:',
        '        return 0',
        '    left_n = size(node.left)',
        '    right_n = size(node.right)',
        '    return 1 + left_n + right_n'
      ];
    },
    run: function (t, n) {
      t.call(n, 'size(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'size(∅) — an empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case.');
        return t.ret(0, 3, 'An empty tree has 0 nodes. Return 0 to {to}.', 'base');
      }
      t.step(1, 'size(' + n.val + ') starts.', 'call');
      t.step(2, 'None? No.');
      t.step(4, n.val + ' asks its left side: “how many nodes do you have?”', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left);
      t.set('left_n', l);
      t.step(4, 'Left side has ' + l + '. Noted: left_n = ' + l + '.', 'resume');
      t.step(5, n.val + ' asks its right side the same thing.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right);
      t.set('right_n', r);
      t.step(5, 'Right side has ' + r + '. Noted: right_n = ' + r + '.', 'resume');
      var res = 1 + l + r;
      t.mark(n, res);
      return t.ret(res, 6, n.val + ': 1 (me) + ' + l + ' + ' + r + ' = ' + res + '. Hand ' + res + ' back to {to}.');
    },
    explain: function (n, l, r) {
      return { answer: 1 + l + r, formula: '1 + ' + l + ' + ' + r + ' = ' + (1 + l + r), hint: 'Count yourself, plus everything on the left, plus everything on the right.' };
    }
  };

  PROBLEMS.sum = {
    name: 'Sum of values',
    numeric: true,
    locals: ['left_s', 'right_s'],
    badge: function (v) { return 'Σ=' + fmt(v); },
    code: function () {
      return [
        'def tree_sum(node):',
        '    if node is None:',
        '        return 0',
        '    left_s = tree_sum(node.left)',
        '    right_s = tree_sum(node.right)',
        '    return node.val + left_s + right_s'
      ];
    },
    run: function (t, n) {
      t.call(n, 'tree_sum(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'tree_sum(∅) — empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case.');
        return t.ret(0, 3, 'Nothing here, so the sum is 0. Return 0 to {to}.', 'base');
      }
      t.step(1, 'tree_sum(' + n.val + ') starts.', 'call');
      t.step(2, 'None? No.');
      t.step(4, 'Ask the left subtree for its total.', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left);
      t.set('left_s', l);
      t.step(4, 'Left total is ' + fmt(l) + '.', 'resume');
      t.step(5, 'Ask the right subtree for its total.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right);
      t.set('right_s', r);
      t.step(5, 'Right total is ' + fmt(r) + '.', 'resume');
      var res = num(n) + l + r;
      t.mark(n, res);
      return t.ret(res, 6, n.val + ' + ' + fmt(l) + ' + ' + fmt(r) + ' = ' + fmt(res) + '. Hand it back to {to}.');
    },
    explain: function (n, l, r) {
      var res = num(n) + l + r;
      return { answer: res, formula: n.val + ' + ' + fmt(l) + ' + ' + fmt(r) + ' = ' + fmt(res), hint: 'Your own value plus both subtree totals.' };
    }
  };

  PROBLEMS.max = {
    name: 'Maximum value',
    numeric: true,
    locals: ['left_m', 'right_m'],
    badge: function (v) { return 'max=' + fmt(v); },
    code: function () {
      return [
        'def tree_max(node):',
        '    if node is None:',
        '        return float("-inf")   # loses every max()',
        '    left_m = tree_max(node.left)',
        '    right_m = tree_max(node.right)',
        '    return max(node.val, left_m, right_m)'
      ];
    },
    run: function (t, n) {
      t.call(n, 'tree_max(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'tree_max(∅) — empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case.');
        return t.ret(-Infinity, 3, 'An empty tree has no max. We return −∞, a value that can never win a max(), so it can’t distort the answer. Return −∞ to {to}.', 'base');
      }
      t.step(1, 'tree_max(' + n.val + ') starts.', 'call');
      t.step(2, 'None? No.');
      t.step(4, 'Ask the left subtree for its biggest value.', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left);
      t.set('left_m', l);
      t.step(4, 'Left’s biggest is ' + fmt(l) + '.', 'resume');
      t.step(5, 'Ask the right subtree for its biggest value.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right);
      t.set('right_m', r);
      t.step(5, 'Right’s biggest is ' + fmt(r) + '.', 'resume');
      var res = Math.max(num(n), l, r);
      t.mark(n, res);
      return t.ret(res, 6, 'max(' + n.val + ', ' + fmt(l) + ', ' + fmt(r) + ') = ' + fmt(res) + '. Hand it back to {to}.');
    },
    explain: function (n, l, r) {
      var res = Math.max(num(n), l, r);
      return { answer: res, formula: 'max(' + n.val + ', ' + fmt(l) + ', ' + fmt(r) + ') = ' + fmt(res), hint: 'The biggest of: yourself, the left subtree’s max, the right subtree’s max.' };
    }
  };

  PROBLEMS.leaves = {
    name: 'Count leaves',
    locals: ['l', 'r'],
    badge: function (v) { return 'leaves=' + fmt(v); },
    code: function () {
      return [
        'def leaves(node):',
        '    if node is None:',
        '        return 0',
        '    if node.left is None and node.right is None:',
        '        return 1              # I am a leaf',
        '    l = leaves(node.left)',
        '    r = leaves(node.right)',
        '    return l + r'
      ];
    },
    run: function (t, n) {
      t.call(n, 'leaves(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'leaves(∅) — empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case #1.');
        return t.ret(0, 3, 'Nothing here means no leaves. Return 0 to {to}.', 'base');
      }
      t.step(1, 'leaves(' + n.val + ') starts.', 'call');
      t.step(2, 'None? No.');
      t.step(4, 'Does ' + n.val + ' have zero children? ' + (isLeaf(n) ? 'Yes!' : 'No.'));
      if (isLeaf(n)) {
        t.mark(n, 1);
        return t.ret(1, 5, n.val + ' is a leaf — base case #2. It answers 1 without asking anybody. Return 1 to {to}.', 'base');
      }
      t.step(6, 'Ask the left side how many leaves it has.', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left);
      t.set('l', l);
      t.step(6, 'Left has ' + l + '.', 'resume');
      t.step(7, 'Ask the right side.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right);
      t.set('r', r);
      t.step(7, 'Right has ' + r + '.', 'resume');
      var res = l + r;
      t.mark(n, res);
      return t.ret(res, 8, n.val + ' is not a leaf, so it doesn’t count itself: ' + l + ' + ' + r + ' = ' + res + '. Return to {to}.');
    },
    explain: function (n, l, r) {
      if (isLeaf(n)) return { answer: 1, formula: 'I have no children → I am a leaf → 1', hint: 'Do you have any children at all?' };
      return { answer: l + r, formula: l + ' + ' + r + ' = ' + (l + r), hint: 'You’re not a leaf, so don’t count yourself — just add up what your children found.' };
    }
  };

  PROBLEMS.depth = {
    name: 'Depth (top-down)',
    locals: [],
    badge: function (v) { return 'd=' + fmt(v); },
    code: function () {
      return [
        'def label_depth(node, depth):',
        '    if node is None:',
        '        return',
        '    node.depth = depth',
        '    label_depth(node.left, depth + 1)',
        '    label_depth(node.right, depth + 1)'
      ];
    },
    start: function (root) { return 'label_depth(' + root.val + ', 0)'; },
    run: function (t, n, v, depth) {
      depth = depth || 0;
      t.call(n, 'label_depth(' + lbl(n) + ', ' + depth + ')', { depth: depth });
      if (n.isNull) {
        t.step(1, 'label_depth(∅, ' + depth + ') — empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case.');
        return t.ret(undefined, 3, 'Nothing to label. Return (nothing) to {to}.', 'base');
      }
      t.step(1, n.val + ' is called with depth = ' + depth + '. It already KNOWS its depth — its parent handed it down as an argument.', 'call');
      t.step(2, 'None? No.');
      t.mark(n, depth);
      t.step(4, 'Write depth ' + depth + ' onto ' + n.val + ' right now, on the way DOWN — before visiting any child.');
      t.step(5, 'Go left, handing down depth + 1 = ' + (depth + 1) + '.', 'ask', { ask: n.left.id });
      this.run(t, n.left, v, depth + 1);
      t.step(5, 'Back from the left. Nothing came back — nothing needed to.', 'resume');
      t.step(6, 'Go right, handing down depth + 1 = ' + (depth + 1) + '.', 'ask', { ask: n.right.id });
      this.run(t, n.right, v, depth + 1);
      t.step(6, 'Back from the right.', 'resume');
      return t.ret(undefined, 6, n.val + ' is finished. It returns nothing: its number was settled before it ever looked at its children.');
    },
    final: function () { return 'Done! Notice every depth appeared on the way DOWN (when a node was first called), not on the way back up.'; }
  };

  PROBLEMS.minDepthBuggy = {
    name: 'Min depth — naive (buggy!)',
    locals: ['l', 'r'],
    badge: function (v) { return 'md=' + fmt(v); },
    code: function () {
      return [
        'def min_depth(node):      # ⚠ looks right, is wrong',
        '    if node is None:',
        '        return 0',
        '    l = min_depth(node.left)',
        '    r = min_depth(node.right)',
        '    return 1 + min(l, r)'
      ];
    },
    run: function (t, n) {
      t.call(n, 'min_depth(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'min_depth(∅) — empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case.');
        return t.ret(0, 3, 'Return 0 to {to}.', 'base');
      }
      t.step(1, 'min_depth(' + n.val + ') starts.', 'call');
      t.step(2, 'None? No.');
      t.step(4, 'Ask the left side.', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left);
      t.set('l', l);
      t.step(4, 'Left said ' + l + '.', 'resume');
      t.step(5, 'Ask the right side.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right);
      t.set('r', r);
      t.step(5, 'Right said ' + r + '.', 'resume');
      var res = 1 + Math.min(l, r);
      t.mark(n, res);
      var oneSided = n.left.isNull !== n.right.isNull;
      if (oneSided) {
        return t.ret(res, 6, '⚠ BUG: 1 + min(' + l + ', ' + r + ') = ' + res + '. min() grabbed the 0 from the EMPTY side — but an empty side is not a path to a leaf! ' + n.val + ' is not a leaf, yet it now claims a leaf is ' + (res - 1) + ' step(s) away.', 'warn');
      }
      return t.ret(res, 6, '1 + min(' + l + ', ' + r + ') = ' + res + '. Return to {to}.');
    },
    final: function (res, root) {
      var real = PROBLEMS.minDepth.compute(root);
      return res === real
        ? 'Returned ' + res + ' — correct for THIS tree, by luck. Try a lopsided tree like [A,B] or the “Linked list” preset to see it break.'
        : 'Returned ' + res + ', but the real minimum depth is ' + real + '. The bug fires whenever a node has exactly one child.';
    }
  };

  PROBLEMS.minDepth = {
    name: 'Min depth — correct',
    locals: ['l', 'r'],
    badge: function (v) { return 'md=' + fmt(v); },
    code: function () {
      return [
        'def min_depth(node):',
        '    if node is None:',
        '        return 0',
        '    l = min_depth(node.left)',
        '    r = min_depth(node.right)',
        '    if node.left is None:      # only a right side',
        '        return 1 + r',
        '    if node.right is None:     # only a left side',
        '        return 1 + l',
        '    return 1 + min(l, r)'
      ];
    },
    compute: function (n) {
      if (n.isNull) return 0;
      var l = this.compute(n.left), r = this.compute(n.right);
      if (n.left.isNull) return 1 + r;
      if (n.right.isNull) return 1 + l;
      return 1 + Math.min(l, r);
    },
    run: function (t, n) {
      t.call(n, 'min_depth(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(1, 'min_depth(∅) — empty spot under ' + n.parent.val + '.', 'call');
        t.step(2, 'None? Yes — base case.');
        return t.ret(0, 3, 'Return 0 to {to}.', 'base');
      }
      t.step(1, 'min_depth(' + n.val + ') starts.', 'call');
      t.step(2, 'None? No.');
      t.step(4, 'Ask the left side.', 'ask', { ask: n.left.id });
      var l = this.run(t, n.left);
      t.set('l', l);
      t.step(4, 'Left said ' + l + '.', 'resume');
      t.step(5, 'Ask the right side.', 'ask', { ask: n.right.id });
      var r = this.run(t, n.right);
      t.set('r', r);
      t.step(5, 'Right said ' + r + '.', 'resume');
      var res;
      t.step(6, 'Is the left side empty? ' + (n.left.isNull ? 'Yes.' : 'No.'));
      if (n.left.isNull) {
        res = 1 + r; t.mark(n, res);
        return t.ret(res, 7, 'Left is empty, so it is NOT an option — the nearest leaf must be on the right: 1 + ' + r + ' = ' + res + '.');
      }
      t.step(8, 'Is the right side empty? ' + (n.right.isNull ? 'Yes.' : 'No.'));
      if (n.right.isNull) {
        res = 1 + l; t.mark(n, res);
        return t.ret(res, 9, 'Right is empty, so ignore it: 1 + ' + l + ' = ' + res + '.');
      }
      res = 1 + Math.min(l, r); t.mark(n, res);
      return t.ret(res, 10, 'Both sides are real, so the closer one wins: 1 + min(' + l + ', ' + r + ') = ' + res + '. Return to {to}.');
    }
  };

  PROBLEMS.diameter = {
    name: 'Diameter (height in disguise)',
    locals: ['left_h', 'right_h'],
    badge: function (v) { return 'h=' + fmt(v); },
    code: function () {
      return [
        'def diameter(root):',
        '    best = 0',
        '    def height(node):',
        '        nonlocal best',
        '        if node is None:',
        '            return -1',
        '        left_h = height(node.left)',
        '        right_h = height(node.right)',
        '        best = max(best, left_h + right_h + 2)',
        '        return 1 + max(left_h, right_h)',
        '    height(root)',
        '    return best'
      ];
    },
    run: function (t, root) {
      t.global('best', 0);
      t.step(2, 'best = 0. It lives OUTSIDE height(), so every call can read and update it.', 'call');
      t.step(11, 'Kick off height(' + root.val + '). We’ll ignore what it returns — the real answer is collected in best along the way.');
      var hr = this.h(t, root);
      t.step(11, 'height(' + root.val + ') returned ' + hr + '. Every node has proposed “the longest path that bends at me”.', 'resume');
      t.step(12, 'Return best = ' + t.globals.best + '.');
      return t.globals.best;
    },
    h: function (t, n) {
      t.call(n, 'height(' + lbl(n) + ')');
      if (n.isNull) {
        t.step(3, 'height(∅) under ' + n.parent.val + '.', 'call');
        t.step(5, 'None? Yes — base case.');
        return t.ret(-1, 6, 'Empty tree: height −1. Return to {to}.', 'base');
      }
      t.step(3, 'height(' + n.val + ') starts — exactly the height function from before.', 'call');
      t.step(5, 'None? No.');
      t.step(7, 'Ask left for its height.', 'ask', { ask: n.left.id });
      var l = this.h(t, n.left);
      t.set('left_h', l);
      t.step(7, 'left_h = ' + fmt(l) + '.', 'resume');
      t.step(8, 'Ask right for its height.', 'ask', { ask: n.right.id });
      var r = this.h(t, n.right);
      t.set('right_h', r);
      t.step(8, 'right_h = ' + fmt(r) + '.', 'resume');
      var through = l + r + 2, old = t.globals.best;
      if (through > old) t.global('best', through);
      t.step(9, 'Longest path that bends at ' + n.val + ': (' + fmt(l) + '+1) edges down-left + (' + fmt(r) + '+1) edges down-right = ' + through + '. ' +
        (through > old ? 'New record — best = ' + through + '!' : 'Not better than ' + old + '; best stays.'));
      var res = 1 + Math.max(l, r);
      t.mark(n, res);
      return t.ret(res, 10, 'Return my height, 1 + max(' + fmt(l) + ', ' + fmt(r) + ') = ' + res + ', so {to} can do the same trick.');
    },
    final: function (res) { return 'Done! diameter = ' + res + '. It’s just height() with one extra line that peeks at left_h + right_h + 2 at every node.'; }
  };

  // ----------------------------------------------------------------- presets

  var PRESETS = [
    { label: 'Small (5 nodes)', tree: '[A,B,C,D,E]' },
    { label: 'Lopsided', tree: '[A,B,C,D,E,null,null,null,null,F]' },
    { label: 'Full (7 nodes)', tree: '[A,B,C,D,E,F,G]' },
    { label: 'Linked list (skewed)', tree: '[A,B,null,C,null,D]' },
    { label: 'One child only', tree: '[A,B]' },
    { label: 'Single node', tree: '[A]' }
  ];
  var NUM_PRESETS = [
    { label: 'Small (5 nodes)', tree: '[5,3,8,1,4]' },
    { label: 'Lopsided', tree: '[7,2,9,1,6,null,null,null,null,4]' },
    { label: 'Full (7 nodes)', tree: '[4,2,6,1,3,5,7]' },
    { label: 'Linked list (skewed)', tree: '[1,2,null,3,null,4]' },
    { label: 'Single node', tree: '[42]' }
  ];

  var KIND_LABEL = {
    call: 'CALL', ask: 'ASK', resume: 'RESUME', base: 'BASE CASE', 'return': 'RETURN', warn: 'BUG', end: 'DONE', line: 'CHECK'
  };

  function highlightPy(line) {
    var code = line, comment = '';
    var hash = line.indexOf('#');
    if (hash >= 0) { code = line.slice(0, hash); comment = line.slice(hash); }
    var out = esc(code)
      .replace(/\b(def|if|return|is|and|not|None|nonlocal|float)\b/g, '<span class="tl-kw">$1</span>')
      .replace(/\b(max|min)\b/g, '<span class="tl-fn">$1</span>')
      .replace(/(-?\b\d+\b)/g, '<span class="tl-num">$1</span>');
    return out + (comment ? '<span class="tl-cm">' + esc(comment) + '</span>' : '');
  }

  // ---------------------------------------------------------------- TreeLab

  function TreeLab(host) {
    this.host = host;
    var d = host.dataset;
    this.problemIds = (d.problems || d.problem || 'height').split(',').map(function (x) { return x.trim(); })
      .filter(function (x) { return PROBLEMS[x]; });
    if (!this.problemIds.length) this.problemIds = ['height'];
    this.pid = this.problemIds[0];
    this.variant = d.variant || null;
    this.showNull = d.showNull !== 'false';
    this.treeText = d.tree || (PROBLEMS[this.pid].numeric ? NUM_PRESETS[0].tree : PRESETS[0].tree);
    this.speed = 3;
    this.timer = null;
    this.buildUI();
    this.load();
  }

  TreeLab.prototype.problem = function () { return PROBLEMS[this.pid]; };

  TreeLab.prototype.buildUI = function () {
    var self = this;
    var host = this.host;
    host.innerHTML = '';
    host.classList.add('tl');
    host.setAttribute('tabindex', '0');

    var bar = h('div', { class: 'tl-toolbar' }, host);

    if (this.problemIds.length > 1) {
      var pl = h('label', { class: 'tl-field' }, bar);
      h('span', null, pl, 'Problem');
      this.pSel = h('select', null, pl);
      this.problemIds.forEach(function (id) { h('option', { value: id }, self.pSel, PROBLEMS[id].name); });
      this.pSel.addEventListener('change', function () {
        self.pid = self.pSel.value;
        self.variant = null;
        if (self.problem().numeric && !allNumeric(parseTree(self.treeText))) self.treeText = NUM_PRESETS[0].tree;
        self.refreshPresets();
        self.load();
      });
    }

    var vl = h('label', { class: 'tl-field' }, bar);
    h('span', null, vl, 'Convention');
    this.vSel = h('select', null, vl);
    this.vWrap = vl;
    this.vSel.addEventListener('change', function () { self.variant = self.vSel.value; self.load(); });

    var tl = h('label', { class: 'tl-field' }, bar);
    h('span', null, tl, 'Tree');
    this.presetSel = h('select', null, tl);
    this.presetSel.addEventListener('change', function () {
      if (self.presetSel.value === '__random') self.treeText = randomTree(self.problem().numeric);
      else if (self.presetSel.value) self.treeText = self.presetSel.value;
      self.load();
    });

    var il = h('label', { class: 'tl-field tl-grow' }, bar);
    h('span', null, il, 'Level order');
    this.input = h('input', { type: 'text', spellcheck: 'false', 'aria-label': 'Tree in level order' }, il);
    this.input.addEventListener('keydown', function (ev) {
      ev.stopPropagation();
      if (ev.key === 'Enter') { self.treeText = self.input.value; self.load(); }
    });
    var go = h('button', { class: 'tl-btn', type: 'button' }, bar, 'Load');
    go.addEventListener('click', function () { self.treeText = self.input.value; self.load(); });

    var nl = h('label', { class: 'tl-check' }, bar);
    this.nullBox = h('input', { type: 'checkbox' }, nl);
    this.nullBox.checked = this.showNull;
    h('span', null, nl, 'Show ∅ calls');
    this.nullBox.addEventListener('change', function () { self.showNull = self.nullBox.checked; self.load(true); });

    this.err = h('div', { class: 'tl-error', role: 'alert' }, host);

    this.treeBox = h('div', { class: 'tl-tree' }, host);

    this.legend = h('div', { class: 'tl-legend', html:
      '<span><i class="lg lg-active"></i>running now</span>' +
      '<span><i class="lg lg-waiting"></i>paused, waiting for a child</span>' +
      '<span><i class="lg lg-done"></i>finished (answer known)</span>' +
      '<span><i class="lg lg-idle"></i>not called yet</span>' }, host);

    this.narr = h('div', { class: 'tl-narr', 'aria-live': 'polite' }, host);

    var ctr = h('div', { class: 'tl-controls' }, host);
    function btn(txt, title, fn) {
      var b = h('button', { class: 'tl-btn', type: 'button', title: title, 'aria-label': title }, ctr, txt);
      b.addEventListener('click', fn);
      return b;
    }
    btn('⏮', 'Restart', function () { self.pause(); self.goto(0); });
    btn('◀', 'Step back (←)', function () { self.pause(); self.goto(self.i - 1); });
    this.playBtn = btn('▶ Play', 'Play / pause (space)', function () { self.toggle(); });
    this.playBtn.classList.add('tl-primary');
    btn('▶|', 'Step forward (→)', function () { self.pause(); self.goto(self.i + 1); });
    btn('⏭', 'Jump to the end', function () { self.pause(); self.goto(self.steps.length - 1); });
    this.counter = h('span', { class: 'tl-counter' }, ctr);
    var sl = h('label', { class: 'tl-speed' }, ctr);
    h('span', null, sl, 'Speed');
    var range = h('input', { type: 'range', min: '1', max: '5', value: String(this.speed), 'aria-label': 'Playback speed' }, sl);
    range.addEventListener('input', function () { self.speed = Number(range.value); if (self.timer) { self.pause(); self.play(); } });
    this.scrub = h('input', { type: 'range', class: 'tl-scrub', min: '0', max: '0', value: '0', 'aria-label': 'Scrub through steps' }, host);
    this.scrub.addEventListener('input', function () { self.pause(); self.goto(Number(self.scrub.value)); });

    var panes = h('div', { class: 'tl-panes' }, host);
    var cp = h('div', { class: 'tl-pane' }, panes);
    h('div', { class: 'tl-pane-title' }, cp, 'Code');
    this.codeBox = h('div', { class: 'tl-code' }, cp);
    var sp = h('div', { class: 'tl-pane' }, panes);
    h('div', { class: 'tl-pane-title' }, sp, 'Call stack — each call has its own notepad');
    this.globalsBox = h('div', { class: 'tl-globals' }, sp);
    this.stackBox = h('div', { class: 'tl-stack' }, sp);

    host.addEventListener('keydown', function (ev) {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
      if (ev.key === 'ArrowRight') { ev.preventDefault(); self.pause(); self.goto(self.i + 1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); self.pause(); self.goto(self.i - 1); }
      else if (ev.key === ' ') { ev.preventDefault(); self.toggle(); }
    });

    this.refreshPresets();
  };

  TreeLab.prototype.refreshPresets = function () {
    var self = this;
    var list = this.problem().numeric ? NUM_PRESETS : PRESETS;
    this.presetSel.innerHTML = '';
    h('option', { value: '' }, this.presetSel, 'Presets…');
    list.forEach(function (p) { h('option', { value: p.tree }, self.presetSel, p.label); });
    h('option', { value: '__random' }, this.presetSel, '🎲 Random tree');
  };

  TreeLab.prototype.load = function (keepStep) {
    var P = this.problem();
    var prevI = this.i || 0;
    this.pause();
    this.err.textContent = '';
    var root;
    try {
      root = parseTree(this.treeText);
      if (P.numeric && !allNumeric(root)) throw new Error('“' + P.name + '” needs numeric node values, e.g. [5,3,8].');
    } catch (e) {
      this.err.textContent = e.message;
      return;
    }
    this.root = root;
    this.input.value = serialize(root);
    this.presetSel.value = '';

    // variant selector
    this.vWrap.style.display = P.variants ? '' : 'none';
    if (P.variants) {
      if (!this.variant) this.variant = P.variants[0].id;
      var self = this;
      this.vSel.innerHTML = '';
      P.variants.forEach(function (v) { h('option', { value: v.id }, self.vSel, v.label); });
      this.vSel.value = this.variant;
    }

    // trace
    var t = new Tracer(true);
    var start = P.start ? P.start(root) : (this.codeName() + '(' + root.val + ')');
    t.step(null, 'About to call ' + start + '. Press ▶| to step, or ▶ Play. Watch the tree, the highlighted code line and the call stack together.', 'line');
    var result = P.run(t, root, this.variant);
    t.step(null, P.final ? P.final(result, root, this.variant) : 'Done! ' + start + ' = ' + fmt(result) + '.', 'end');
    this.results = t.results;
    var steps = t.steps;
    if (!this.showNull) steps = steps.filter(function (st) { return !st.isNullStep; });
    this.steps = steps;
    this.code = P.code(this.variant);
    this.renderCode();

    this.view = new TreeView(this.treeBox, root, { showNull: this.showNull });
    this.scrub.max = String(steps.length - 1);
    this.goto(keepStep ? Math.min(prevI, steps.length - 1) : 0);
  };

  TreeLab.prototype.codeName = function () {
    var first = this.problem().code(this.variant)[0];
    var m = /def\s+(\w+)/.exec(first);
    return m ? m[1] : 'f';
  };

  TreeLab.prototype.renderCode = function () {
    var box = this.codeBox;
    box.innerHTML = '';
    this.codeLines = this.code.map(function (line, i) {
      var row = h('div', { class: 'tl-line' }, box);
      h('span', { class: 'tl-ln' }, row, String(i + 1));
      h('code', { html: highlightPy(line) }, row);
      return row;
    });
  };

  TreeLab.prototype.goto = function (i) {
    if (!this.steps) return;
    i = Math.max(0, Math.min(this.steps.length - 1, i));
    this.i = i;
    this.render(this.steps[i]);
  };

  TreeLab.prototype.render = function (st) {
    var P = this.problem();
    var view = this.view;
    var onStack = {};
    st.stack.forEach(function (f) { onStack[f.id] = true; });

    for (var id in view.nodes) {
      var cls = 'tl-idle';
      if (id === st.activeId) cls = 'tl-active';
      else if (onStack[id]) cls = 'tl-waiting';
      else if (st.done[id]) cls = 'tl-done';
      view.setState(id, cls);
      var v = view.nodes[id].n;
      if (st.vals[id] !== undefined) view.setBadge(id, P.badge(st.vals[id]));
      else if (v.isNull && st.done[id] && this.results[id] !== undefined) view.setBadge(id, fmt(this.results[id]), 'tl-badge-null');
      else view.setBadge(id, null);
      view.setEdge(id, onStack[id] ? 'tl-edge-path' : '');
    }
    view.clearOverlay();
    if (st.ask) {
      view.setEdge(st.ask, 'tl-edge-ask');
      view.pill(st.ask, '↓ ?', 'tl-pill-ask');
    }
    if (st.kind === 'call' && st.activeId) view.setEdge(st.activeId, 'tl-edge-ask');
    if (st.ret && st.activeId) {
      view.setEdge(st.activeId, 'tl-edge-ret');
      view.pill(st.activeId, st.ret.value === undefined ? '↑ done' : '↑ ' + fmt(st.ret.value), st.kind === 'warn' ? 'tl-pill-warn' : 'tl-pill-ret');
    }

    // code highlight
    this.codeLines.forEach(function (row, i) { row.classList.toggle('tl-cur', st.line === i + 1); });

    // stack
    this.globalsBox.innerHTML = '';
    var gk = Object.keys(st.globals);
    if (gk.length) {
      this.globalsBox.innerHTML = 'Shared (outside the recursion): ' + gk.map(function (k) {
        return '<b>' + esc(k) + ' = ' + esc(fmt(st.globals[k])) + '</b>';
      }).join(', ');
    }
    var box = this.stackBox;
    box.innerHTML = '';
    if (!st.stack.length) {
      h('div', { class: 'tl-stack-empty' }, box, st.kind === 'end' ? 'Stack is empty — every call has returned.' : 'Stack is empty — nothing is running yet.');
    }
    var locals = P.locals || [];
    for (var k = st.stack.length - 1; k >= 0; k--) {
      var f = st.stack[k];
      var isTop = k === st.stack.length - 1;
      var fr = h('div', { class: 'tl-frame' + (isTop ? ' tl-frame-top' : '') + (f.isNull ? ' tl-frame-null' : '') }, box);
      var head = h('div', { class: 'tl-frame-head' }, fr);
      h('code', null, head, f.sig);
      h('span', { class: 'tl-frame-status' }, head, isTop ? '▶ running · line ' + (f.line || '—') : 'paused at line ' + f.line);
      if (!f.isNull && locals.length) {
        var vars = h('div', { class: 'tl-frame-vars' }, fr);
        locals.forEach(function (name) {
          var has = f.locals[name] !== undefined;
          h('span', { class: has ? 'tl-var' : 'tl-var tl-var-unset' }, vars, name + ' = ' + (has ? fmt(f.locals[name]) : '?'));
        });
      }
    }
    if (st.stack.length > 1) h('div', { class: 'tl-stack-bottom' }, box, '↑ bottom of the stack: the very first call');

    // narration
    this.narr.className = 'tl-narr tl-narr-' + st.kind;
    this.narr.innerHTML = '<span class="tl-tag">' + (KIND_LABEL[st.kind] || '') + '</span>' + esc(st.msg);

    this.counter.textContent = 'Step ' + (this.i + 1) + ' / ' + this.steps.length;
    this.scrub.value = String(this.i);
    this.playBtn.textContent = this.timer ? '⏸ Pause' : (this.i >= this.steps.length - 1 ? '↻ Replay' : '▶ Play');
  };

  TreeLab.prototype.play = function () {
    var self = this;
    if (this.i >= this.steps.length - 1) this.goto(0);
    var delay = [1600, 1000, 600, 320, 140][this.speed - 1];
    this.timer = setInterval(function () {
      if (self.i >= self.steps.length - 1) { self.pause(); return; }
      self.goto(self.i + 1);
    }, delay);
    this.render(this.steps[this.i]);
  };

  TreeLab.prototype.pause = function () {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.steps && this.steps[this.i]) this.render(this.steps[this.i]);
  };

  TreeLab.prototype.toggle = function () { if (this.timer) this.pause(); else this.play(); };

  // ---------------------------------------------------------------- TreeAsk
  // "Leap of faith" trainer: you are one node; you only get your children's
  // answers, and must produce yours.

  function TreeAsk(host) {
    var self = this;
    var d = host.dataset;
    this.host = host;
    this.pid = PROBLEMS[d.problem] && PROBLEMS[d.problem].explain ? d.problem : 'height';
    this.variant = d.variant || (PROBLEMS[this.pid].variants ? PROBLEMS[this.pid].variants[0].id : null);
    host.classList.add('tl', 'tl-ask');
    host.innerHTML = '';
    try { this.root = parseTree(d.tree || '[A,B,C,D,E,null,F,null,null,G]'); }
    catch (e) { h('div', { class: 'tl-error' }, host, e.message); return; }
    var P = PROBLEMS[this.pid];
    var t = new Tracer(false);
    P.run(t, this.root, this.variant);
    this.results = t.results;
    this.score = 0; this.tries = 0;

    var top = h('div', { class: 'tl-ask-top' }, host);
    h('div', { class: 'tl-ask-instr', html: '<b>Click any node and pretend you <em>are</em> that node.</b> You can’t see inside your subtrees — you only hear what your two children report back. What do you return?' }, top);
    var rb = h('button', { class: 'tl-btn', type: 'button' }, top, '🎲 Pick one for me');
    rb.addEventListener('click', function () {
      var list = [];
      walk(self.root, function (n) { if (!n.isNull && n !== self.sel) list.push(n); });
      self.select(list[Math.floor(Math.random() * list.length)]);
    });

    this.treeBox = h('div', { class: 'tl-tree' }, host);
    this.view = new TreeView(this.treeBox, this.root, { showNull: true, onClick: function (n) { self.select(n); } });
    this.panel = h('div', { class: 'tl-ask-panel' }, host);
    this.panel.innerHTML = '<p class="tl-muted">No node selected yet.</p>';
    this.scoreBox = h('div', { class: 'tl-ask-score' }, host);
    this.clear();
  }

  TreeAsk.prototype.clear = function () {
    var v = this.view;
    for (var id in v.nodes) { v.setState(id, ''); v.setBadge(id, null); v.setEdge(id, ''); }
  };

  TreeAsk.prototype.select = function (n) {
    var self = this;
    var P = PROBLEMS[this.pid];
    var v = this.view;
    this.sel = n;
    this.clear();
    for (var id in v.nodes) { v.setState(id, 'tl-faded'); v.setEdge(id, 'tl-edge-faded'); }
    v.setState(n.id, 'tl-me');
    var paint = function (sub, cls) { walk(sub, function (m) { v.setState(m.id, cls); v.setEdge(m.id, cls === 'tl-sub-l' ? 'tl-edge-l' : 'tl-edge-r'); }); };
    paint(n.left, 'tl-sub-l');
    paint(n.right, 'tl-sub-r');

    var l = this.results[n.left.id], r = this.results[n.right.id];
    var leafShortcut = this.pid === 'leaves' && isLeaf(n);
    if (!leafShortcut) {
      v.setBadge(n.left.id, 'says ' + fmt(l), 'tl-badge-l');
      v.setBadge(n.right.id, 'says ' + fmt(r), 'tl-badge-r');
    }
    var ex = P.explain(n, l, r, this.variant);
    this.ex = ex;

    var who = function (c) { return c.isNull ? 'an empty spot (∅)' : 'child ' + c.val; };
    var p = this.panel;
    p.innerHTML = '';
    h('p', { html: 'You are <b class="tl-me-text">' + esc(n.val) + '</b>' + (this.pid === 'sum' || this.pid === 'max' ? ' (your value is ' + esc(n.val) + ')' : '') + '.' }, p);
    if (leafShortcut) {
      h('p', { html: 'Both your children are empty. You don’t need to ask anyone anything.' }, p);
    } else {
      h('p', { html: '<span class="tl-l">Left</span> — ' + esc(who(n.left)) + ' — reports <b>' + esc(fmt(l)) + '</b>.<br>' +
        '<span class="tl-r">Right</span> — ' + esc(who(n.right)) + ' — reports <b>' + esc(fmt(r)) + '</b>.' }, p);
      h('p', { class: 'tl-muted', html: 'You don’t know <em>how</em> they got those numbers. You don’t need to. Trust them.' }, p);
    }
    var row = h('div', { class: 'tl-ask-row' }, p);
    var lab = h('label', null, row);
    h('span', null, lab, 'I return: ');
    var inp = h('input', { type: 'text', inputmode: 'numeric', size: '5', 'aria-label': 'Your answer' }, lab);
    var check = h('button', { class: 'tl-btn tl-primary', type: 'button' }, row, 'Check');
    var hint = h('button', { class: 'tl-btn', type: 'button' }, row, 'Hint');
    var show = h('button', { class: 'tl-btn', type: 'button' }, row, 'Show me');
    var fb = h('div', { class: 'tl-ask-fb', 'aria-live': 'polite' }, p);
    var answered = false;
    function reveal(ok) {
      fb.className = 'tl-ask-fb ' + (ok ? 'tl-ok' : 'tl-reveal');
      fb.innerHTML = (ok ? '✓ Yes! ' : '') + '<code>' + esc(ex.formula) + '</code>. ' +
        'Notice you never looked below your children. That’s the whole trick.';
      v.setBadge(n.id, P.badge(ex.answer));
    }
    function doCheck() {
      var raw = inp.value.trim().replace('−', '-').toLowerCase();
      if (!raw) return;
      var val = /^-?inf/.test(raw) ? (raw.charAt(0) === '-' ? -Infinity : Infinity) : Number(raw);
      var ok = val === ex.answer;
      if (!answered) { self.tries++; if (ok) self.score++; answered = true; self.updateScore(); }
      if (ok) reveal(true);
      else { fb.className = 'tl-ask-fb tl-bad'; fb.textContent = '✗ Not quite. ' + ex.hint; }
    }
    check.addEventListener('click', doCheck);
    inp.addEventListener('keydown', function (ev) { ev.stopPropagation(); if (ev.key === 'Enter') doCheck(); });
    hint.addEventListener('click', function () { fb.className = 'tl-ask-fb tl-hint'; fb.textContent = '💡 ' + ex.hint; });
    show.addEventListener('click', function () { answered = true; reveal(false); });
    inp.focus({ preventScroll: true });
  };

  TreeAsk.prototype.updateScore = function () {
    this.scoreBox.textContent = 'Score: ' + this.score + ' / ' + this.tries + (this.score >= 5 && this.score === this.tries ? ' — you’ve got the leap of faith 🎉' : '');
  };

  // ------------------------------------------------------------ TreeMeasure
  // Depth = count edges UP to the root. Height = count edges DOWN to the
  // deepest leaf. Click to see both paths at once.

  function TreeMeasure(host) {
    var self = this;
    this.host = host;
    host.classList.add('tl', 'tl-measure');
    host.innerHTML = '';
    try { this.root = parseTree(host.dataset.tree || '[A,B,C,D,E,null,F,null,null,G]'); }
    catch (e) { h('div', { class: 'tl-error' }, host, e.message); return; }
    var top = h('div', { class: 'tl-ask-top' }, host);
    h('div', { class: 'tl-ask-instr', html: 'Click a node. <span class="tl-up">Depth</span> looks <b>up</b> to the root. <span class="tl-down">Height</span> looks <b>down</b> to the farthest leaf.' }, top);
    var btns = h('div', { class: 'tl-btn-row' }, top);
    var bd = h('button', { class: 'tl-btn', type: 'button' }, btns, 'Label all depths');
    var bh = h('button', { class: 'tl-btn', type: 'button' }, btns, 'Label all heights');
    bd.addEventListener('click', function () { self.labelAll('d'); });
    bh.addEventListener('click', function () { self.labelAll('h'); });
    this.treeBox = h('div', { class: 'tl-tree' }, host);
    this.view = new TreeView(this.treeBox, this.root, { showNull: false, onClick: function (n) { self.select(n); } });
    this.panel = h('div', { class: 'tl-ask-panel' }, host);
    this.panel.innerHTML = '<p class="tl-muted">Click a node to measure it.</p>';
  }

  TreeMeasure.prototype.reset = function () {
    var v = this.view;
    for (var id in v.nodes) { v.setState(id, ''); v.setBadge(id, null); v.setEdge(id, ''); }
  };

  TreeMeasure.prototype.labelAll = function (which) {
    var v = this.view;
    this.reset();
    walk(this.root, function (n) {
      if (n.isNull) return;
      v.setBadge(n.id, which === 'd' ? 'd=' + depthOf(n) : 'h=' + heightOf(n), which === 'd' ? 'tl-badge-up' : 'tl-badge-down');
    });
    this.panel.innerHTML = which === 'd'
      ? '<p><span class="tl-up">Depths</span> grow as you go <b>down</b>: the root is 0, its children 1, and so on. A node’s depth is decided by its <em>ancestors</em> — so it is natural to compute it on the way down, passing <code>depth + 1</code> to each child.</p>'
      : '<p><span class="tl-down">Heights</span> grow as you go <b>up</b>: every leaf is 0, and each parent is 1 + its taller child. A node’s height is decided by its <em>descendants</em> — so it is natural to compute it on the way back up, from the answers children return.</p>';
  };

  TreeMeasure.prototype.select = function (n) {
    var v = this.view;
    this.reset();
    for (var id in v.nodes) { v.setState(id, 'tl-faded'); v.setEdge(id, 'tl-edge-faded'); }
    // path up
    var m = n, d = 0;
    v.setState(n.id, 'tl-me');
    while (m.parent) { v.setEdge(m.id, 'tl-edge-up'); m = m.parent; v.setState(m.id, 'tl-on-up'); d++; }
    // longest path down
    var c = n, hgt = heightOf(n);
    var downIds = [];
    while (!isLeaf(c)) {
      var next = heightOf(c.left) >= heightOf(c.right) ? c.left : c.right;
      v.setEdge(next.id, 'tl-edge-down');
      v.setState(next.id, 'tl-on-down');
      downIds.push(next.val);
      c = next;
    }
    v.setState(n.id, 'tl-me');
    v.setBadge(n.id, 'd=' + d + ' · h=' + hgt);
    this.panel.innerHTML =
      '<p><b class="tl-me-text">' + esc(n.val) + '</b>: ' +
      '<span class="tl-up">depth = ' + d + '</span> (' + (d ? d + ' edge' + (d > 1 ? 's' : '') + ' up to the root ' + esc(this.root.val) : 'it <em>is</em> the root') + '), ' +
      '<span class="tl-down">height = ' + hgt + '</span> (' + (hgt ? 'longest way down: ' + esc([n.val].concat(downIds).join(' → ')) : 'it’s a leaf — nothing below it') + ').</p>' +
      '<p class="tl-muted">Depth only depends on what’s <b>above</b> ' + esc(n.val) + '. Height only depends on what’s <b>below</b> it. That single fact decides which direction the recursion carries the number.</p>';
  };

  // ------------------------------------------------------------------- init

  function init() {
    document.querySelectorAll('.tree-lab:not([data-tl-ready])').forEach(function (el) {
      el.setAttribute('data-tl-ready', '');
      try { new TreeLab(el); } catch (e) { el.textContent = 'Demo failed to load: ' + e.message; console.error(e); }
    });
    document.querySelectorAll('.tree-ask:not([data-tl-ready])').forEach(function (el) {
      el.setAttribute('data-tl-ready', '');
      try { new TreeAsk(el); } catch (e) { el.textContent = 'Demo failed to load: ' + e.message; console.error(e); }
    });
    document.querySelectorAll('.tree-measure:not([data-tl-ready])').forEach(function (el) {
      el.setAttribute('data-tl-ready', '');
      try { new TreeMeasure(el); } catch (e) { el.textContent = 'Demo failed to load: ' + e.message; console.error(e); }
    });
  }

  // Exposed for other chapters' scripts and for debugging in the console.
  window.TreeLabLib = { PROBLEMS: PROBLEMS, parseTree: parseTree, Tracer: Tracer, TreeView: TreeView, init: init };

  if (window.document$ && typeof window.document$.subscribe === 'function') window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
