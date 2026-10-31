/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { rememberNavigationFocus, restoreNavigationFocus } from "./navigationFocus";

describe("navigationFocus", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("restaura o foco do controle que originou o retorno da rota", () => {
    const trigger = document.createElement("button");
    trigger.dataset.navigationFocus = "home-navigation-menu-trigger";
    document.body.append(trigger);

    rememberNavigationFocus("/", "home-navigation-menu-trigger");

    expect(restoreNavigationFocus("/")).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(restoreNavigationFocus("/")).toBe(false);
  });
});
