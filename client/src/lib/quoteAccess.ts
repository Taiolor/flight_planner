export function canLoadProtectedQuoteData({
  isAuthResolved,
  isAuthenticating,
  isAuthenticated,
}: {
  isAuthResolved: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
}) {
  return isAuthResolved && !isAuthenticating && isAuthenticated;
}
