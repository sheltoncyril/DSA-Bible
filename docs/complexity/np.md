# P, NP, NP-hard, NP-complete, simply

<div class="big-idea">
<strong>Big idea:</strong> <strong>NP</strong> means a "yes" answer is <strong>easy to check</strong>. <strong>NP-hard</strong> means <strong>at least as hard as everything in NP</strong>. <strong>NP-complete</strong> means both: <strong>in NP and NP-hard</strong>, the hardest problems that are still checkable.
</div>

## Why it's confusing

Two wrong mental models cause most of the pain:

- **"NP means *Not Polynomial*."** It means <em><strong>N</strong>ondeterministic <strong>P</strong>olynomial</em>. NP contains every easy problem too.
- **"NP-hard means *a really hard problem*."** It is a precise claim about **reductions**, and says nothing about whether you can check an answer.

The fix is to keep two questions apart: **how hard is it to *find* an answer?** and **how hard is it to *check* one?**

## Step 1: finding vs checking

A finished Sudoku is easy to check: look at each row, column and box. Filling one in from scratch is hard. Same puzzle, two different jobs.

- **P**: yes/no problems you can **solve** in polynomial time.
- **NP**: yes/no problems where every "yes" has a short **certificate** (a proof) that you can **check** in polynomial time.

Every P problem is also in NP: to check an answer, just solve the problem yourself and ignore the certificate. The open question is whether NP has problems that are **not** in P.

Subset sum: *does some subset of these numbers add up to the target?* Click numbers to propose a subset, then let brute force search for one.

<div class="np-lab" data-mode="verify" data-numbers="12,16,35,15,7,17,13,33" data-target="107"></div>

!!! example "Experiments worth doing"
    - Build the right subset by hand, then try a wrong one. The verdict is instant either way.
    - Press **▶ Try every subset**, then pick a **New puzzle** with 10 numbers. The check is still one pass; the search space is 4× bigger than for 8.
    - Tick **make it unsolvable** and skip to the end. Proving "yes" took one subset. Proving "no" took all of them.

| Class | Plain meaning | You prove membership by | Examples |
|---|---|---|---|
| **P** | quick to **solve** | giving a polynomial algorithm | shortest path, 2-SAT, "is n prime?" |
| **NP** | quick to **check** a "yes" | giving a certificate + a polynomial checker | Sudoku, subset sum, SAT (and all of P) |
| **NP-hard** | **at least as hard as everything in NP** | reducing a known NP-hard problem to it | TSP "find the best tour", Halting problem |
| **NP-complete** | **in NP and NP-hard**: the hardest checkable problems | both of the above | 3-SAT, Clique, Hamiltonian cycle |

## Step 2: reductions ("B is at least as hard as A")

You can't prove a problem is hard by trying every algorithm. Instead you **translate** a problem you already know is hard into yours.

> **A ≤ B** ("A reduces to B") means: a polynomial-time translator turns any instance of A into an instance of B with the **same yes/no answer**.

So **a B-solver plus the translator is an A-solver**. If B were easy, A would be easy. Therefore **B is at least as hard as A**: the arrow points at the harder one.

The simplest translator there is: a set `S` is an *independent set* (no two nodes touch) exactly when everyone else, `V∖S`, is a *vertex cover* (every edge has an end in it). Same edges break both rules.

<div class="np-lab" data-mode="reduce" data-edges="A-B,B-C,C-D,D-E,E-F,F-G,G-A,A-D,B-F"></div>

## Step 3: NP-hard and NP-complete fall out

- **NP-hard**: *every* problem in NP reduces to it. A universal adapter. It doesn't have to be in NP itself (the Halting problem is NP-hard and not even solvable).
- **NP-complete**: NP-hard **and** in NP. The hardest thing that is still checkable.

