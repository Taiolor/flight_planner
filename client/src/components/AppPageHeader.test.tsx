/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Bell } from "lucide-react";
import { describe, expect, it } from "vitest";
import { AppPageHeader } from "./AppPageHeader";

describe("AppPageHeader", () => {
  it("oferece título, retorno acessível e área opcional de ações", () => {
    render(<AppPageHeader icon={Bell} title="Painel operacional" actions={<button>Atualizar</button>} />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Painel operacional" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeTruthy();
  });
});
