/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { LockKeyhole } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    protectedAccess: {
      record: { useMutation: () => ({ mutate: () => undefined }) },
    },
  },
}));

import { AccessGate } from "./LoginRequiredMessageBox";

describe("AccessGate", () => {
  it("mantém uma mensagem de acesso clara e um CTA navy acessível", () => {
    render(
      <AccessGate
        icon={LockKeyhole}
        title="Financeiro protegido"
        description="Entre para consultar seus indicadores."
        onLogin={vi.fn()}
        loginLabel="Entrar no Financeiro"
      />
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Financeiro protegido" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entrar no Financeiro" }).className).toContain("bg-[#071a36]");
  });
});
