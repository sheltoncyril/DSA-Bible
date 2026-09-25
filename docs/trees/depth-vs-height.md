# 3. Depth vs height (down vs up)

<div class="big-idea">
<strong>Big idea:</strong> <em>depth</em> is about what's <strong>above</strong> a node, so it's known on the way <strong>down</strong> and passed to children as an <strong>argument</strong>. <em>Height</em> is about what's <strong>below</strong> a node, so it's only known on the way back <strong>up</strong>, from children's <strong>return values</strong>.
</div>

## Two measurements that point in opposite directions

- **Depth of a node** = number of edges from the **root down to it**. The root has depth 0.
- **Height of a node** = number of edges from it **down to its deepest leaf**. Leaves have height 0.

Click any node. The <span style="color:#c026d3">**pink path**</span> goes up to the root (depth). The <span style="color:#ea580c">**orange path**</span> goes down to the farthest leaf (height).

<div class="tree-measure" data-tree="[A,B,C,D,E,null,F,null,null,G]"></div>

Now press **Label all depths**, then **Label all heights**. Depths count *up* as you go down the tree; heights count *up* as you go up the tree. They're mirror images, and they're computed in opposite directions.

## Who has the information?

Ask: *to know this number for node X, whose information do I need?*

- **Depth of X** depends only on X's **ancestors** (how many there are). X's parent knows its own depth, so it can tell X: "you're one deeper than me." → **pass it down as a parameter.**
- **Height of X** depends only on X's **descendants**. Nobody above X knows anything about X's subtree. X has to ask its children and wait. → **get it back as a return value.**

<div class="big-idea">
<strong>Rule of thumb:</strong> if a node's answer depends on what's <strong>above</strong> it, pass it <strong>down</strong> through a parameter (top-down). If it depends on what's <strong>below</strong> it, bring it <strong>up</strong> through the return value (bottom-up).
</div>

=== "Depth: top-down (parameter)"

    ```python
    def label_depth(node, depth):
        if node is None:
            return
        node.depth = depth                  # known immediately, on arrival
        label_depth(node.left, depth + 1)   # hand it down
        label_depth(node.right, depth + 1)

    label_depth(root, 0)
    ```

=== "Height: bottom-up (return value)"

    ```python
    def height(node):
        if node is None:
            return -1
        left_h = height(node.left)      # must wait for children…
        right_h = height(node.right)
        return 1 + max(left_h, right_h) # …known only on the way back
    ```

## Watch *when* the numbers appear

Switch between the two problems below and press **▶ Play** on each. Don't look at the values, look at the **timing**:

- **Depth:** a node's badge appears **the moment it's called**, before any of its children are visited. The numbers go down with the calls.
- **Height:** a node's badge appears **only when it returns**, after both children have answered. The numbers come back up with the returns. The root is the *last* to know.

<div class="tree-lab" data-problems="depth,height" data-tree="[A,B,C,D,E,null,F]" data-show-null="false"></div>

Also look at the **call stack** for depth: each frame carries `depth` in its signature, e.g. `label_depth(D, 2)`. The information travels in the *arguments*. For height, the frames carry `left_h` and `right_h`: the information comes back in *return values*.

## "Maximum depth" is the height of the root

This one causes real confusion, because LeetCode 104 is called *"Maximum Depth of Binary Tree"* and the standard solution is the height function.

It's not a contradiction: the **deepest node's depth** equals the **root's height** (both are the length of the longest root-to-leaf path). You can compute that number either way:

=== "Bottom-up (height of root)"

    ```python
    def max_depth(node):
        if node is None:
            return 0                    # nodes convention, like LeetCode
        return 1 + max(max_depth(node.left), max_depth(node.right))
    ```

=== "Top-down (track deepest depth seen)"

    ```python
    def max_depth(root):
        best = 0
        def visit(node, depth):
            nonlocal best
            if node is None:
                return
            best = max(best, depth)     # depth known on the way down
            visit(node.left, depth + 1)
            visit(node.right, depth + 1)
        visit(root, 1)                  # nodes convention: root is depth 1
        return best
    ```

Both are O(n) and both are correct. The bottom-up one is shorter because the question "how tall is the tree below me?" is naturally a *bottom-up* question. The top-down one needs a shared `best` variable because no single call knows the final answer.

## Side by side

| | Depth | Height |
|---|---|---|
| Measures | edges **up** to the root | edges **down** to the deepest leaf |
| Root | 0 | the tree's height |
| Leaves | vary | 0 |
| Depends on | ancestors | descendants |
| Recursion direction | top-down | bottom-up |
| Information travels in | **parameters** | **return values** |
| Known at | the call (pre-order) | the return (post-order) |
| Base case does | nothing / stops | returns `-1` (or `0`) |

## Check yourself

??? question "Two siblings always have the same ___. (depth or height?)"
    **Depth**: they have the same parent, so the same ancestors. Their heights can be completely different.

??? question "A node's height changes if you add a node somewhere. Where?"
    Only if the new node is in its **subtree** (below it). A node's depth changes only if something changes **above** it.

??? question "You need 'for every node, the sum of values on the path from the root to it'. Top-down or bottom-up?"
    Top-down: it depends on ancestors. Pass `running_sum + node.val` down as a parameter.

??? question "You need 'for every node, the number of nodes in its subtree'. Top-down or bottom-up?"
    Bottom-up: it depends on descendants. Return `1 + L + R`.
