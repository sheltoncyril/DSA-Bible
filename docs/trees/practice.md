# 5. Practice

For each problem, **before opening anything**, answer on paper:

1. **Direction:** does a node's answer depend on what's above it (top-down, parameter) or below it (bottom-up, return value)?
2. **The three questions:** ① empty tree? ② what do I need from my children? ③ how do I combine?
3. **The one-child check:** what happens at a node with exactly one child?

Then open the hint, and only then the solution.

---

## P1. Maximum depth (LeetCode 104)

Return the number of **nodes** on the longest root-to-leaf path.

??? tip "Hint"
    This is height, counting nodes. Which base case gives a leaf the value 1?

??? success "Solution"
    Bottom-up. ① `0`. ② depths of both subtrees. ③ `1 + max(L, R)`.

    ```python
    def maxDepth(root):
        if root is None:
            return 0
        return 1 + max(maxDepth(root.left), maxDepth(root.right))
    ```

## P2. Invert a binary tree (LeetCode 226)

Mirror the tree: swap every node's left and right children.

??? tip "Hint"
    Assume the recursive call correctly inverts a subtree and returns its root. What's left for *you* to do?

??? success "Solution"
    ① Empty tree → return `None`. ② Invert both subtrees (trust it). ③ Attach them swapped.

    ```python
    def invertTree(node):
        if node is None:
            return None
        L = invertTree(node.left)
        R = invertTree(node.right)
        node.left, node.right = R, L
        return node
    ```

    Here the recursion returns a *tree* instead of a number, but the three-question shape is identical.

## P3. Same tree (LeetCode 100)

Are two trees identical in shape and values?

??? tip "Hint"
    Recurse on *pairs*: `same(p, q)`. There are now several base cases: both empty, one empty, values differ.

??? success "Solution"
    ```python
    def isSameTree(p, q):
        if p is None and q is None:
            return True                  # two empty trees match
        if p is None or q is None:
            return False                 # one empty, one not
        if p.val != q.val:
            return False
        return isSameTree(p.left, q.left) and isSameTree(p.right, q.right)
    ```

## P4. Balanced binary tree (LeetCode 110)

A tree is balanced if, at **every** node, the heights of the two subtrees differ by at most 1.

??? tip "Hint"
    The obvious version calls `height()` at every node, and `height()` itself visits the whole subtree, which gives O(n²). Can a single recursion return the height **and** report "unbalanced" at the same time? (Heights are never negative in the nodes convention…)

??? success "Solution"
    Bottom-up. Return the height, or the sentinel `-1` meaning "somewhere below me is unbalanced". A parent that hears `-1` passes it straight up.

    ```python
    def isBalanced(root):
        def check(node):
            if node is None:
                return 0
            L = check(node.left)
            if L == -1: return -1
            R = check(node.right)
            if R == -1: return -1
            if abs(L - R) > 1: return -1
            return 1 + max(L, R)
        return check(root) != -1
    ```

    Like diameter, this is **height with one extra line**. O(n).

## P5. Path sum (LeetCode 112)

Is there a root-to-**leaf** path whose values add up to `target`?

??? tip "Hint"
    "Sum of values from the root to here" depends on **ancestors**, so which direction is that? And watch the one-child case: the path must end at a *leaf*.

??? success "Solution"
    Top-down: pass the remaining amount down.

    ```python
    def hasPathSum(node, target):
        if node is None:
            return False
        remaining = target - node.val
        if node.left is None and node.right is None:   # a real leaf
            return remaining == 0
        return hasPathSum(node.left, remaining) or hasPathSum(node.right, remaining)
    ```

    If you'd written `if node is None: return target == 0`, a node with one child would count its empty side as a path, which is the same trap as [min depth](pattern-catalog.md#the-trap-minimum-depth).

## P6. Diameter (LeetCode 543)

Longest path (in edges) between any two nodes.

??? tip "Hint"
    See [chapter 4](pattern-catalog.md#height-in-disguise-diameter). Return height, record `left_h + right_h + 2` on the side.

??? success "Solution"
    ```python
    def diameterOfBinaryTree(root):
        best = 0
        def height(node):
            nonlocal best
            if node is None:
                return -1
            L, R = height(node.left), height(node.right)
            best = max(best, L + R + 2)
            return 1 + max(L, R)
        height(root)
        return best
    ```

## P7. Count nodes at depth k

Return how many nodes are exactly `k` edges below the root.

??? success "Solution"
    Top-down: pass the depth (or the remaining distance) down.

    ```python
    def count_at_depth(node, k):
        if node is None:
            return 0
        if k == 0:
            return 1
        return count_at_depth(node.left, k - 1) + count_at_depth(node.right, k - 1)
    ```

    Information goes **down** (`k - 1`) *and* **up** (the count). Plenty of real problems mix both directions.

---

## Progress

- [ ] P1 Maximum depth
- [ ] P2 Invert tree
- [ ] P3 Same tree
- [ ] P4 Balanced tree
- [ ] P5 Path sum
- [ ] P6 Diameter
- [ ] P7 Count at depth k
