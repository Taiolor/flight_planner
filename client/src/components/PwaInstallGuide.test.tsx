/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    pwaInstallations: {
      record: { useMutation: () => ({ mutate: vi.fn(), isError: false, isPending: false }) },
      deleteCurrent: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import { PwaInstallGuide } from "./PwaInstallGuide";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PwaInstallGuide", () => {
  it("orienta a instalação manual quando o navegador não oferece o prompt nativo", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    render(<PwaInstallGuide isAuthenticated={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Instalar aplicativo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(screen.getByText("Adicionar à Tela de Início")).toBeTruthy();
    expect(dialog.textContent).toContain("No Android ou computador");
  });

  it("aciona o prompt nativo quando a instalação está disponível", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    render(<PwaInstallGuide isAuthenticated={false} />);
    window.dispatchEvent(installEvent);

    fireEvent.click(screen.getByRole("button", { name: "Instalar aplicativo" }));
    fireEvent.click(screen.getByRole("button", { name: "Instalar agora" }));

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(screen.getByText("O aplicativo já está instalado neste dispositivo.")).toBeTruthy();
  });

  it("solicita consentimento antes de disponibilizar o registro manual", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    render(<PwaInstallGuide isAuthenticated />);

    fireEvent.click(screen.getByRole("button", { name: "Instalar aplicativo" }));

    const consent = screen.getByRole("checkbox");
    expect(screen.getByRole("button", { name: "Já instalei o app" })).toHaveProperty("disabled", true);
    fireEvent.click(consent);
    expect(screen.getByRole("button", { name: "Já instalei o app" })).toHaveProperty("disabled", false);
  });
});
