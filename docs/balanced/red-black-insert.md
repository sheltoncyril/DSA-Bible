# Red-black insert, simply

<div class="big-idea">
<strong>Big idea:</strong> insert the new node <strong>red</strong>. The only thing that can go wrong is <strong>red under red</strong>. To fix it, <strong>look at the uncle</strong>: red uncle → recolor and move up; black uncle → rotate and you're done.
</div>

## The rules (and why they keep the tree balanced)

1. The root is **black**.
2. **No red node has a red child.**
3. Every path from a node down to an empty spot has the **same number of black nodes**.

Think of **black nodes as the real floors** of a building: every path goes through the same number of them (rule 3). **Red nodes are half-floors squeezed in between**, and you can't stack two half-floors (rule 2). So the longest path is at most **2×** the shortest, and the tree can never turn into a long, skinny list.

## Insert = normal insert + fix "red under red"

A new node is always **red**. A red node doesn't add a floor, so rule 3 stays safe. If its parent is black, you're done. If its parent is red, rule 2 breaks. That's the one problem `fix_insert` solves, and **the uncle** (the parent's sibling) tells you how:

| Uncle | What you do | Then |
|---|---|---|
| 🔴 **Red** | **Recolor:** parent + uncle → black, grandparent → red | The grandparent is red now and might be under a red. **Move up** to it and loop. |
| ⚫ **Black**, and the path is a **straight line** (right-right or left-left) | Parent → black, grandparent → red, **rotate the grandparent** so the parent becomes the top | **Done.** The new top is black. |
| ⚫ **Black**, and the path is a **zig-zag** (right-left or left-right) | **Rotate the parent** first to straighten it out, then do the straight-line fix | **Done.** |

Finally, **paint the root black** (recoloring can turn it red, and a black root is always fine).

!!! note "An empty uncle counts as black."

## Watch it

Pick a preset (start with the three cases, in order) and press **▶ Play**, or step with <kbd>→</kbd>. The tags show **cur / parent / grandpa / uncle**. The rule pills at the top turn red when a rule is broken.

<div class="rb-lab" data-insert="10,20,30"></div>

Try **Sorted input 1…10**. A plain BST would be a 10-node straight line; this one stays 5 levels tall.

## Why your pseudocode looks so long

It's **the same logic written twice**, once for "parent is a *right* child" and once as its **mirror image** for "parent is a *left* child". Every `left` swaps with `right`. Learn one half and you know both. The demo's code panel only shows the half that's running, with the directions filled in.

??? example "The code (Python)"
    ```python
    def insert(self, value):
        new_node = Node(value)            # new nodes start RED
        # ... your normal BST insert goes here ...
        self.fix_insert(new_node)

    def fix_insert(self, node):
        while node != self.root and node.parent.color == "red":
            parent = node.parent
            grandparent = parent.parent
            if parent == grandparent.right:
                uncle = grandparent.left
                if uncle and uncle.color == "red":          # uncle red: recolor, move up
                    uncle.color = "black"
                    parent.color = "black"
                    grandparent.color = "red"
                    node = grandparent
                else:                                        # uncle black: rotate
                    if node == parent.left:                  # zig-zag: straighten first
                        node = parent
                        self.rotate_right(node)
                        parent = node.parent
                    parent.color = "black"                   # straight line
                    grandparent.color = "red"
                    self.rotate_left(grandparent)
            else:                                            # mirror image
                uncle = grandparent.right
                if uncle and uncle.color == "red":
                    uncle.color = "black"
                    parent.color = "black"
                    grandparent.color = "red"
                    node = grandparent
                else:
                    if node == parent.right:
                        node = parent
                        self.rotate_left(node)
                        parent = node.parent
                    parent.color = "black"
                    grandparent.color = "red"
                    self.rotate_right(grandparent)
        self.root.color = "black"
    ```

    `uncle and uncle.color == "red"` treats a missing uncle (`None`) as black. If your tree uses a black `NIL` sentinel node instead of `None`, `uncle.color == "red"` alone is enough.

## The questions that usually cause the confusion

??? question "Why is the new node red and not black?"
    A black node would add a floor to one path only, which breaks rule 3 everywhere above it and is hard to fix. A red node can only break rule 2, and only in one spot, which is easy to fix.

??? question "Why does recoloring loop, but rotating stops?"
    Recoloring makes the **grandparent red**, and the grandparent's parent might be red too, so the same problem can reappear two levels up. Rotating leaves a **black** node on top, and nothing above a black node can be red-under-red. So the loop ends.

??? question "Why rotate the parent first in the zig-zag case?"
    The final rotation only works on a **straight line** (grandpa → parent → child all going the same way). The first rotation just turns the zig-zag into a straight line. Then it's the straight-line case.

??? question "Why doesn't recoloring break rule 3?"
    The grandparent gives up its black, and its two children (parent and uncle) each gain one. Any path through the grandparent passes through exactly one of them, so every path's black count stays the same.

**Cost:** O(log n) per insert, because the tree height is O(log n). The loop moves up two levels each time, and there are **at most 2 rotations** per insert.

## Check yourself

??? question "Insert 10, 20, 30 into an empty tree. Which case happens, and what's the root afterwards?"
    30's parent 20 is red, and its uncle (10's left, empty) is black. 10 → 20 → 30 is a straight line, so 20 goes black, 10 goes red, and you rotate left at 10. The root is **20**, with red 10 and red 30 as its children.

??? question "The parent is red and the uncle is red. Do you rotate?"
    No. You recolor (parent and uncle black, grandparent red) and move up to the grandparent.
