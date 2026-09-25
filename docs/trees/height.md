# 2. Tree height, slowly

<div class="big-idea">
<strong>Big idea:</strong> a tree's height is "my taller child's height, plus one". Nothing gets computed on the way <em>down</em>; going down is just asking questions. Every number is produced at an empty child (∅) and built up by <code>+1</code>s on the way back <em>up</em>.
</div>

## What "height" means

The **height of a node** is the number of **edges** on the longest path from that node **down** to a leaf.

```
        A          height(A) = 2   (A → B → D  is the longest way down: 2 edges)
       / \
      B   C        height(B) = 1,  height(C) = 0
     / \
    D   E          height(D) = 0,  height(E) = 0   (leaves: nowhere to go)
```

The **height of a tree** is the height of its root. A leaf has height 0: it's already at the bottom.

## Deriving the function with the three questions

Let's not memorise the code. Let's *derive* it using the [three questions](thinking-recursively.md#the-three-questions), in the order that makes it easiest.

### ③ Combine: how do I use my children's heights?

Say I'm node `B`, and my children tell me their heights: left says `0`, right says `0`.

The longest way down from me has to start by stepping to **one** of my children (one edge), then continue along the longest way down from *that* child. I can only go down one side, so I pick the taller one:

```
height(B) = 1 + max( height(B.left), height(B.right) )
```

That's `max` because a path goes down **one** side, not both. (If you wrote `+` you'd be counting something else. Chapter 4 shows what.)

### ① Base case: what's the height of an empty tree? { #base-case }

This is the part that confuses people, so let's work it out instead of guessing.

Take a **leaf**, like `D`. Both of its children are empty. We already know the answer we *want*: a leaf has height `0`. Plug it into the combine rule:

```
height(D) = 1 + max(height(∅), height(∅))
    0     = 1 + height(∅)
height(∅) = -1
```

<div class="big-idea">
The base case isn't arbitrary. <strong>−1 is the only value that makes a leaf come out as 0.</strong> The empty tree is "one level below the bottom".
</div>

### ② Delegate: what do I ask my children?

Their heights, and I trust whatever they say. Putting it together:

=== "Python"

    ```python
    def height(node):
        if node is None:              # ① empty tree
            return -1
        left_h = height(node.left)    # ② trust the children
        right_h = height(node.right)
        return 1 + max(left_h, right_h)   # ③ combine
    ```

=== "Java"

    ```java
    int height(TreeNode node) {
        if (node == null) return -1;           // ① empty tree
        int leftH = height(node.left);         // ② trust the children
        int rightH = height(node.right);
        return 1 + Math.max(leftH, rightH);    // ③ combine
    }
    ```

=== "C++"

    ```cpp
    int height(TreeNode* node) {
        if (node == nullptr) return -1;        // ① empty tree
        int leftH = height(node->left);        // ② trust the children
        int rightH = height(node->right);
        return 1 + std::max(leftH, rightH);    // ③ combine
    }
    ```

=== "JavaScript"

    ```js
    function height(node) {
      if (node === null) return -1;            // ① empty tree
      const leftH = height(node.left);         // ② trust the children
      const rightH = height(node.right);
      return 1 + Math.max(leftH, rightH);      // ③ combine
    }
    ```

## Edges or nodes? (the "−1 vs 0" confusion)

There are two conventions, and both are common. They're like measuring with two different rulers:

| | Count **edges** | Count **nodes** |
|---|---|---|
| Empty tree | `-1` | `0` |
| Single leaf | `0` | `1` |
| Tree `A–B–D` above | `2` | `3` |
| Base case in code | `return -1` | `return 0` |
| Used by | Most textbooks (CLRS), "height" in interviews | LeetCode 104 *"Maximum Depth of Binary Tree"* |

The **combine step is identical** (`1 + max(L, R)`). Only the base case changes, and every answer shifts by exactly one. If a problem's expected output is off by one from yours, check which ruler it uses.

You can flip between them in the visualizer below with the **Convention** dropdown.

## Watch it run

Step through the function one line at a time. Things to look at, in this order:

1. **The tree.** Amber = running now. Indigo = paused, waiting on a child. Green = done, with its answer in the badge.
2. **The narration** under the tree, which explains each step in words.
3. **The code**: the highlighted line is where the *running* call is.
4. **The call stack**: one box per call that has started but not finished. Each box is that call's **own notepad**, with its own `left_h` and `right_h`.

Click inside the widget and use <kbd>→</kbd> / <kbd>←</kbd>, or press **▶ Play**.

<div class="tree-lab" data-problem="height" data-tree="[A,B,C,D,E]"></div>

!!! example "Experiments worth doing"
    - **Pause right after `D` returns.** Look at `B`'s frame on the stack: `left_h = 0, right_h = ?`. `B` is half-done and *remembers* where it was. That's the call stack at work.
    - **Load the *Linked list* preset.** The stack gets as tall as the tree. That's why recursion uses O(height) memory.
    - **Switch the convention to "Count nodes".** Every badge shifts by 1, and the code only changes on line 3.
    - **Untick "Show ∅ calls".** Less clutter, but you lose the moment every number is actually born.
    - **Type your own tree** in level order, e.g. `[A,B,C,null,D,E,null,null,null,F]`, and press Enter.

