## 2024-05-24 - Avoid global formatters

**Learning:** Running global formatters (like `prettier --write .` or `pnpm format`) across the entire repository can irreversibly mangle merge conflict markers and unintentionally modify unrelated files, polluting the `git blame` history and making PRs difficult to review.
**Action:** When committing, manually stage only the specifically modified files, explicitly avoiding agent artifacts (e.g., `.manus/`) and unrelated lockfiles. If formatting is needed, run it only on the specific files changed.

## 2024-05-24 - Single UX improvement PRs

**Learning:** PRs that mix multiple unrelated UX tweaks across different pages violate the instruction to "find and implement ONE micro-UX improvement" and often exceed line limits.
**Action:** Strictly isolate a single UX improvement on a clean branch. Do not scatter multiple small changes across the app in one PR.
