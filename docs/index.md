---
hide:
  - navigation
---

# DSA Bible

A personal textbook for the data-structures & algorithms ideas that don't click the first time.

Each chapter explains **one** hard idea slowly: the intuition first, then the code, then an **interactive demo** you can step through line by line, then the usual ways people get it wrong. When something confuses me in the future, it gets a chapter here.

<div class="big-idea">
<strong>How to read this book:</strong> don't just read the demos, <em>poke</em> them. Step backwards, load weird trees, try to predict the next step before you click. The confusion goes away once you can predict what happens next.
</div>

## Start here

<div class="chapter-grid">
  <a href="trees/thinking-recursively/"><b>1. Thinking recursively about trees</b><span>Why you should stop tracing, and the three questions that write every tree function for you.</span></a>
  <a href="trees/height/"><b>2. Tree height, slowly</b><span>Height from first principles, where the −1 comes from, and a step-by-step visualizer of the call stack.</span></a>
  <a href="trees/depth-vs-height/"><b>3. Depth vs height</b><span>Numbers that flow <em>down</em> as arguments vs numbers that flow <em>up</em> as return values.</span></a>
  <a href="trees/pattern-catalog/"><b>4. One template, many problems</b><span>Size, sum, max, leaves, min-depth (and its trap), diameter: all the same function.</span></a>
  <a href="trees/practice/"><b>5. Practice</b><span>Classic problems with hints and worked solutions.</span></a>
  <a href="balanced/red-black-insert/"><b>Red-black insert, simply</b><span>Insert red, fix red-under-red, and look at the uncle. With a step-through demo that animates the rotations.</span></a>
</div>

## Try it right now

The widget below is the main tool of this book. Press **▶ Play** (or click inside it and use <kbd>←</kbd> <kbd>→</kbd>) and watch how a tree works out its own height: nobody knows the answer at first, and the answers are passed back up from the bottom.

<div class="tree-lab" data-problem="height" data-tree="[A,B,C,D,E]"></div>

## Colour key used in every tree demo

| Colour | Meaning |
|---|---|
| :material-circle:{ style="color:#f59e0b" } amber | the call that is **running right now** (top of the call stack) |
| :material-circle:{ style="color:#5468d4" } indigo | a call that is **paused**, waiting for a child to answer |
| :material-circle:{ style="color:#16a34a" } green | a call that has **finished**; its answer is in the badge |
| :material-square-outline:{ style="color:#9333ea" } ∅ | an **empty child** (`None`). Calls on it still happen; that's where the base case runs. |