## The whole run, written out

For the tree `[A,B,C,D,E]`, here's the full computation as an indented trace. Indentation = how deep the call stack is. Read the `→` lines from bottom to top of each block: that's the answers coming back up.

```text
height(A)                                   A asks B, waits…
│  height(B)                                B asks D, waits…
│  │  height(D)                             D asks its left, waits…
│  │  │  height(∅) → -1                     base case
│  │  │  height(∅) → -1                     base case
│  │  └→ 1 + max(-1, -1) = 0                D is a leaf: 0
│  │  height(E)
│  │  │  height(∅) → -1
│  │  │  height(∅) → -1
│  │  └→ 1 + max(-1, -1) = 0
│  └→ 1 + max(0, 0) = 1                     B hears 0 and 0
│  height(C)
│  │  height(∅) → -1
│  │  height(∅) → -1
│  └→ 1 + max(-1, -1) = 0
└→ 1 + max(1, 0) = 2                        A hears 1 and 0 → answer: 2
```

5 real nodes, 6 empty children, **11 calls** in total. Every `+1` happens on a `└→` line, after both children have answered.

## The five questions that usually cause the confusion

??? question "1. Where's the loop? How does it visit every node?"
    There isn't one. **Each call makes two more calls**, one per child, and the tree's shape does the looping. Every node gets exactly one call because exactly one parent asks about it. The recursion stops at the empty children because the base case doesn't make any calls.

??? question "2. When `B` goes off to compute its right side, how does it remember `left_h`?"
    Every call gets its **own stack frame**: its own private copy of `node`, `left_h` and `right_h`. When `B` calls `height(E)`, `B`'s frame is paused, not destroyed, and it still has `left_h = 0` written on it. When `E` returns, `B` resumes on the exact line where it paused. The call stack panel in the visualizer shows this: every box is a separate notepad.

    The `node` variable doesn't get overwritten either. There isn't one shared `node`; each frame has its own.

??? question "3. When does the `+1` actually happen?"
    **On the way back up.** Going down, the calls only *ask*; nobody can compute anything until their children answer. The first number to exist is a base-case `-1` at the bottom. Then every return adds one. The deeper a leaf, the more `+1`s its `-1` collects on the way to the root, and `max` keeps only the longest chain.

??? question "4. Isn't returning −1 a hack?"
    No. It's forced by the rule that a leaf has height 0 (see [the derivation](#base-case)). If you'd rather avoid negative numbers, count nodes instead and use 0; that's also consistent. What you **can't** do is return `0` for empty *and* claim to be counting edges: then every height is off by one.

??? question "5. Why `max` and not `+`?"
    Height is the length of **one** path, and a path going down can only take one of the two branches, so you pick the better branch. `1 + L + R` answers a different question: it counts *all* the nodes (size). Swapping one operator changes which problem you're solving, which is exactly what [chapter 4](pattern-catalog.md) is about.

## Common bugs

| Bug | Symptom | Fix |
|---|---|---|
| Base case `return 0` but you meant edges | Every answer is 1 too big | `return -1`, or decide you're counting nodes |
| Forgot the `1 +` | Always returns the base value (`-1` or `0`) | Add one for the edge/node at this level |
| No `None` check (e.g. `if node.left is None and node.right is None: return 0` only) | Crashes on nodes with exactly one child | Check `node is None` first. Let empty children be handled by the base case. |
| Calling the recursion again instead of storing it: `if height(l) > height(r): return 1 + height(l)` | Correct, but **very** slow (each node recomputes its subtrees multiple times) | Store results in `left_h`, `right_h` first |
| Computing depth when asked for height (or vice versa) | Root gets 0, leaves get big numbers | See [chapter 3](depth-vs-height.md) |

## Cost

- **Time: O(n).** Every node is called exactly once, plus one call per empty child (there are n + 1 of those in a binary tree with n nodes). That's 2n + 1 calls, each doing O(1) work.
- **Space: O(h)** for the call stack, where h is the height. At any moment the stack holds exactly the path from the root to the current node. Balanced tree: O(log n). Linked-list-shaped tree: O(n), which is why very deep trees can hit Python's recursion limit.

## Check yourself

??? question "What does `height` return for a tree with only a root (edges convention)?"
    `1 + max(-1, -1) = 0`.

??? question "In the tree `[A,B,C,D,E]`, which call is the first to actually *return* a value?"
    `height(∅)` for `D`'s left child. The first return is always a base case, at the far bottom-left.

??? question "At the moment `height(E)` is running, which calls are on the stack?"
    `height(A)` (paused on its left call), `height(B)` (paused on its right call; it already has `left_h = 0`), and `height(E)` on top. `D` and its `∅`s are already finished and gone.

??? question "Rewrite `height` for the nodes convention. How many characters change?"
    One line: `return -1` → `return 0`. The combine step is unchanged.