**Why would such a problem exist at all?** Cook showed it in 1971 (Levin independently). A verifier is just a program, and a fast program unrolls into a Boolean circuit. "Is there a certificate that makes the verifier say yes?" is then "is there an input that makes this circuit output true?", which is exactly **SAT**. So **every NP problem turns into a SAT problem**, and SAT is NP-complete. Karp (1972) reduced SAT to 21 classic problems, and thousands have joined since: one big tree of reductions.

That is why NP-complete problems matter: **if any one of them gets a polynomial algorithm, all of NP does, and P = NP**.

Click a dot to see where a problem lives and why, or press **🎯 Quiz me** and place problems *before* you see the answer. Then flip to "P = NP" and see what moves.

<div class="np-lab" data-mode="map" data-start="sat3"></div>

## Proving a problem is NP-complete: two boxes

1. **In NP.** Name the certificate and the polynomial-time check.
2. **NP-hard.** Pick a **known** NP-complete problem X and reduce **X → yours** (translate any X instance into your problem, keeping the answer).

Only box 2 needs a reduction, and its direction is the classic trap: reducing *your* problem to SAT only shows yours is *no harder* than SAT.

??? example "One typical chain of reductions"
    ```text
    every problem in NP
      └─ Cook–Levin (1971) ─► SAT ─► 3-SAT
                                       ├─► Clique ─► Independent set ─► Vertex cover ─► Hamiltonian cycle ─► TSP (yes/no)
                                       ├─► Subset sum
                                       └─► 3-coloring
    ```
    Many routes exist; textbooks differ. Karp's original tree is in the sources below.

??? example "The code (Python)"
    ```python
    def verify(nums, target, certificate):
        """The NP part: a polynomial-time checker. certificate = indices of the chosen numbers."""
        ok = len(set(certificate)) == len(certificate) and all(0 <= i < len(nums) for i in certificate)
        return ok and sum(nums[i] for i in certificate) == target

    def solve(nums, target):
        """The hard part: 2^n candidates, each checked with verify()."""
        n = len(nums)
        for mask in range(1 << n):
            cert = [i for i in range(n) if mask >> i & 1]
            if verify(nums, target, cert):
                return cert
        return None

    def independent_set_via_vertex_cover(n, edges, k, vertex_cover_solver):
        """A reduction: Independent Set(G, k) -> Vertex Cover(G, n - k). The translator is one subtraction."""
        return vertex_cover_solver(n, edges, n - k)
    ```

## The questions that usually cause the confusion

??? question "If checking is easy, why can't I just try every possible answer?"
    You can. There are 2ⁿ of them. At n = 60 that is about 10¹⁸ checks. "Easy to check" never promised "few candidates to check".

??? question "Is NP-hard harder than NP-complete?"
    NP-complete is a *subset* of NP-hard. NP-hard sets only a **floor** ("at least this hard"). NP-complete adds a **ceiling** ("and no harder than NP"). Some NP-hard problems are far harder: the Halting problem can't be solved at all.

??? question "Does NP-complete mean it needs exponential time?"
    Nobody knows. Every known algorithm is exponential in the worst case, but "no polynomial algorithm exists" is exactly **P ≠ NP**, which is unproven (it is one of the seven Millennium Prize problems).

??? question "Why does one problem being hard make *all* of them hard?"
    Reductions chain: if X ≤ Y and Y ≤ Z then X ≤ Z. Cook–Levin put SAT at the root (everything in NP reduces to it), so every problem reachable from SAT inherits "at least as hard as everything in NP".

??? question "My knapsack / subset-sum DP runs in O(n·T). Did I just prove P = NP?"
    No. O(n·T) is polynomial in the **value** T, but input size is the **number of bits** of T (log T). T = 2⁶⁰ has 60 bits, yet the DP does about 2⁶⁰ work. This is **pseudo-polynomial**. Subset sum is easy when the numbers are small and NP-complete when they are written in binary.

