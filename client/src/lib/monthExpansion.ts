export function areAllMonthsExpanded(
  monthKeys: string[],
  expandedMonths: ReadonlySet<string>
): boolean {
  return monthKeys.length > 0 && monthKeys.every(monthKey => expandedMonths.has(monthKey));
}

export function getNextExpandedMonths(
  monthKeys: string[],
  expandedMonths: ReadonlySet<string>
): Set<string> {
  return areAllMonthsExpanded(monthKeys, expandedMonths)
    ? new Set<string>()
    : new Set(monthKeys);
}
