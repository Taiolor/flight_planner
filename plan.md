1. **Consolidate multiple `useMemo` blocks for annual data in `client/src/pages/Home.tsx`.**
   - The components current have two separate `useMemo` blocks tracking similar things. One produces `annualSummaryData` and the other extracts metrics such as `annualTotalIssued`, `annualIssuedCount`, `annualSmilesTotal`, and `annualLatamPassTotal`.
   - Both of these blocks iterate over the same dataset (`weeksData`) to accumulate values per month and overall totals.
   - We can merge these two iterations into a single O(N) pass to reduce redundant array iteration overhead during re-renders, fulfilling the requirement for a Bolt optimization.
2. **Review correctness and type issues**
   - We need to correctly structure the return type and access them correctly since they will be returned from a single `useMemo`.
   - Destructure all required state properly: `const { annualSummaryData, annualTotalIssued, annualIssuedCount, annualSmilesTotal, annualLatamPassTotal } = useMemo(...)`.
3. **Execute standard Pre-commit Checks (Lint, Test, etc).**
   - Ensure `pnpm check` and `pnpm test` pass.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit the Pull Request.**
   - Title: `⚡ Bolt: [performance improvement]`
   - Description format matching BOLT's requirement.
