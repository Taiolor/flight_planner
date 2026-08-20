// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentReveal } from "./ContentReveal";

describe("ContentReveal", () => {
  it("revela conteúdo com fade e respeita redução de movimento", () => {
    const { getByText } = render(
      <ContentReveal delay="short">Conteúdo carregado</ContentReveal>
    );

    const content = getByText("Conteúdo carregado");
    expect(content.className).toContain("animate-in");
    expect(content.className).toContain("fade-in");
    expect(content.className).toContain("motion-reduce:animate-none");
  });
});
