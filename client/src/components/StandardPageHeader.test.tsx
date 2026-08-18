/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Bell } from "lucide-react";
import { describe, expect, it } from "vitest";
import { StandardPageHeader } from "./StandardPageHeader";

describe("StandardPageHeader", () => {
  it("mantém a navegação de retorno, título e ações no cabeçalho padrão", () => {
    render(
      <StandardPageHeader
        icon={Bell}
        title="Admin · Notificações · 2026"
        actions={<button type="button">Atualizar</button>}
      />
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Admin · Notificações · 2026" })
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Voltar" })
        .getAttribute("href")
    ).toBe("/");
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeTruthy();
  });
});
