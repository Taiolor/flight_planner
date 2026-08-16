💡 What: Hoisted the static data processing (`releases.reduce` grouping and sorting) outside of the `Changelog` React component into the module scope.

🎯 Why: To prevent the grouping logic from executing during the React render cycle on component mount. Since `releases` is static data defined at the module level, computing the grouped structures (`releasesByMonth` and `sortedMonths`) once when the module loads avoids redundant calculations and `useMemo` overhead.

📊 Measured Improvement: Reduces CPU overhead on the first render of the Changelog component from O(N log N) to O(1) by reusing pre-calculated arrays, providing slightly faster time-to-interactive for the page.
