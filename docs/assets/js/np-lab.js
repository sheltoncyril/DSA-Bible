/*
 * np-lab.js: P / NP / NP-hard / NP-complete demos for the DSA Bible.
 *
 *   <div class="np-lab" data-mode="verify" data-numbers="12,16,35,15,7,17,13,33" data-target="107"></div>
 *   <div class="np-lab" data-mode="reduce" data-edges="A-B,B-C,C-D"></div>
 *   <div class="np-lab" data-mode="map" data-start="sat3"></div>
 *
 * verify  Subset sum. Pick a subset yourself (checking is one pass of
 *         additions) or let brute force hunt through all 2^n subsets.
 * reduce  Independent set <-> vertex cover <-> clique (on the complement).
 *         Three separate checkers that always agree: that is a reduction.
 * map     P / NP / NP-complete / NP-hard as an Euler diagram, with a quiz.
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var uid = 0;

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
  function rnd(n) { return Math.floor(Math.random() * n); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function popcount(m) { var c = 0; while (m) { c += m & 1; m >>>= 1; } return c; }
  function alive(host) { return document.body.contains(host); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  // =================================================================== verify

  var DEFAULT_PUZZLE = { nums: [12, 16, 35, 15, 7, 17, 13, 33], target: 107 };

  function subsetSums(nums) {
    var seen = { 0: true };
    nums.forEach(function (x) {
      Object.keys(seen).map(Number).forEach(function (t) { seen[t + x] = true; });
    });
    return seen;
  }

  function makePuzzle(n, solvable) {
    var nums = [], used = {}, v;
    while (nums.length < n) {
      v = 3 + rnd(38);
      if (!used[v]) { used[v] = true; nums.push(v); }
    }
    var total = nums.reduce(function (a, b) { return a + b; }, 0);
    if (solvable) {
      var mask, bits;
      do { mask = 1 + rnd((1 << n) - 1); bits = popcount(mask); } while (bits < 2 || bits > n - 1);
      var t = 0;
      for (var i = 0; i < n; i++) if (mask >> i & 1) t += nums[i];
      return { nums: nums, target: t };
    }
    // An unreachable target in the middle of the range, so it isn't obviously impossible.
    var reach = subsetSums(nums), gaps = [], mid = [];
    for (var g = Math.min.apply(null, nums); g < total; g++) {
      if (reach[g]) continue;
      gaps.push(g);
      if (g >= total / 4 && g <= 3 * total / 4) mid.push(g);
    }
    var pool = mid.length ? mid : gaps;
    return { nums: nums, target: pool.length ? pool[rnd(pool.length)] : total + 1 };
  }

  function VerifyLab(host) {
    this.host = host;
    var nums = (host.dataset.numbers || '').split(/[\s,]+/).filter(Boolean).map(Number);
    var target = Number(host.dataset.target);
    if (nums.length < 4 || nums.length > 10 || nums.some(isNaN) || isNaN(target)) {
      nums = DEFAULT_PUZZLE.nums.slice(); target = DEFAULT_PUZZLE.target;
    }
    this.nums = nums;
    this.target = target;
    this.sel = nums.map(function () { return false; });
    this.mask = -1;
    this.state = 'pick';          // pick | search | found | none
    this.timer = null;
    this.build();
    this.render();
  }

  VerifyLab.prototype.build = function () {
    var self = this, host = this.host;
    host.classList.add('tl', 'np');
    clear(host);

    var bar = h('div', { class: 'tl-toolbar' }, host);
    var f1 = h('label', { class: 'tl-field' }, bar);
    h('span', null, f1, 'How many numbers');
    this.sizeSel = h('select', null, f1);
    for (var n = 4; n <= 10; n++) h('option', { value: String(n) }, this.sizeSel, String(n));
    this.sizeSel.value = String(this.nums.length);
    var f2 = h('label', { class: 'tl-check' }, bar);
    this.noBox = h('input', { type: 'checkbox' }, f2);
    h('span', null, f2, 'make it unsolvable');
    var nb = h('button', { class: 'tl-btn tl-primary', type: 'button' }, bar, '🎲 New puzzle');
    nb.addEventListener('click', function () { self.newPuzzle(); });
    this.sizeSel.addEventListener('change', function () { self.newPuzzle(); });
    this.noBox.addEventListener('change', function () { self.newPuzzle(); });

    this.head = h('div', { class: 'np-target' }, host);
    this.chips = h('div', { class: 'np-chips', role: 'group', 'aria-label': 'The numbers' }, host);
    this.buildChips();

    var cp = h('div', { class: 'np-panel' }, host);
    h('div', { class: 'tl-pane-title' }, cp, 'CHECK: you propose a subset, the computer verifies it');
    this.eq = h('div', { class: 'np-eq' }, cp);
    this.checkCost = h('div', { class: 'np-cost' }, cp);

    var sp = h('div', { class: 'np-panel' }, host);
    h('div', { class: 'tl-pane-title' }, sp, 'SOLVE: the computer has to find one on its own');
    var ctr = h('div', { class: 'tl-controls' }, sp);
    function btn(t, title, fn) { var b = h('button', { class: 'tl-btn', type: 'button', title: title, 'aria-label': title }, ctr, t); b.addEventListener('click', fn); return b; }
    this.goBtn = btn('▶ Try every subset', 'Count through the subsets one by one', function () { self.toggle(); });
    this.goBtn.classList.add('tl-primary');
    btn('⏭ Skip to the end', 'Jump to the answer', function () { self.skip(); });
    btn('Clear', 'Clear the current pick', function () { self.pause(); self.mask = -1; self.state = 'pick'; self.sel = self.sel.map(function () { return false; }); self.render(); });
    this.prog = h('div', { class: 'np-bar', role: 'progressbar', 'aria-valuemin': '0' }, sp);
    this.fill = h('div', { class: 'np-bar-fill' }, this.prog);
    this.progText = h('div', { class: 'np-cost' }, sp);

    this.narr = h('div', { class: 'tl-narr np-narr', 'aria-live': 'polite' }, host);
    this.foot = h('div', { class: 'np-foot' }, host,
      'Keep going: at n = 60, checking is 60 steps; brute force is about 1.15 × 10¹⁸ subsets, roughly 36 years at a billion per second.');
  };

  VerifyLab.prototype.buildChips = function () {
    var self = this;
    clear(this.chips);
    this.chipEls = this.nums.map(function (v, i) {
      var b = h('button', { class: 'np-chip', type: 'button', 'aria-pressed': 'false' }, self.chips, String(v));
      b.addEventListener('click', function () {
        self.pause(); self.mask = -1; self.state = 'pick';
        self.sel[i] = !self.sel[i];
        self.render();
      });
      return b;
    });
  };

  VerifyLab.prototype.newPuzzle = function () {
    this.pause();
    var n = Number(this.sizeSel.value) || 8;
    var p = makePuzzle(n, !this.noBox.checked);
    this.nums = p.nums; this.target = p.target;
    this.sel = p.nums.map(function () { return false; });
    this.mask = -1; this.state = 'pick';
    this.buildChips();
    this.render();
  };

  VerifyLab.prototype.applyMask = function (m) {
    for (var i = 0; i < this.nums.length; i++) this.sel[i] = !!(m >> i & 1);
  };
  VerifyLab.prototype.selSum = function () {
    var t = 0, self = this;
    this.nums.forEach(function (v, i) { if (self.sel[i]) t += v; });
    return t;
  };

  VerifyLab.prototype.tick = function () {
    if (!alive(this.host)) { this.pause(); return; }
    var total = 1 << this.nums.length;
    this.mask++;
    if (this.mask >= total) {
      this.mask = total - 1;
      this.pause(); this.state = 'none'; this.render();
      return;
    }
    this.applyMask(this.mask);
    if (this.selSum() === this.target) { this.pause(); this.state = 'found'; }
    else this.state = 'search';
    this.render();
  };

  VerifyLab.prototype.start = function () {
    var self = this, total = 1 << this.nums.length;
    if (this.state !== 'search') { this.mask = -1; }
    this.state = 'search';
    var every = Math.max(12, Math.min(300, 6000 / total));
    this.timer = setInterval(function () { self.tick(); }, every);
    this.render();
  };
  VerifyLab.prototype.pause = function () {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  };
  VerifyLab.prototype.toggle = function () {
    if (this.timer) { this.pause(); this.render(); } else this.start();
  };
  VerifyLab.prototype.skip = function () {
    this.pause();
    var total = 1 << this.nums.length;
    if (this.state !== 'search') this.mask = -1;
    this.state = 'none';
    while (++this.mask < total) {
      this.applyMask(this.mask);
      if (this.selSum() === this.target) { this.state = 'found'; break; }
    }
    if (this.state === 'none') { this.mask = total - 1; }
    this.render();
  };

  VerifyLab.prototype.render = function () {
    var self = this, n = this.nums.length, total = 1 << n;
    var picked = [], sum = 0;
    this.nums.forEach(function (v, i) { if (self.sel[i]) { picked.push(v); sum += v; } });

    this.head.innerHTML = 'Is there a subset of these <b>' + n + '</b> numbers that adds up to <span class="np-target-num">' + this.target + '</span>?';
    this.chipEls.forEach(function (c, i) {
      c.className = 'np-chip' + (self.sel[i] ? ' np-chip-on' : '');
      c.setAttribute('aria-pressed', self.sel[i] ? 'true' : 'false');
    });

    var ok = picked.length > 0 && sum === this.target;
    var verdict;
    if (!picked.length) verdict = '<span class="np-pill np-idle">pick some numbers</span>';
    else if (ok) verdict = '<span class="np-pill np-ok">✓ equals the target</span>';
    else verdict = '<span class="np-pill np-no">✗ ' + (sum < this.target ? 'too small' : 'too big') + '</span>';
    this.eq.innerHTML = '<span class="np-sum">' + (picked.length ? picked.join(' + ') : '(nothing picked)') + ' = <b>' + sum + '</b></span> ' + verdict;
    this.checkCost.textContent = 'Checking is one pass over the numbers: at most n = ' + n + ' steps, however you found the subset.';

    var tried = this.state === 'pick' ? 0 : this.mask + 1;
    this.fill.style.width = (100 * tried / total) + '%';
    this.prog.setAttribute('aria-valuenow', String(tried));
    this.prog.setAttribute('aria-valuemax', String(total));
    this.progText.innerHTML = '<b>' + fmt(tried) + '</b> of 2<sup>' + n + '</sup> = <b>' + fmt(total) + '</b> subsets tried';
    this.goBtn.textContent = this.timer ? '⏸ Pause' : (this.state === 'search' ? '▶ Continue' : '▶ Try every subset');

    var tag, msg, cls;
    if (this.state === 'found') {
      tag = 'FOUND'; cls = 'np-narr-ok';
      msg = 'Found after ' + fmt(tried) + ' of ' + fmt(total) + ' subsets. But <b>verifying</b> it took one pass of ' + n + ' steps. Add one more number and the search space <b>doubles</b>; the check grows by one step.';
    } else if (this.state === 'none') {
      tag = 'NO SOLUTION'; cls = 'np-narr-no';
      msg = 'All ' + fmt(total) + ' subsets tried and none adds up to ' + this.target + '. A "yes" has a short proof (the subset). This "no" has none you can check quickly: you had to rule everything out. NP only promises short proofs for <b>yes</b> answers.';
    } else if (this.state === 'search') {
      tag = this.timer ? 'SEARCHING' : 'PAUSED'; cls = '';
      msg = 'Brute force counts through the subsets in binary (' + pad(this.mask, n) + ') and checks each one exactly the way your guess was checked.';
    } else {
      tag = 'YOUR TURN'; cls = '';
      msg = 'Click numbers to build a subset: it is verified instantly. Then press <b>▶ Try every subset</b> and watch how much longer <em>finding</em> one takes.';
    }
    this.narr.className = 'tl-narr np-narr ' + cls;
    this.narr.innerHTML = '<span class="tl-tag">' + tag + '</span>' + msg;
  };

  function pad(m, n) {
    var t = m.toString(2);
    while (t.length < n) t = '0' + t;
    return t;
  }

  // =================================================================== reduce

  var LET = 'ABCDEFGHIJ';
  var DEFAULT_EDGES = 'A-B,B-C,C-D,D-E,E-F,F-G,G-A,A-D,B-F';

  function parseEdges(text) {
    var edges = [], n = 0, seen = {};
    String(text).split(/[\s,]+/).filter(Boolean).forEach(function (p) {
      var m = /^([A-J])-([A-J])$/i.exec(p);
      if (!m) return;
      var a = LET.indexOf(m[1].toUpperCase()), b = LET.indexOf(m[2].toUpperCase());
      if (a === b) return;
      var lo = Math.min(a, b), hi = Math.max(a, b);
      if (seen[lo + '-' + hi]) return;
      seen[lo + '-' + hi] = true;
      edges.push([lo, hi]);
      n = Math.max(n, hi + 1);
    });
    return { n: n, edges: edges };
  }

  // Three independent checkers. A reduction says they must always agree.
  function isIndependent(edges, inS) {
    return !edges.some(function (e) { return inS[e[0]] && inS[e[1]]; });
  }
  function isCover(edges, inC) {
    return edges.every(function (e) { return inC[e[0]] || inC[e[1]]; });
  }
  function isClique(n, adj, inS) {
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      if (inS[i] && inS[j] && !adj[i][j]) return false;
    }
    return true;
  }
  function boolsFromMask(n, m) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(!!(m >> i & 1));
    return a;
  }
  function namesOf(arr) {
    var out = [];
    arr.forEach(function (on, i) { if (on) out.push(LET[i]); });
    return out.length ? '{' + out.join(', ') + '}' : '{ }';
  }

  function ReduceLab(host) {
    this.host = host;
    var p = parseEdges(host.dataset.edges || DEFAULT_EDGES);
    if (p.n < 4 || p.edges.length < 3) p = parseEdges(DEFAULT_EDGES);
    this.setGraph(p.n, p.edges);
    this.view = 'g';
    this.focusIdx = null;
    this.build();
    this.render();
  }

  ReduceLab.prototype.setGraph = function (n, edges) {
    this.n = n;
    this.edges = edges;
    this.adj = [];
    for (var i = 0; i < n; i++) { this.adj.push([]); for (var j = 0; j < n; j++) this.adj[i].push(false); }
    edges.forEach(function (e) { this.adj[e[0]][e[1]] = this.adj[e[1]][e[0]] = true; }, this);
    this.sel = [];
    for (var k = 0; k < n; k++) this.sel.push(false);
    this.k = Math.min(3, n - 1);
  };

  ReduceLab.prototype.build = function () {
    var self = this, host = this.host;
    host.classList.add('tl', 'np');
    clear(host);

    var bar = h('div', { class: 'tl-toolbar' }, host);
    var f1 = h('label', { class: 'tl-field' }, bar);
    h('span', null, f1, 'Draw it as');
    this.viewSel = h('select', null, f1);
    h('option', { value: 'g' }, this.viewSel, 'G (the graph)');
    h('option', { value: 'c' }, this.viewSel, 'the complement of G (for Clique)');
    this.viewSel.addEventListener('change', function () { self.view = self.viewSel.value; self.render(); });
    var rb = h('button', { class: 'tl-btn', type: 'button' }, bar, '🎲 New graph');
    rb.addEventListener('click', function () { self.randomGraph(); });
    var cb = h('button', { class: 'tl-btn', type: 'button' }, bar, 'Clear pick');
    cb.addEventListener('click', function () { self.sel = self.sel.map(function () { return false; }); self.render(); });

    var grid = h('div', { class: 'np-grid' }, host);
    this.treeBox = h('div', { class: 'tl-tree np-graph' }, grid);
    this.svg = s('svg', { class: 'tl-svg', viewBox: '0 0 360 300', role: 'group', 'aria-label': 'Graph. Click nodes to pick the set S.' }, this.treeBox);
    var side = h('div', { class: 'np-side' }, grid);
    h('div', { class: 'tl-pane-title' }, side, 'Click nodes to build S. Three different questions about S:');
    this.verdicts = h('div', { class: 'np-verdicts' }, side);
    this.legend = h('div', { class: 'np-legend' }, side, '');
    this.legend.innerHTML = '<span><i class="np-key np-key-in"></i> S (picked)</span><span><i class="np-key np-key-out"></i> V∖S (everyone else)</span>';

    var qp = h('div', { class: 'np-panel' }, host);
    h('div', { class: 'tl-pane-title' }, qp, 'The yes/no question, translated');
    var rowk = h('div', { class: 'np-krow' }, qp);
    h('span', null, rowk, 'k =');
    this.kInput = h('input', { type: 'range', min: '1', max: String(this.n - 1), value: String(this.k), 'aria-label': 'k' }, rowk);
    this.kText = h('b', { class: 'np-kval' }, rowk);
    this.kInput.addEventListener('input', function () { self.k = Number(self.kInput.value); self.render(); });
    this.qa = h('div', { class: 'np-qa' }, qp);
    this.showBtn = h('button', { class: 'tl-btn', type: 'button' }, qp, 'Show a witness for the Independent Set question');
    this.showBtn.addEventListener('click', function () {
      var w = self.findWitness(self.k, true);
      if (w !== null) { self.sel = boolsFromMask(self.n, w); self.render(); }
    });

    this.narr = h('div', { class: 'tl-narr np-narr', 'aria-live': 'polite' }, host);
  };

  ReduceLab.prototype.randomGraph = function () {
    var n = 7, edges = [], tries = 0;
    do {
      edges = [];
      for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) if (Math.random() < 0.38) edges.push([i, j]);
    } while ((edges.length < 6 || edges.length > 13) && tries++ < 500);
    this.setGraph(n, edges);
    this.kInput.max = String(n - 1);
    this.kInput.value = String(this.k);
    this.render();
  };

  // Brute force over all 2^n subsets: the point is the *answers*, not the speed.
  ReduceLab.prototype.findWitness = function (size, forIndependent) {
    var n = this.n, total = 1 << n;
    for (var m = 0; m < total; m++) {
      if (popcount(m) !== size) continue;
      var inS = boolsFromMask(n, m);
      if (forIndependent ? isIndependent(this.edges, inS) : isCover(this.edges, inS)) return m;
    }
    return null;
  };

  ReduceLab.prototype.pos = function (i) {
    var a = -Math.PI / 2 + 2 * Math.PI * i / this.n;
    return { x: 180 + 105 * Math.cos(a), y: 150 + 105 * Math.sin(a) };
  };

  ReduceLab.prototype.render = function () {
    var self = this, n = this.n, inS = this.sel;
    var inC = inS.map(function (x) { return !x; });
    var comp = [];
    for (var a = 0; a < n; a++) { comp.push([]); for (var b = 0; b < n; b++) comp[a].push(a !== b && !this.adj[a][b]); }

    // ---- graph
    clear(this.svg);
    var gE = s('g', null, this.svg), gN = s('g', null, this.svg);
    var drawn = [];
    if (this.view === 'g') {
      this.edges.forEach(function (e) { drawn.push({ a: e[0], b: e[1], bad: inS[e[0]] && inS[e[1]] }); });
    } else {
      for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
        if (comp[i][j]) drawn.push({ a: i, b: j, comp: true, good: inS[i] && inS[j] });
        else if (inS[i] && inS[j]) drawn.push({ a: i, b: j, bad: true, ghost: true });
      }
    }
    drawn.forEach(function (e) {
      var p = self.pos(e.a), q = self.pos(e.b);
      var cls = 'np-edge' + (e.comp ? ' np-edge-comp' : '') + (e.good ? ' np-edge-good' : '') + (e.bad ? ' np-edge-bad' : '') + (e.ghost ? ' np-edge-ghost' : '');
      s('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: cls }, gE);
    });
    for (var v = 0; v < n; v++) {
      (function (v) {
        var p = self.pos(v);
        var g = s('g', {
          class: 'np-node ' + (inS[v] ? 'np-in' : 'np-out'), transform: 'translate(' + p.x + ',' + p.y + ')',
          tabindex: '0', role: 'button', 'aria-pressed': inS[v] ? 'true' : 'false', 'aria-label': 'Node ' + LET[v]
        }, gN);
        s('circle', { r: 18 }, g);
        s('text', { dy: '0.35em', class: 'np-nlabel' }, g, LET[v]);
        function flip() { self.focusIdx = v; self.sel[v] = !self.sel[v]; self.render(); }
        g.addEventListener('click', flip);
        g.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); }
        });
        if (self.focusIdx === v) { self.focusIdx = null; setTimeout(function () { g.focus(); }, 0); }
      })(v);
    }

    // ---- three verdicts (three separate checkers)
    function row(ok, title, sub) {
      return '<div class="np-vrow ' + (ok ? 'np-v-ok' : 'np-v-no') + '"><span class="np-vmark">' + (ok ? '✓' : '✗') + '</span><span><b>' + title + '</b><br><span class="np-sub">' + sub + '</span></span></div>';
    }
    var r1 = isIndependent(this.edges, inS), r2 = isCover(this.edges, inC), r3 = isClique(n, comp, inS);
    this.verdicts.innerHTML =
      row(r1, 'S is an independent set of G', 'no two picked nodes share an edge') +
      row(r2, 'V∖S is a vertex cover of G', 'every edge has an end outside S') +
      row(r3, 'S is a clique in the complement of G', 'every picked pair is joined in the complement');

    // ---- the decision question
    var k = this.k, cover = n - k;
    this.kText.textContent = k;
    var wI = this.findWitness(k, true), wC = this.findWitness(cover, false);
    function ans(w) { return w === null ? '<span class="np-pill np-no">NO</span>' : '<span class="np-pill np-ok">YES</span> <span class="np-sub">e.g. ' + namesOf(boolsFromMask(n, w)) + '</span>'; }
    this.qa.innerHTML =
      '<div class="np-q"><b>Independent Set:</b> is there a set of <b>' + k + '</b> nodes with no edge between them? ' + ans(wI) + '</div>' +
      '<div class="np-q"><b>Vertex Cover:</b> is there a set of <b>' + cover + '</b> (= n − k = ' + n + ' − ' + k + ') nodes touching every edge? ' + ans(wC) + '</div>';
    this.showBtn.disabled = wI === null;

    this.narr.className = 'tl-narr np-narr';
    this.narr.innerHTML = '<span class="tl-tag">THE REDUCTION</span>Try to make the three checks disagree. You can\'t: <b>S works for one exactly when V∖S works for the other</b>, and the same edges break all three. So to answer Independent Set(G, ' + k + '), you can hand <b>(G, ' + cover + ')</b> to a Vertex Cover solver. The "translation" is one subtraction.';

    if (this.viewSel.value !== this.view) this.viewSel.value = this.view;
  };

  // ====================================================================== map

  var REGION = {
    P:   { name: 'In P' },
    NPI: { name: 'NP-intermediate (suspected)' },
    NPC: { name: 'NP-complete' },
    NPH: { name: 'NP-hard, but not in NP' }
  };

  // x, y are positions inside the region of the diagram (viewBox 820 x 340).
  var ITEMS = [
    { id: 'path', name: 'Shortest path', region: 'P', x: 105, y: 160,
      q: 'Is there a route from s to t of length ≤ k?',
      why: 'Dijkstra / BFS solves it directly in polynomial time. Anything you can <em>solve</em> fast you can trivially <em>check</em> fast (just solve it again), which is why P sits inside NP.' },
    { id: 'prime', name: 'Is n prime?', region: 'P', x: 168, y: 165,
      q: 'Is the number n prime?',
      why: 'It looks like factoring, but it isn\'t: the AKS algorithm (2002) decides primality in polynomial time. Knowing <em>that</em> n is composite is easy; <em>finding</em> a factor is the suspected-hard part.' },
    { id: 'twosat', name: '2-SAT', region: 'P', x: 100, y: 222,
      q: 'Every clause has 2 literals. Can all clauses be made true at once?',
      why: 'Linear time via strongly connected components of an implication graph. One more literal per clause (3-SAT) flips it to NP-complete.' },
    { id: 'match', name: 'Perfect matching', region: 'P', x: 165, y: 225,
      q: 'Can you pair up all the nodes along edges?',
      why: 'Polynomial (Edmonds\' blossom algorithm; Hopcroft–Karp for bipartite graphs). "Pairing things up" is easy while "ordering things into a loop" (Hamiltonian cycle) is hard.' },

    { id: 'factor', name: 'Integer factoring', region: 'NPI', x: 272, y: 165,
      q: 'Does n have a factor between 2 and k?',
      cert: 'a factor f. Check: one division.',
      why: 'No polynomial algorithm is known, and nobody has proved it NP-complete. It is also in co-NP, which makes NP-completeness very unlikely. RSA bets on it staying hard.',
      ifEq: 'It would be in P too.' },
    { id: 'gi', name: 'Graph isomorphism', region: 'NPI', x: 272, y: 235,
      q: 'Are these two graphs the same up to renaming the nodes?',
      cert: 'the renaming. Check: compare every edge.',
      why: 'Babai (2015) found a quasi-polynomial algorithm, so it is very unlikely to be NP-complete, yet no polynomial algorithm is known.',
      ifEq: 'It would be in P too.' },

    { id: 'sat3', name: '3-SAT', region: 'NPC', x: 365, y: 140,
      q: 'Is there a true/false assignment that makes every clause (≤ 3 literals each) true?',
      cert: 'the assignment. Check: plug it in, one pass over the clauses.',
      hard: 'Cook–Levin (1971): every verifier can be written as a Boolean formula, so SAT is NP-hard; SAT reduces to 3-SAT.',
      ifEq: 'It would be in P too.' },
    { id: 'subset', name: 'Subset sum', region: 'NPC', x: 430, y: 148,
      q: 'Does some subset of these numbers add up to T?',
      cert: 'the subset. Check: add it up (the first demo).',
      hard: 'Reduces from 3-SAT (a standard textbook reduction).',
      ifEq: 'It would be in P too.' },
    { id: 'clique', name: 'Clique', region: 'NPC', x: 352, y: 192,
      q: 'Is there a group of k nodes that are all joined to each other?',
      cert: 'the k nodes. Check: test every pair.',
      hard: 'Reduces from 3-SAT. Independent Set and Vertex Cover reduce to and from it (the second demo).',
      ifEq: 'It would be in P too.' },
    { id: 'ham', name: 'Hamiltonian cycle', region: 'NPC', x: 410, y: 192,
      q: 'Is there a loop that visits every node exactly once?',
      cert: 'the order of the nodes. Check: walk it; every step is an edge, no repeats.',
      hard: 'Reduces from Vertex Cover (Karp, 1972).',
      ifEq: 'It would be in P too.' },
    { id: 'color', name: '3-coloring', region: 'NPC', x: 466, y: 186,
      q: 'Can you color the nodes with 3 colors so that no edge joins two nodes of the same color?',
      cert: 'the coloring. Check: look at every edge.',
      hard: 'Reduces from 3-SAT. (2-coloring is in P: it is just "is the graph bipartite?")',
      ifEq: 'It would be in P too.' },
    { id: 'tsp', name: 'Traveling salesman (yes/no)', region: 'NPC', x: 372, y: 240,
      q: 'Is there a tour through every city with total length ≤ L?',
      cert: 'the tour. Check: add up its edges.',
      hard: 'Reduces from Hamiltonian cycle: give existing edges length 1, missing edges length 2, and ask for L = n.',
      ifEq: 'It would be in P too.' },
    { id: 'sudoku', name: 'Sudoku (n²×n² grids)', region: 'NPC', x: 430, y: 242,
      q: 'Can this partly filled n²×n² grid be completed?',
      cert: 'the filled grid. Check: every row, column and box has each symbol once.',
      hard: 'Generalized Sudoku is NP-complete (Yato & Seta, 2003). The ordinary 9×9 board is a fixed size, so it is too small to count: complexity is about how things grow with n.',
      ifEq: 'It would be in P too.' },

    { id: 'tspopt', name: 'TSP: find the best tour', region: 'NPH', x: 565, y: 150,
      q: 'What is the shortest tour?',
      noNP: 'It is not a yes/no question, and NP only contains yes/no (decision) problems.',
      hard: 'If you could solve it, you could answer the yes/no version by comparing the best length with L. So it is at least as hard as an NP-complete problem.',
      ifEq: 'If P = NP it becomes solvable in polynomial time too (binary-search the length, then rebuild the tour). It still is not a yes/no problem, so it still is not "in NP" by definition.' },
    { id: 'tqbf', name: 'Quantified Boolean formulas', region: 'NPH', x: 640, y: 232,
      q: 'Is "for every x there is a y such that for every z … φ" true?',
      noNP: 'It is PSPACE-complete. It would be in NP only if NP = PSPACE, which almost nobody believes: a certificate for "for every x" would need an answer for every x.',
      hard: 'SAT is the special case with only "there exists", so SAT reduces to it.',
      ifEq: 'Still believed hard even then: solving it in polynomial time needs the much stronger P = PSPACE.' },
    { id: 'halt', name: 'Halting problem', region: 'NPH', x: 715, y: 150,
      q: 'Does this program ever stop?',
      noNP: 'It is undecidable: no algorithm exists at all, so certainly no polynomial verifier.',
      hard: 'SAT reduces to it: build a program that tries every assignment and halts only if one works. "As hard as everything in NP" is a floor, not a ceiling.',
      ifEq: 'Still undecidable. P = NP does not touch it.' }
  ];

  var GEO = {
    np:     { cx: 270, cy: 170, rx: 225, ry: 140 },
    p:      { cx: 135, cy: 190, rx: 80,  ry: 85 },
    pEq:    { cx: 270, cy: 170, rx: 225, ry: 140 },
    npi:    { cx: 272, cy: 195, rx: 45,  ry: 80 },
    nph:    { x: 325, y: 20, width: 470, height: 300 },
    nphEq:  { x: 35,  y: 20, width: 760, height: 300 }
  };

  function MapLab(host) {
    this.host = host;
    this.eq = false;             // false: assume P != NP
    this.quiz = false;
    this.cur = null;             // selected item (explore) or current question (quiz)
    this.answered = null;        // region the user guessed
    this.score = { right: 0, total: 0 };
    this.build();
    var start = host.dataset.start || 'sat3';
    this.cur = ITEMS.filter(function (i) { return i.id === start; })[0] || ITEMS[0];
    this.render();
  }

  MapLab.prototype.build = function () {
    var self = this, host = this.host, id = 'np' + (++uid);
    host.classList.add('tl', 'np');
    clear(host);

    var bar = h('div', { class: 'tl-toolbar' }, host);
    var f1 = h('div', { class: 'tl-field' }, bar);
    h('span', null, f1, 'Assume');
    var seg = h('div', { class: 'np-seg', role: 'group', 'aria-label': 'Which world' }, f1);
    this.segNe = h('button', { class: 'tl-btn', type: 'button' }, seg, 'P ≠ NP (what almost everyone believes)');
    this.segEq = h('button', { class: 'tl-btn', type: 'button' }, seg, 'P = NP (the dream)');
    this.segNe.addEventListener('click', function () { self.setWorld(false); });
    this.segEq.addEventListener('click', function () { self.setWorld(true); });
    this.quizBtn = h('button', { class: 'tl-btn tl-primary', type: 'button' }, bar, '🎯 Quiz me');
    this.quizBtn.addEventListener('click', function () { self.toggleQuiz(); });

    var box = h('div', { class: 'tl-tree np-map' }, host);
    var svg = this.svg = s('svg', { class: 'tl-svg np-svg', viewBox: '0 0 820 340', role: 'img', 'aria-label': 'Euler diagram: P inside NP, NP-complete where NP overlaps NP-hard' }, box);
    var defs = s('defs', null, svg);
    var clip = s('clipPath', { id: id + '-clip' }, defs);
    this.clipRect = s('rect', { rx: 70 }, clip);
    this.rNPH = s('rect', { class: 'np-reg np-reg-nph', rx: 70 }, svg);
    this.rNP = s('ellipse', { class: 'np-reg np-reg-np' }, svg);
    this.rNPC = s('ellipse', { class: 'np-reg np-reg-npc', 'clip-path': 'url(#' + id + '-clip)' }, svg);
    this.rP = s('ellipse', { class: 'np-reg np-reg-p' }, svg);
    this.rNPI = s('ellipse', { class: 'np-reg np-reg-npi' }, svg);
    this.lblNP = s('text', { class: 'np-lbl', x: 150, y: 52 }, svg, 'NP');
    this.lblNPH = s('text', { class: 'np-lbl', x: 655, y: 52 }, svg, 'NP-hard');
    this.lblP = s('text', { class: 'np-lbl', x: 135, y: 126 }, svg, 'P');
    this.lblNPC = s('text', { class: 'np-lbl np-lbl-sm', x: 400, y: 98 }, svg, 'NP-complete');
    this.lblNPI = s('text', { class: 'np-lbl np-lbl-xs', x: 272, y: 96 }, svg);
    s('tspan', { x: 272, dy: 0 }, this.lblNPI, 'suspected');
    s('tspan', { x: 272, dy: 13 }, this.lblNPI, 'NP-intermediate');
    this.lblEq = s('text', { class: 'np-lbl', x: 270, y: 52 }, svg, 'P = NP = NP-complete');
    this.gDots = s('g', null, svg);
    this.dotEls = {};
    ITEMS.forEach(function (it) {
      var g = s('g', { class: 'np-dot np-dot-' + it.region, tabindex: '0', role: 'button', 'aria-label': it.name, transform: 'translate(' + it.x + ',' + it.y + ')' }, self.gDots);
      s('title', null, g, it.name);
      s('circle', { r: 8 }, g);
      g.addEventListener('click', function () { self.pick(it); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); self.pick(it); } });
      self.dotEls[it.id] = g;
    });
    this.tag = s('text', { class: 'np-dot-label', 'text-anchor': 'middle' }, svg);

    this.guessBar = h('div', { class: 'np-guess' }, host);
    this.chipBox = h('div', { class: 'np-mapchips', role: 'group', 'aria-label': 'Problems' }, host);
    this.chipEls = {};
    ['P', 'NPI', 'NPC', 'NPH'].forEach(function (r) {
      ITEMS.filter(function (i) { return i.region === r; }).forEach(function (it) {
        var b = h('button', { class: 'np-mchip np-mchip-' + r, type: 'button' }, self.chipBox, it.name);
        b.addEventListener('click', function () { self.pick(it); });
        self.chipEls[it.id] = b;
      });
    });

    this.card = h('div', { class: 'tl-narr np-card', 'aria-live': 'polite' }, host);
    this.note = h('div', { class: 'np-foot' }, host);
  };

  MapLab.prototype.setWorld = function (eq) {
    this.eq = eq;
    if (eq) { this.quiz = false; this.answered = null; }
    this.render();
  };

  MapLab.prototype.pick = function (it) {
    if (this.quiz) return;
    this.cur = it;
    this.render();
  };

  MapLab.prototype.toggleQuiz = function () {
    if (this.quiz) { this.quiz = false; this.answered = null; this.render(); return; }
    this.quiz = true;
    this.eq = false;           // the quiz asks about the world most people believe in
    this.nextQuestion();
  };

  MapLab.prototype.nextQuestion = function () {
    var last = this.cur, nxt;
    do { nxt = ITEMS[rnd(ITEMS.length)]; } while (nxt === last);
    this.cur = nxt;
    this.answered = null;
    this.render();
  };

  MapLab.prototype.guess = function (region) {
    if (!this.quiz || this.answered !== null) return;
    this.answered = region;
    this.score.total++;
    if (region === this.cur.region) this.score.right++;
    this.render();
  };

  function setGeo(el, g) {
    for (var k in g) { el.setAttribute(k, g[k]); el.style[k] = g[k] + 'px'; }
  }

  MapLab.prototype.render = function () {
    var self = this, eq = this.eq, cur = this.cur, quiz = this.quiz;
    var reveal = !quiz || this.answered !== null;

    // ---- geometry (CSS-transitioned, so P = NP animates)
    setGeo(this.rNP, GEO.np);
    setGeo(this.rNPC, GEO.np);
    setGeo(this.rP, eq ? GEO.pEq : GEO.p);
    setGeo(this.rNPI, GEO.npi);
    setGeo(this.rNPH, eq ? GEO.nphEq : GEO.nph);
    setGeo(this.clipRect, eq ? GEO.nphEq : GEO.nph);
    this.svg.setAttribute('class', 'tl-svg np-svg' + (eq ? ' np-world-eq' : ''));
    this.lblEq.style.display = eq ? '' : 'none';
    [this.lblNP, this.lblP, this.lblNPC, this.lblNPI].forEach(function (l) { l.style.display = eq ? 'none' : ''; });

    // ---- highlight the region of the current problem
    var hot = reveal && cur ? cur.region : null;
    this.rP.classList.toggle('np-hot', hot === 'P' || (eq && hot && hot !== 'NPH'));
    this.rNPI.classList.toggle('np-hot', hot === 'NPI' && !eq);
    this.rNPC.classList.toggle('np-hot', hot === 'NPC' && !eq);
    this.rNPH.classList.toggle('np-hot', hot === 'NPH');

    // ---- dots: all visible when exploring, only the revealed one in a quiz
    ITEMS.forEach(function (it) {
      var g = self.dotEls[it.id];
      var show = quiz ? (reveal && it === cur) : true;
      var eqHere = eq && it.region !== 'NPH';
      g.setAttribute('class', 'np-dot np-dot-' + (eqHere ? 'P' : it.region) + (it === cur && reveal ? ' np-dot-cur' : ''));
      g.style.display = show ? '' : 'none';
      var c = self.chipEls[it.id];
      c.className = 'np-mchip np-mchip-' + (eqHere ? 'P' : it.region) + (it === cur && !quiz ? ' np-mchip-cur' : '');
    });
    this.chipBox.style.display = quiz ? 'none' : '';
    if (cur && reveal) {
      this.tag.textContent = cur.name;
      this.tag.setAttribute('x', String(Math.max(90, Math.min(730, cur.x))));
      this.tag.setAttribute('y', String(cur.y - 15));
      this.tag.style.display = '';
    } else this.tag.style.display = 'none';

    // ---- toolbar state
    this.segNe.setAttribute('aria-pressed', eq ? 'false' : 'true');
    this.segEq.setAttribute('aria-pressed', eq ? 'true' : 'false');
    this.segNe.classList.toggle('np-seg-on', !eq);
    this.segEq.classList.toggle('np-seg-on', eq);
    this.quizBtn.textContent = quiz ? '✖ Stop quiz' : '🎯 Quiz me';
    this.quizBtn.classList.toggle('tl-primary', !quiz);

    // ---- guess buttons (quiz only)
    clear(this.guessBar);
    this.guessBar.style.display = quiz ? '' : 'none';
    if (quiz) {
      h('span', { class: 'np-guess-q' }, this.guessBar, 'Where does it live?');
      ['P', 'NPI', 'NPC', 'NPH'].forEach(function (r) {
        var b = h('button', { class: 'tl-btn np-gbtn np-gbtn-' + r, type: 'button' }, self.guessBar, REGION[r].name);
        if (self.answered !== null) {
          b.disabled = true;
          if (r === cur.region) b.classList.add('np-gbtn-right');
          else if (r === self.answered) b.classList.add('np-gbtn-wrong');
        }
        b.addEventListener('click', function () { self.guess(r); });
      });
      if (this.answered !== null) {
        var nb = h('button', { class: 'tl-btn tl-primary', type: 'button' }, this.guessBar, 'Next →');
        nb.addEventListener('click', function () { self.nextQuestion(); });
      }
    }

    // ---- the card
    var html = '';
    if (quiz && this.answered === null) {
      html = '<span class="tl-tag">QUIZ</span><b>' + esc(cur.name) + '</b><br>' + (cur.q ? esc(cur.q) : '') +
        '<br><span class="np-sub">Is it solvable fast, checkable fast, or neither? Pick a region above.</span>';
      this.card.className = 'tl-narr np-card';
    } else if (cur) {
      var ok = !quiz || this.answered === cur.region;
      html = '<span class="tl-tag">' + (quiz ? (ok ? 'RIGHT' : 'NOT QUITE') : esc(REGION[cur.region].name).toUpperCase()) + '</span><b>' + esc(cur.name) + '</b>' +
        (quiz ? ' <span class="np-badge np-badge-' + cur.region + '">' + esc(REGION[cur.region].name) + '</span>' : '') +
        '<br><span class="np-sub">' + esc(cur.q) + '</span>';
      if (cur.cert) html += '<p><b>In NP because:</b> the certificate is ' + esc(cur.cert) + '</p>';
      if (cur.noNP) html += '<p><b>Not in NP because:</b> ' + esc(cur.noNP) + '</p>';
      if (cur.hard) html += '<p><b>NP-hard because:</b> ' + esc(cur.hard) + '</p>';
      if (cur.why) html += '<p>' + cur.why + '</p>';
      if (eq && cur.ifEq) html += '<p class="np-ifeq"><b>If P = NP:</b> ' + esc(cur.ifEq) + '</p>';
      this.card.className = 'tl-narr np-card' + (quiz ? (ok ? ' np-card-ok' : ' np-card-no') : '');
    }
    this.card.innerHTML = html;

    this.note.textContent = quiz && this.score.total ? 'Quiz score: ' + this.score.right + ' / ' + this.score.total
      : (eq ? 'In this world P, NP and NP-complete are one and the same, and the NP-hard region swallows all of NP. The NP-hard-only problems stay outside NP.'
        : 'Nobody has proved P ≠ NP. It is one of the seven Millennium Prize problems (US$1M).');
  };

  // ===================================================================== init

  var MODES = { verify: VerifyLab, reduce: ReduceLab, map: MapLab };

  function init() {
    document.querySelectorAll('.np-lab:not([data-np-ready])').forEach(function (el) {
      el.setAttribute('data-np-ready', '');
      var M = MODES[el.dataset.mode];
      if (!M) { el.textContent = 'np-lab: unknown data-mode "' + el.dataset.mode + '"'; return; }
      try { new M(el); } catch (e) { el.textContent = 'Demo failed to load: ' + e.message; console.error(e); }
    });
  }

  window.NPLabLib = { makePuzzle: makePuzzle, parseEdges: parseEdges, isIndependent: isIndependent, isCover: isCover, isClique: isClique, ITEMS: ITEMS };

  if (window.document$ && typeof window.document$.subscribe === 'function') window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
