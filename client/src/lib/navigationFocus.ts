const pendingFocusByRoute = new Map<string, string>();

/** Registra o controle que deve receber foco quando a rota de origem reaparecer. */
export function rememberNavigationFocus(route: string, focusId: string) {
  pendingFocusByRoute.set(route, focusId);
}

/** Restaura o foco sem alterar a rolagem já recuperada para a rota. */
export function restoreNavigationFocus(route: string) {
  const focusId = pendingFocusByRoute.get(route);
  if (!focusId) return false;

  const target = Array.from(
    document.querySelectorAll<HTMLElement>("[data-navigation-focus]")
  ).find(element => element.dataset.navigationFocus === focusId);

  if (!target) return false;

  target.focus({ preventScroll: true });
  pendingFocusByRoute.delete(route);
  return true;
}