??? question "What do I do when my problem is NP-hard?"
    NP-hardness is about **exact, worst-case, general** instances. Relax one:

    - **Small n:** backtracking, or DP over subsets (O(2ⁿ·n) instead of n!), or meet in the middle (O(2^(n/2)) for subset sum).
    - **Special structure:** max independent set is NP-hard on general graphs but an O(n) DP on [trees](../trees/index.md).
    - **Approximate:** vertex cover has a simple 2-approximation (while some edge is uncovered, take both ends).
    - **Solvers and heuristics:** modern SAT and ILP solvers handle huge real-world instances.

## Common bugs

| Bug | Symptom | Fix |
|---|---|---|
| Reducing in the wrong direction | Your "proof" would make sorting NP-complete too | Reduce **from** a known NP-complete problem **to** yours |
| Calling an optimization problem NP-complete | "TSP is NP-complete" | The yes/no form ("tour ≤ L?") is NP-complete; "find the best tour" is NP-hard |
| Skipping the "in NP" half | Calling a problem NP-complete with no certificate | Give a polynomial verifier, or say only "NP-hard" |
| A slow translator | The reduction itself takes exponential time | The translation must be polynomial too |
| Counting O(n·T) as polynomial | "I solved an NP-complete problem!" | It is pseudo-polynomial: polynomial in the value, not the bit length |
| "NP-hard ⇒ takes exponential time" | Claiming a proven lower bound | It's unproven (P ≠ NP). Say "no known polynomial algorithm" |

## Cost

- **Check:** polynomial, usually O(n) or O(n²), because you look at each part of the certificate once.
- **Solve by brute force:** O(2ⁿ·n) for subset sum, O(n!) for orderings (Hamiltonian cycle, TSP), because there are that many candidates, each checked in polynomial time.
- **Best known for NP-complete problems:** still exponential in the worst case (for example O(2^(n/2)) for subset sum by meet in the middle). Nobody has proved that polynomial is impossible.

## Check yourself

??? question "The Halting problem: NP-hard, NP-complete, both, or neither?"
    **NP-hard, not NP-complete.** SAT reduces to it, so it is at least as hard as everything in NP. But it is undecidable, so it has no polynomial verifier and is not in NP.

??? question "Someone finds a polynomial-time algorithm for Clique. What follows?"
    **P = NP.** Every problem in NP reduces to Clique (it is NP-hard), so translate, then run the Clique algorithm.

??? question "Vertex Cover reduces to your problem X, and X is in NP. What can you say about X?"
    **X is NP-complete.** Reducing a known NP-complete problem to X makes X NP-hard; being in NP gives the other half.

??? question "Your problem X reduces to Vertex Cover. Is X NP-complete?"
    **Not from that alone.** It only shows X is *no harder* than Vertex Cover. X could be sorting.

??? question "If P = NP, does the Halting problem become solvable?"
    **No.** It is undecidable, and P = NP says nothing about undecidable problems. It stays NP-hard and outside NP.

## Sources and further reading

- [NP-hardness (Wikipedia)](https://en.wikipedia.org/wiki/NP-hardness): definitions, reductions, the P/NP/NP-hard/NP-complete diagram.
- [NP (complexity) (Wikipedia)](https://en.wikipedia.org/wiki/NP_(complexity)): the verifier definition, co-NP, Ladner's theorem.
- [Karp's 21 NP-complete problems (Wikipedia)](https://en.wikipedia.org/wiki/Karp%27s_21_NP-complete_problems): the list and the reduction tree.
- [Graph isomorphism problem (Wikipedia)](https://en.wikipedia.org/wiki/Graph_isomorphism_problem): the best-known NP-intermediate candidate.
- [Stephen Cook's official P vs NP problem description](https://goldenticket.fortnow.com/?p=2): the problem statement written for the Clay Millennium Prize.
- [Clay Mathematics Institute: P vs NP](https://www.claymath.org/millennium/p-vs-np/): status (still unsolved).
