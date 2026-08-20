// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_HOME_EXPANDABLE_PANELS,
  persistHomeExpandablePanels,
  readHomeExpandablePanels,
} from "./homeExpandablePanels";

describe("sanfonas da Home", () => {
  beforeEach(() => window.localStorage.clear());

  it("restaura individualmente os últimos estados de progresso, atenção e variação de preços", () => {
    persistHomeExpandablePanels({
      annualProgress: false,
      attentionCenter: true,
      priceVariation: false,
    });

    expect(readHomeExpandablePanels()).toEqual({
      annualProgress: false,
      attentionCenter: true,
      priceVariation: false,
    });
  });

  it("usa os estados abertos como padrão quando não há preferência salva", () => {
    expect(readHomeExpandablePanels()).toEqual(DEFAULT_HOME_EXPANDABLE_PANELS);
  });
});
