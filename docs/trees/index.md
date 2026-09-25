# Trees & Recursion

This part exists because **tree recursion looks like magic until it suddenly doesn't**. The usual sticking point is a four-line function like this one:

```python
def height(node):
    if node is None:
        return -1
    return 1 + max(height(node.left), height(node.right))
```

You read it, it looks too short to be correct, you try to trace it in your head, you lose track three calls deep, and you're left thinking "I guess it works?"

These chapters fix that in order:

1. **[Thinking recursively about trees](thinking-recursively.md)**: the mental model. Stop tracing; start *trusting*. The three questions.
2. **[Tree height, slowly](height.md)**: apply the model to height, derive every piece (including that strange `-1`), then watch the call stack in slow motion.
3. **[Depth vs height](depth-vs-height.md)**: the other common mix-up. Why depth flows *down* the tree and height flows *up*.
4. **[One template, many problems](pattern-catalog.md)**: the same three-question template solves a whole family of problems, and there's one trap to watch for.
5. **[Practice](practice.md)**: problems to lock it in.

!!! tip "If you only have ten minutes"
    Read the **three questions** in [chapter 1](thinking-recursively.md#the-three-questions), then play with the [height visualizer](height.md#watch-it-run) on the *Linked list* preset and the *Full* preset. Watch the call stack panel.
