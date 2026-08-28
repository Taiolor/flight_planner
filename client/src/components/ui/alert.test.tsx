/** @vitest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("mantém alertas destrutivos legíveis no modo escuro", () => {
    const view = render(
      <Alert variant="destructive">
        <AlertTitle>Atenção necessária</AlertTitle>
        <AlertDescription>Revise os dados antes de continuar.</AlertDescription>
      </Alert>
    );

    const alert = view.getByRole("alert");
    expect(alert.className).toContain("rounded-xl");
    expect(alert.className).toContain("border-l-4");
    expect(alert.className).toContain("dark:bg-rose-950/70");
    expect(alert.className).toContain("dark:text-rose-50");
    expect(alert.className).toContain("dark:border-l-rose-300");
    expect(view.getByText("Revise os dados antes de continuar.").className).toContain("dark:text-slate-200");
  });
});
