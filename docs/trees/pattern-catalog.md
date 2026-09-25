# 4. One template, many problems

<div class="big-idea">
<strong>Big idea:</strong> once height clicks, a whole family of problems becomes the same function with a different base case and a different combine line. Learn the template once; then each new problem is just answering the three questions again.
</div>

## The template

```python
def solve(node):
    if node is None:
        return BASE                     # ① answer for the empty tree
    L = solve(node.left)                # ② trust the children
    R = solve(node.right)
    return COMBINE(node.val, L, R)      # ③ my answer from theirs
```

| Problem | ① `BASE` | ③ `COMBINE` | Why that base? |
|---|---|---|---|
| Height (edges) | `-1` | `1 + max(L, R)` | makes a leaf = 0 |
| Height (nodes) / max depth | `0` | `1 + max(L, R)` | makes a leaf = 1 |
| Size (count nodes) | `0` | `1 + L + R` | empty has no nodes |
| Sum of values | `0` | `val + L + R` | adding 0 changes nothing |
| Maximum value | `-inf` | `max(val, L, R)` | `-inf` never wins a `max` |
| Count leaves | `0` | `L + R` (plus a leaf check → `1`) | empty has no leaves |

Height and size differ by **one symbol**: `max` vs `+`. Height follows one path down; size counts everything.

!!! tip "Choosing a base case: the identity trick"
    The base value should be whatever **doesn't change the answer** when you combine it: `0` for `+`, `-inf` for `max`, `+inf` for `min`, `True` for `and`. Then empty children quietly disappear from the calculation. Height's `-1` works the same way: combined with `1 + ...`, it cancels out to give 0 at a leaf.

## Play with the whole family

Same tree, same stepping, different problem. Switch the **Problem** dropdown and notice that the *shape* of the execution (the order of calls, the stack, amber → indigo → green) is **identical** every time. Only the numbers change.

<div class="tree-lab" data-problems="height,size,sum,max,leaves" data-tree="[5,3,8,1,4,null,9]"></div>

## The trap: minimum depth

**Minimum depth** = number of nodes on the *shortest* path from the root to a **leaf**. The template suggests swapping `max` for `min`:

```python
def min_depth(node):          # ⚠ looks right, is wrong
    if node is None:
        return 0
    return 1 + min(min_depth(node.left), min_depth(node.right))
```

Try it on a node with only **one** child. The empty side returns `0`, `min` picks it, and the node claims it's 1 away from a leaf, but it **isn't a leaf**. An empty side isn't a path to a leaf, so it shouldn't count.

Step through it on this tree, where the root `A` has only one child. The real answer is 3 (`A → B → C`), but the naive version says 1. The narration flags the moment it goes wrong:

<div class="tree-lab" data-problems="minDepthBuggy,minDepth" data-tree="[A,B,null,C,D]"></div>

!!! warning "Why `max` got away with it"
    With `max`, an empty side's `-1` (or `0`) always *loses* to a real child, so it never affects the answer. With `min`, the empty side *wins*. **Whenever your combine step could prefer the empty side, check the one-child case by hand.** That's where tree functions usually break.

The fix: if one side is empty, the only real option is the other side.

```python
def min_depth(node):
    if node is None:
        return 0
    L, R = min_depth(node.left), min_depth(node.right)
    if node.left is None:   return 1 + R
    if node.right is None:  return 1 + L
    return 1 + min(L, R)
```

## Height in disguise: diameter

**Diameter** = number of edges on the longest path between **any** two nodes. The path doesn't have to go through the root.

Key insight: every path has one **highest node**, where it "bends". A path that bends at node X goes down X's left side as far as possible and down X's right side as far as possible:

```
longest path bending at X = (height(X.left) + 1) + (height(X.right) + 1)
```

So: compute height exactly as before, and at every node also check "what if the path bends here?", keeping the best one seen. The recursion **returns** one thing (height, which the parent needs) but **records** another (the best diameter), because a parent can't use its child's diameter to build its own.

<div class="tree-lab" data-problem="diameter" data-tree="[A,B,C,D,E,null,null,F,null,null,G]" data-show-null="false"></div>

!!! note "What a function returns vs. what the problem asks"
    Diameter is the first case where **what the recursion returns (height) isn't the final answer (diameter)**. That's common in harder problems: the return value is whatever the *parent* needs to do its job, and the real answer is collected on the side. Ask yourself: *"what does my parent need from me?"* That's your return value.

## Check yourself

??? question "Count the nodes with value > 10. Base and combine?"
    Base `0`. Combine `(1 if val > 10 else 0) + L + R`.

??? question "Is every value in the tree positive? Base and combine?"
    Base `True` (an empty tree has no non-positive values). Combine `val > 0 and L and R`.

??? question "Why can't diameter just be `1 + max(L, R)` where L and R are the children's diameters?"
    The longest path might bend at the current node, joining the deepest points of *both* subtrees, and neither child's diameter describes that. A parent needs its children's **heights** to compute that path, which is why the recursion returns height.
