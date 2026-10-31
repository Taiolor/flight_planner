/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("mantém uma superfície navy, valor legível e acento semântico no ícone", () => {
    render(<MetricCard title="Total investido" value="R$ 2.100,00" icon={DollarSign} accent="green" />);

    expect(screen.getByText("Total investido").closest("article")?.className).toContain("bg-[#071a36]");
    expect(screen.getByText("R$ 2.100,00")).toBeTruthy();
  });
});
