# 1. Thinking recursively about trees

<div class="big-idea">
<strong>Big idea:</strong> you don't write a tree function by imagining the whole computation. You write it by answering one small question for <em>one</em> node, assuming its children already know their answers.
</div>

## Why tracing in your head fails

When a recursive function confuses you, the instinct is to trace it: "`height(A)` calls `height(B)`, which calls `height(D)`, which calls `height(None)`, which returns… wait, where was I in `B`?"

That doesn't work, and it's not a skill problem. A tree with 15 nodes makes 31 calls, each paused at a different line with its own variables. Nobody holds that in their head. Tracing is useful for **checking** a function (and [chapter 2](height.md#watch-it-run) has a tool that does it for you). It's no good for **understanding** or **writing** one.

You need a different question to ask.

## A tree is made of smaller trees

The definition of a binary tree is already recursive:

> A binary tree is **either empty**, **or** it is a node with a **left binary tree** and a **right binary tree**.

Read that twice, because the whole chapter depends on it:

- There are exactly **two cases**: *empty*, or *a node plus two smaller trees*.
- The children aren't "nodes" in any special sense. **Each child is the root of a complete tree of its own.** `B` isn't just "A's left child"; it's a whole tree that happens to be hanging off `A`.

So any question you can ask about a tree ("how tall?", "how many nodes?", "what's the biggest value?") you can also ask about each subtree. And if you knew the answers for the two subtrees, the answer for the whole tree is usually one line away.

That's the entire trick. The code just follows the shape of the definition:

```python
def solve(node):
    if node is None:          # case 1: the empty tree
        return ...            #   -> answer it directly
    L = solve(node.left)      # case 2: a node + two smaller trees
    R = solve(node.right)     #   -> get the answers for the smaller trees
    return combine(node, L, R)#   -> build my answer from theirs
```

## The manager analogy

Picture a company org chart. The CEO is asked: *"How many levels deep does your organization go?"*

The CEO doesn't walk down every corridor. They ask their two direct reports, *"How deep does **your** part go?"*, wait for two numbers, take the bigger one, and add one for themselves.

Each of those reports does **exactly the same thing** with *their* two reports. Nobody in the company ever sees the whole org chart. Everyone does one small calculation with two numbers.

Eventually someone asks a position that's **empty** ("who reports to the intern?" "nobody"). An empty position doesn't delegate; it answers straight away. That's the **base case**, and it's why the process stops.

!!! note "Two things this analogy gets right"
    1. **Questions go down, answers come up.** No one can answer until the people below them have answered. The actual arithmetic all happens on the way back *up*.
    2. **Each person only talks to their direct reports.** A manager never reaches two levels down. In code: a call only ever uses `node.left` and `node.right`, never `node.left.left`.

## The three questions

Every "compute something about a tree" function can be written by answering three questions. Answer them, and the code is basically written.

<div class="big-idea">
<strong>① Base case:</strong> what is the answer for the <em>empty</em> tree?<br>
<strong>② Delegate:</strong> what do I need to know about my left and right subtrees? (Call the function on them and <em>trust</em> the result.)<br>
<strong>③ Combine:</strong> given my children's answers (and my own value), what's my answer?
</div>

For **height**:

| Question | Answer for height |
|---|---|
| ① Empty tree? | `-1` (chapter 2 shows exactly why: it's the value that makes a leaf come out as 0) |
| ② Need from children? | Their heights: `height(node.left)`, `height(node.right)` |
| ③ Combine? | The taller one plus one edge to reach it: `1 + max(L, R)` |

For **counting nodes**:

| Question | Answer for size |
|---|---|
| ① Empty tree? | `0` (no nodes) |
| ② Need from children? | How many nodes each subtree has |
| ③ Combine? | Everything on the left + everything on the right + me: `L + R + 1` |

Notice what's *not* in those tables: any mention of grandchildren, loops, or "and then it goes back up to…". You never think about the whole tree. That's the point.

## Try it: be one node

This is the most important exercise in the chapter. Click any node below. You **become** that node. You can't see inside your subtrees; you only hear what your two children report. What do you return?

<div class="tree-ask" data-problem="height" data-tree="[A,B,C,D,E,null,F,null,null,G]"></div>

After a few rounds you'll notice that every node, whether it's the root or a leaf, does *the same tiny calculation*. The root isn't doing more work than anyone else. It just gets bigger numbers from its children.

Now the same exercise for counting nodes:

<div class="tree-ask" data-problem="size" data-tree="[A,B,C,D,E,null,F,null,null,G]"></div>

## "But why am I allowed to trust the children?"

This is the "leap of faith", and it sounds like cheating. It isn't. Here's the argument in plain words:

1. The function is **definitely correct on the empty tree**, because you wrote that answer by hand (the base case).
2. **Suppose** it's correct for every tree smaller than some tree `T`.
3. `T`'s children are smaller trees than `T`. So by (2) the recursive calls return correct answers, and if your combine step (③) is right, the answer for `T` is right.
4. Every tree is built up from empty trees, one node at a time, so the correctness spreads from the empty tree to trees of any size, like dominoes.

This is proof by **induction**. You don't need to write proofs, but it's worth knowing that "trust the recursive call" is a real proof technique that always works, provided that:

- your **base case** is correct, and
- every recursive call is on something **strictly smaller** (children always are), and
- your **combine** step is correct *assuming* the children's answers are correct.

!!! tip "The debugging version of this"
    When a recursive tree function gives the wrong answer, **don't trace the whole thing**. Check the three pieces separately:

    1. Is the base case value right? (Test on `None`.)
    2. Is the combine right? (Test by hand on a *single leaf*, then a node with one leaf child.)
    3. Am I recursing on the children, and using the results I got back?

    If all three are right, the function is right. That's the payoff of induction.

## Where the base case really comes from

People often treat the base case as a boring edge case to handle "so it doesn't crash". It's more than that: **the base case is the foundation every other answer is built on.** Every number your function produces started life as a base-case value and got combined on the way up. In the [height visualizer](height.md#watch-it-run), watch the purple `∅` boxes: every single number in the tree is born there.

The next chapter takes height through all of this slowly, including why the base case is `-1` and not `0` (or `0` and not `-1`, depending on who's asking).

## Check yourself

??? question "In `height`, does node `A` ever look at its grandchildren?"
    No. `A` only calls `height(A.left)` and `height(A.right)` and uses the two numbers returned. What happens further down is entirely those calls' business.

??? question "What are the three questions, and what are the answers for 'sum of all values'?"
    ① Empty tree → `0`. ② Ask for the sum of each subtree. ③ `node.val + L + R`.

??? question "Why doesn't the recursion go on forever?"
    Each call is on a strictly smaller tree (a child), and trees are finite, so every chain of calls eventually reaches an empty tree, which returns without recursing.
