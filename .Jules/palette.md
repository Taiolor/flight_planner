## 2025-02-12 - Added ARIA Labels to Interactive Buttons

**Learning:** Native `<button>` elements functioning as icon-only toggles, download actions, or dataset filters critically need contextual `aria-label`s to be perceivable by screen readers. When these buttons are rendered inside a mapped list (like flight weeks), the `aria-label` must include the unique identifier (e.g., `weekNumber`) so screen readers can distinguish between identically purposed buttons.
**Action:** Always inject specific variables (like item IDs, titles, or week numbers) into the `aria-label` string when rendering interactive elements inside mapping loops. Use targeted string replacement instead of global formatting tools to keep PRs lean.
## 2024-08-04 - Wrapping buttons with Links in wouter
**Learning:** Using `wouter` `<Link>` components wrapped around standard buttons (like Shadcn `<Button>`) results in invalid HTML (a `<button>` nested inside an `<a>` tag), which can cause hydration issues or accessibility warnings.
**Action:** Always use the `asChild` prop on the `<Button>` component when wrapping a `<Link>` (e.g., `<Button asChild><Link href="...">...</Link></Button>`) to ensure semantic and accessible HTML.
