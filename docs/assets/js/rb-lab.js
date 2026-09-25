/*
 * rb-lab.js — red-black tree insert visualizer for the DSA Bible.
 *
 *   <div class="rb-lab" data-insert="10,20,30"></div>
 *
 * Insert values and step through fix_insert: the code line, the roles
 * (cur / parent / grandparent / uncle), the three rules, and rotations
 * animating in place. data-insert pre-inserts values; the lab opens on
 * the first step of the LAST insert.
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var COL = 50, ROW = 70, PAD = 34;

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
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function esc(x) {
    return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  // ------------------------------------------------------------ the tree

  function RBTree() { this.root = null; }

  RBTree.prototype.rotateLeft = function (x) {
    var y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  };

  RBTree.prototype.rotateRight = function (x) {
    var y = x.left;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  };

  function snap(n) { return n ? { v: n.v, c: n.c, l: snap(n.left), r: snap(n.right) } : null; }

  // Check the rules on a snapshot. Returns which ones hold + the red-red edges.
  function check(root) {
    var redRed = [], bhOk = true;
    (function bh(n, parentRed) {
      if (!n) return 1;
      if (n.c === 'R' && parentRed) redRed.push(n.v);
      var a = bh(n.l, n.c === 'R'), b = bh(n.r, n.c === 'R');
      if (a !== b) bhOk = false;
      return a + (n.c === 'B' ? 1 : 0);
    })(root, false);
    return { rootBlack: !root || root.c === 'B', noRedRed: !redRed.length, bh: bhOk, redRed: redRed };
  }

  function heightOf(n) { return n ? 1 + Math.max(heightOf(n.l), heightOf(n.r)) : 0; }

  // The code panel. Direction words depend on which side the parent is on,
  // which is exactly the "two mirrored halves" of the usual pseudocode.
  function codeLines(side) {
    var inner = side === 'right' ? 'left' : side === 'left' ? 'right' : '<inner>';
    var r1 = side === 'right' ? 'rotate_right' : side === 'left' ? 'rotate_left' : 'rotate_<away>';
    var r2 = side === 'right' ? 'rotate_left' : side === 'left' ? 'rotate_right' : 'rotate_<toward>';
    return [
      'insert like a normal BST, color the new node RED',
      'while cur is not root and cur.parent is RED:',
      '    p, g = cur.parent, cur.parent.parent',
      '    u = g.' + (side === 'right' ? 'left ' : side === 'left' ? 'right' : 'other') + '    # uncle (parent is g.' + (side || '?') + ')',
      '    if u is RED:                      # CASE 1: recolor',
      '        p.black; u.black; g.red',
      '        cur = g                       # problem moves up',
      '    else:                             # uncle BLACK / empty',
      '        if cur is p.' + inner + ':        # CASE 2: zig-zag',
      '            cur = p; ' + r1 + '(cur); p = cur.parent',
      '        p.black; g.red                # CASE 3: straight line',
      '        ' + r2 + '(g)                  # p becomes the top',
      'root.black'
    ];
  }

  // Runs one insert, recording a step for every line that matters.
  function traceInsert(tree, v, steps) {
    var side = null;
    function step(line, msg, roles, kind) {
      steps.push({ tree: snap(tree.root), line: line, msg: msg, roles: roles || {}, kind: kind || '', side: side, value: v });
    }
    function R(cur, p, g, u) {
      var r = {};
      if (g) r[g.v] = 'grand';
      if (u) r[u.v] = 'uncle';
      if (p) r[p.v] = 'parent';
      if (cur) r[cur.v] = 'cur';
      return r;
    }

    // plain BST insert
    var node = { v: v, c: 'R', left: null, right: null, parent: null };
    var p = null, x = tree.root;
    while (x) { p = x; x = v < x.v ? x.left : x.right; }
    node.parent = p;
    if (!p) tree.root = node;
    else if (v < p.v) p.left = node;
    else p.right = node;
    step(1, 'Insert ' + v + ' like a normal BST and paint it RED. Red is the safe choice: it adds no black, so black counts stay equal everywhere. The only thing that can break is two reds in a row.', R(node), 'insert');

    var cur = node;
    while (cur !== tree.root && cur.parent.c === 'R') {
      p = cur.parent;
      var g = p.parent;
      side = p === g.right ? 'right' : 'left';
      var u = side === 'right' ? g.left : g.right;
      step(2, cur.v + ' is red and its parent ' + p.v + ' is red: two reds in a row. Fix it.', R(cur, p, g, u), 'bad');
      step(4, 'Find the uncle (grandparent ' + g.v + '’s other child): ' + (u ? u.v + ', which is ' + (u.c === 'R' ? 'RED' : 'BLACK') : 'empty, and empty counts as BLACK') + '. The uncle decides what we do.', R(cur, p, g, u));
      if (u && u.c === 'R') {
        step(5, 'Uncle is RED → Case 1: just recolor, no rotation.', R(cur, p, g, u), 'case');
        p.c = 'B'; u.c = 'B'; g.c = 'R';
        step(6, 'Parent and uncle go black, grandparent goes red. Every path through ' + g.v + ' still has the same number of blacks (one moved down to both sides).', R(cur, p, g, u), 'fix');
        cur = g;
        step(7, 'But ' + g.v + ' is red now, and ITS parent might be red too. So cur = ' + g.v + ' and loop again: the problem moved two levels up.', R(cur), 'up');
      } else {
        step(8, 'Uncle is BLACK → recoloring alone would break black counts. We have to rotate.', R(cur, p, g, u), 'case');
        var isInner = side === 'right' ? cur === p.left : cur === p.right;
        if (isInner) {
          step(9, 'Case 2: zig-zag. ' + cur.v + ' is the ' + (side === 'right' ? 'left' : 'right') + ' child of a ' + side + ' child: it bends. Straighten it first.', R(cur, p, g, u), 'case');
          cur = p;
          if (side === 'right') tree.rotateRight(cur); else tree.rotateLeft(cur);
          p = cur.parent;
          step(10, 'Rotated ' + (side === 'right' ? 'right' : 'left') + ' at ' + cur.v + '. Now ' + g.v + ' → ' + p.v + ' → ' + cur.v + ' is a straight line (the roles swapped: cur = ' + cur.v + ', parent = ' + p.v + ').', R(cur, p, g, u), 'fix');
        }
        p.c = 'B'; g.c = 'R';
        step(11, 'Case 3: straight line. Parent ' + p.v + ' goes black, grandparent ' + g.v + ' goes red…', R(cur, p, g, u), 'case');
        if (side === 'right') tree.rotateLeft(g); else tree.rotateRight(g);
        step(12, '…and rotate ' + (side === 'right' ? 'left' : 'right') + ' at ' + g.v + ' so the black ' + p.v + ' becomes the top, with red ' + cur.v + ' and red ' + g.v + ' as its children. The top is black, so there’s nothing left to fix above: loop ends.', R(cur, p, g), 'fix');
      }
    }
    var why = cur === tree.root ? cur.v + ' is the root' : cur.v + '’s parent ' + cur.parent.v + ' is black';
    if (tree.root.c === 'R') {
      tree.root.c = 'B';
      step(13, 'Loop stops (' + why + '). Case 1 turned the root red, so paint it black. Always safe: it adds one black to every path equally.', {}, 'done');
    } else {
      step(13, 'Loop stops (' + why + '). Root is already black. Done: all three rules hold.', {}, 'done');
    }
  }

  // ------------------------------------------------------------- the lab

  var PRESETS = [
    { label: 'Case 1: red uncle (recolor)', seq: '20,10,30,5' },
    { label: 'Case 3: straight line (1 rotation)', seq: '10,20,30' },
    { label: 'Case 2: zig-zag (2 rotations)', seq: '10,30,20' },
    { label: 'Case 1, then moves up into Case 3', seq: '55,50,60,20,45,35,10,25' },
    { label: 'Sorted input 1…10', seq: '1,2,3,4,5,6,7,8,9,10' }
  ];

  var KIND = { insert: 'INSERT', bad: 'RED-RED', 'case': 'DECIDE', fix: 'FIX', up: 'MOVE UP', done: 'DONE' };
  var ROLE = { cur: 'cur', parent: 'parent', grand: 'grandpa', uncle: 'uncle' };

  function RBLab(host) {
    this.host = host;
    this.reset();
    this.build();
    var seq = host.dataset.insert;
    if (seq) this.insertMany(seq, true);
    else this.render();
  }

  RBLab.prototype.reset = function () {
    this.tree = new RBTree();
    this.steps = [{ tree: null, line: null, msg: 'Empty tree. Insert a number, or pick a preset.', roles: {}, kind: '', side: null }];
    this.inserted = [];
    this.i = 0;
    this.maxNodes = 1; this.maxDepth = 1;
  };

  RBLab.prototype.build = function () {
    var self = this, host = this.host;
    host.classList.add('tl', 'rb');
    host.setAttribute('tabindex', '0');
    host.innerHTML = '';

    var bar = h('div', { class: 'tl-toolbar' }, host);
    var f1 = h('label', { class: 'tl-field' }, bar);
    h('span', null, f1, 'Insert');
    this.input = h('input', { type: 'text', inputmode: 'numeric', size: '8', placeholder: 'e.g. 42 or 5,3,8', 'aria-label': 'Values to insert' }, f1);
    var ib = h('button', { class: 'tl-btn tl-primary', type: 'button' }, bar, 'Insert');
    var rb = h('button', { class: 'tl-btn', type: 'button' }, bar, '🎲 Random');
    var f2 = h('label', { class: 'tl-field' }, bar);
    h('span', null, f2, 'Presets');
    this.preset = h('select', null, f2);
    h('option', { value: '' }, this.preset, 'Pick a case…');
    PRESETS.forEach(function (p) { h('option', { value: p.seq }, self.preset, p.label + '  [' + p.seq + ']'); });
    var clr = h('button', { class: 'tl-btn', type: 'button' }, bar, 'Clear');

    function doInsert() { if (self.input.value.trim()) { self.insertMany(self.input.value, false); self.input.value = ''; } }
    ib.addEventListener('click', doInsert);
    this.input.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') doInsert(); });
    rb.addEventListener('click', function () {
      var v, guard = 0;
      do { v = 1 + Math.floor(Math.random() * 99); } while (self.inserted.indexOf(v) >= 0 && guard++ < 200);
      self.insertMany(String(v), false);
    });
    this.preset.addEventListener('change', function () {
      if (!self.preset.value) return;
      self.pause(); self.reset(); self.insertMany(self.preset.value, true); self.preset.value = '';
    });
    clr.addEventListener('click', function () { self.pause(); self.reset(); self.render(); });

    this.err = h('div', { class: 'tl-error', role: 'alert' }, host);
    this.rules = h('div', { class: 'rb-rules' }, host);
    this.treeBox = h('div', { class: 'tl-tree' }, host);
    this.svg = s('svg', { class: 'tl-svg rb-svg', role: 'img', 'aria-label': 'Red-black tree' }, this.treeBox);
    this.gE = s('g', null, this.svg);
    this.gN = s('g', null, this.svg);
    this.nodeEls = {};
    this.edgeEls = {};

    this.narr = h('div', { class: 'tl-narr', 'aria-live': 'polite' }, host);

    var ctr = h('div', { class: 'tl-controls' }, host);
    function btn(t, title, fn) { var b = h('button', { class: 'tl-btn', type: 'button', title: title, 'aria-label': title }, ctr, t); b.addEventListener('click', fn); return b; }
    btn('⏮', 'Back to the start of this insert', function () { self.pause(); self.goto(self.insertStart(self.i - 1)); });
    btn('◀', 'Step back (←)', function () { self.pause(); self.goto(self.i - 1); });
    this.playBtn = btn('▶ Play', 'Play / pause (space)', function () { self.toggle(); });
    this.playBtn.classList.add('tl-primary');
    btn('▶|', 'Step forward (→)', function () { self.pause(); self.goto(self.i + 1); });
    btn('⏭', 'Finish this insert', function () { self.pause(); self.goto(self.insertEnd(self.i)); });
    this.counter = h('span', { class: 'tl-counter' }, ctr);
    this.stats = h('span', { class: 'rb-stats' }, ctr);

    var cp = h('div', { class: 'tl-pane rb-code-pane' }, host);
    h('div', { class: 'tl-pane-title' }, cp, 'fix_insert (the half for the current side; the other half is its mirror)');
    this.codeBox = h('div', { class: 'tl-code' }, cp);

    host.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); self.pause(); self.goto(self.i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); self.pause(); self.goto(self.i - 1); }
      else if (e.key === ' ') { e.preventDefault(); self.toggle(); }
    });
  };

  RBLab.prototype.insertMany = function (text, jumpToLastInsert) {
    this.err.textContent = '';
    var vals = String(text).split(/[\s,]+/).filter(Boolean).map(Number);
    if (vals.some(isNaN)) { this.err.textContent = 'Numbers only, e.g. 42 or 5, 3, 8.'; return; }
    var firstNew = null, lastStart = null;
    for (var k = 0; k < vals.length; k++) {
      var v = vals[k];
      if (this.inserted.indexOf(v) >= 0) { this.err.textContent = v + ' is already in the tree (duplicates skipped).'; continue; }
      if (this.inserted.length >= 31) { this.err.textContent = 'That’s plenty: 31 nodes max so it stays readable.'; break; }
      lastStart = this.steps.length;
      if (firstNew === null) firstNew = lastStart;
      traceInsert(this.tree, v, this.steps);
      this.inserted.push(v);
    }
    var self = this;
    this.steps.forEach(function (st) {
      var n = 0; (function c(x) { if (x) { n++; c(x.l); c(x.r); } })(st.tree);
      self.maxNodes = Math.max(self.maxNodes, n);
      self.maxDepth = Math.max(self.maxDepth, heightOf(st.tree));
    });
    if (lastStart === null) { this.render(); return; }
    this.pause();
    // One value typed: start at its first step. Several / preset: show the
    // earlier inserts done, and open on the last (most interesting) one.
    this.goto(jumpToLastInsert || vals.length > 1 ? lastStart : firstNew);
  };

  RBLab.prototype.insertStart = function (i) {
    i = Math.max(0, i);
    while (i > 0 && this.steps[i].kind !== 'insert') i--;
    return i;
  };
  RBLab.prototype.insertEnd = function (i) {
    i = Math.min(this.steps.length - 1, i + 1);
    while (i < this.steps.length - 1 && this.steps[i].kind !== 'done') i++;
    return i;
  };

  RBLab.prototype.goto = function (i) {
    this.i = Math.max(0, Math.min(this.steps.length - 1, i));
    this.render();
  };

  RBLab.prototype.render = function () {
    var st = this.steps[this.i];
    var self = this;

    // layout: in-order x, depth y. The viewBox covers the biggest tree seen so
    // far, so it doesn't jump while nodes slide around during a rotation.
    var pos = {}, x = 0;
    (function go(n, d) { if (!n) return; go(n.l, d + 1); pos[n.v] = { x: PAD + (x++ + 0.5) * COL, y: PAD + 14 + d * ROW, n: n }; go(n.r, d + 1); })(st.tree, 0);
    var W = Math.max(this.maxNodes * COL + PAD * 2, 220);
    var H = Math.max(this.maxDepth - 1, 0) * ROW + PAD * 2 + 34;
    this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    this.svg.style.maxWidth = Math.max(W * 1.1, 300) + 'px';
    this.svg.style.minWidth = Math.min(W * 0.7, 560) + 'px';
    // centre the current tree inside the stable viewBox
    var off = (W - (x * COL + PAD * 2)) / 2;

    var chk = check(st.tree);
    var bad = {};
    chk.redRed.forEach(function (v) { bad[v] = true; });

    // edges (keyed by child value; CSS-transitioned `d` so rotations glide)
    var seenE = {};
    (function go(n) {
      if (!n) return;
      [n.l, n.r].forEach(function (c) {
        if (!c) return;
        seenE[c.v] = true;
        var e = self.edgeEls[c.v];
        if (!e) { e = s('path', {}, self.gE); self.edgeEls[c.v] = e; }
        var a = pos[n.v], b = pos[c.v];
        var d = 'M' + (a.x + off) + ' ' + a.y + ' L' + (b.x + off) + ' ' + b.y;
        e.setAttribute('d', d);
        e.style.d = 'path("' + d + '")';
        e.setAttribute('class', 'rb-edge' + (bad[c.v] && n.c === 'R' ? ' rb-edge-bad' : ''));
        go(c);
      });
    })(st.tree);
    for (var ek in this.edgeEls) if (!seenE[ek]) { this.edgeEls[ek].remove(); delete this.edgeEls[ek]; }

    // nodes
    var seenN = {};
    for (var v in pos) {
      seenN[v] = true;
      var p = pos[v], el = this.nodeEls[v];
      if (!el) {
        el = { g: s('g', {}, this.gN) };
        el.c = s('circle', { r: 19 }, el.g);
        el.t = s('text', { dy: '0.35em', class: 'rb-val' }, el.g, v);
        el.tagG = s('g', { class: 'rb-tag' }, el.g);
        el.tagR = s('rect', { y: 22, height: 17, rx: 8 }, el.tagG);
        el.tagT = s('text', { y: 30.5, dy: '0.35em' }, el.tagG);
        el.g.style.transform = 'translate(' + (p.x + off) + 'px,' + (p.y - 30) + 'px)';
        el.g.getBoundingClientRect(); // start the "drop in" from above
        this.nodeEls[v] = el;
      }
      el.g.style.transform = 'translate(' + (p.x + off) + 'px,' + p.y + 'px)';
      var role = st.roles[v];
      el.g.setAttribute('class', 'rb-node ' + (p.n.c === 'R' ? 'rb-red' : 'rb-black') + (role ? ' rb-role-' + role : '') + (bad[v] ? ' rb-bad' : ''));
      if (role) {
        el.tagG.style.display = '';
        el.tagT.textContent = ROLE[role];
        var w = ROLE[role].length * 6.6 + 12;
        el.tagR.setAttribute('x', -w / 2); el.tagR.setAttribute('width', w);
      } else el.tagG.style.display = 'none';
    }
    for (var nk in this.nodeEls) if (!seenN[nk]) { this.nodeEls[nk].g.remove(); delete this.nodeEls[nk]; }

    // rules
    function rule(ok, text) { return '<span class="rb-rule ' + (ok ? 'rb-ok' : 'rb-no') + '">' + (ok ? '✓ ' : '✗ ') + text + '</span>'; }
    this.rules.innerHTML = rule(chk.rootBlack, 'root is black') + rule(chk.noRedRed, 'no red node has a red child') + rule(chk.bh, 'same # of blacks on every path down');

    // code
    var lines = codeLines(st.side);
    this.codeBox.innerHTML = '';
    lines.forEach(function (line, k) {
      var row = h('div', { class: 'tl-line' + (st.line === k + 1 ? ' tl-cur' : '') }, self.codeBox);
      h('span', { class: 'tl-ln' }, row, String(k + 1));
      var hash = line.indexOf('#');
      var code = hash >= 0 ? line.slice(0, hash) : line, cm = hash >= 0 ? line.slice(hash) : '';
      h('code', { html: esc(code).replace(/\b(while|if|else|and|is|not)\b/g, '<span class="tl-kw">$1</span>')
        .replace(/\b(RED|red)\b/g, '<span class="rb-kw-red">$1</span>')
        .replace(/\b(BLACK|black)\b/g, '<span class="rb-kw-black">$1</span>') + (cm ? '<span class="tl-cm">' + esc(cm) + '</span>' : '') }, row);
    });

    // narration + counters
    this.narr.className = 'tl-narr rb-narr-' + (st.kind || 'line');
    this.narr.innerHTML = (KIND[st.kind] ? '<span class="tl-tag">' + KIND[st.kind] + '</span>' : '') + esc(st.msg);
    this.counter.textContent = 'Step ' + (this.i + 1) + ' / ' + this.steps.length;
    var n = Object.keys(pos).length;
    this.stats.textContent = n ? n + ' nodes · height ' + heightOf(st.tree) : '';
    this.playBtn.textContent = this.timer ? '⏸ Pause' : '▶ Play';
  };

  RBLab.prototype.play = function () {
    var self = this;
    if (this.i >= this.steps.length - 1) return;
    this.timer = setInterval(function () {
      if (self.i >= self.steps.length - 1) { self.pause(); return; }
      self.goto(self.i + 1);
    }, 1100);
    this.render();
  };
  RBLab.prototype.pause = function () { if (this.timer) { clearInterval(this.timer); this.timer = null; this.render(); } };
  RBLab.prototype.toggle = function () { if (this.timer) this.pause(); else this.play(); };

  function init() {
    document.querySelectorAll('.rb-lab:not([data-rb-ready])').forEach(function (el) {
      el.setAttribute('data-rb-ready', '');
      try { new RBLab(el); } catch (e) { el.textContent = 'Demo failed to load: ' + e.message; console.error(e); }
    });
  }

  window.RBLabLib = { RBTree: RBTree, traceInsert: traceInsert, check: check };

  if (window.document$ && typeof window.document$.subscribe === 'function') window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
