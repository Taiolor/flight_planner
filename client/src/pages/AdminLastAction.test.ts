// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAdminFormAction,
  readAdminFormAction,
  saveAdminFormAction,
  type AdminFormAction,
} from "./AdminNotifications";

describe("admin form action history", () => {
  const key = "viagens.admin.test-last-action";
  const action: AdminFormAction = {
    label: "E-mail de teste enviado",
    status: "success",
    timestamp: "2026-08-19T16:30:00.000Z",
  };

  beforeEach(() => window.localStorage.clear());

  it("persists the latest form action across navigation and reloads", () => {
    saveAdminFormAction(key, action);

    expect(readAdminFormAction(key)).toEqual(action);
  });

  it("ignores malformed or unsupported stored values", () => {
    window.localStorage.setItem(key, JSON.stringify({ label: "Inválido" }));
    expect(readAdminFormAction(key)).toBeNull();

    window.localStorage.setItem(
      key,
      JSON.stringify({ ...action, status: "pending" })
    );
    expect(readAdminFormAction(key)).toBeNull();
  });

  it("clears only the selected local action record", () => {
    saveAdminFormAction(key, action);
    saveAdminFormAction("viagens.admin.other-action", {
      ...action,
      label: "Outro registro",
    });

    clearAdminFormAction(key);

    expect(readAdminFormAction(key)).toBeNull();
    expect(readAdminFormAction("viagens.admin.other-action")).toMatchObject({
      label: "Outro registro",
    });
  });
});
