export function shouldRenderDeferredCharts(
  hasChartData: boolean,
  isRequested: boolean
) {
  return hasChartData && isRequested;
}
