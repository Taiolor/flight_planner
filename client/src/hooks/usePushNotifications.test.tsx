/** @vitest-environment jsdom */
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getVapidPublicKey: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  sendTest: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    push: {
      getVapidPublicKey: { useQuery: mocks.getVapidPublicKey },
      subscribe: { useMutation: mocks.subscribe },
      unsubscribe: { useMutation: mocks.unsubscribe },
      sendTest: { useMutation: mocks.sendTest },
    },
  },
}));

import { usePushNotifications } from "./usePushNotifications";

const serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker"
);

function installPushApis(options: {
  permission: NotificationPermission;
  serviceWorker: ServiceWorkerContainer;
  requestPermission?: () => Promise<NotificationPermission>;
}) {
  vi.stubGlobal("PushManager", class PushManager {});
  vi.stubGlobal("Notification", {
    permission: options.permission,
    requestPermission:
      options.requestPermission ?? vi.fn().mockResolvedValue(options.permission),
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: options.serviceWorker,
  });
}

function installMutationMocks() {
  mocks.getVapidPublicKey.mockReturnValue({ data: { publicKey: "AQIDBA" } });
  mocks.subscribe.mockReturnValue({ mutateAsync: vi.fn() });
  mocks.unsubscribe.mockReturnValue({ mutateAsync: vi.fn() });
  mocks.sendTest.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
}

function createRegistration(pushManager: {
  getSubscription: () => Promise<PushSubscription | null>;
  subscribe: PushManager["subscribe"];
}): ServiceWorkerRegistration {
  return { pushManager } as unknown as ServiceWorkerRegistration;
}

describe("usePushNotifications", () => {
  beforeEach(() => {
    installMutationMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();

    if (serviceWorkerDescriptor) {
      Object.defineProperty(navigator, "serviceWorker", serviceWorkerDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "serviceWorker");
    }
  });

  it("em desenvolvimento fica unsupported sem aguardar o service worker nem pedir permissão", async () => {
    vi.stubEnv("PROD", false);
    const ready = vi.fn(() => new Promise<ServiceWorkerRegistration>(() => {}));
    const requestPermission = vi.fn().mockResolvedValue("granted");

    installPushApis({
      permission: "default",
      requestPermission,
      serviceWorker: {
        get ready() {
          return ready();
        },
      } as unknown as ServiceWorkerContainer,
    });

    const { result } = renderHook(() => usePushNotifications(2026));

    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(ready).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.status).toBe("unsupported");
    expect(result.current.errorMessage).toMatch(/somente em produção/i);
    expect(requestPermission).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
  });

  it("fica unsupported quando as APIs push necessárias não existem", async () => {
    vi.stubEnv("PROD", true);

    const { result } = renderHook(() => usePushNotifications(2026));

    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.isSupported).toBe(false);
  });

  it("trata permissão default sem subscription como unsubscribed", async () => {
    vi.stubEnv("PROD", true);
    const getSubscription = vi.fn().mockResolvedValue(null);
    const requestPermission = vi.fn().mockResolvedValue("granted");
    installPushApis({
      permission: "default",
      requestPermission,
      serviceWorker: {
        ready: Promise.resolve(
          createRegistration({
            getSubscription,
            subscribe: vi.fn(),
          })
        ),
      } as unknown as ServiceWorkerContainer,
    });

    const { result } = renderHook(() => usePushNotifications(2026));

    await waitFor(() => expect(result.current.status).toBe("unsubscribed"));
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("identifica uma subscription ativa em produção", async () => {
    vi.stubEnv("PROD", true);
    const subscription = { endpoint: "https://push.example/subscription" } as PushSubscription;
    const getSubscription = vi.fn().mockResolvedValue(subscription);
    installPushApis({
      permission: "granted",
      serviceWorker: {
        ready: Promise.resolve(
          createRegistration({
            getSubscription,
            subscribe: vi.fn(),
          })
        ),
      } as unknown as ServiceWorkerContainer,
    });

    const { result } = renderHook(() => usePushNotifications(2026));

    await waitFor(() => expect(result.current.status).toBe("subscribed"));
    expect(result.current.subscription).toBe(subscription);
    expect(result.current.isSubscribed).toBe(true);
  });

  it("reporta denied sem tocar no service worker", async () => {
    vi.stubEnv("PROD", true);
    const ready = vi.fn(() => new Promise<ServiceWorkerRegistration>(() => {}));
    const requestPermission = vi.fn();
    installPushApis({
      permission: "denied",
      requestPermission,
      serviceWorker: {
        get ready() {
          return ready();
        },
      } as unknown as ServiceWorkerContainer,
    });

    const { result } = renderHook(() => usePushNotifications(2026));

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(ready).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("encerra o carregamento e limpa o timeout se o worker não ficar pronto em dez segundos", async () => {
    vi.stubEnv("PROD", true);
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    installPushApis({
      permission: "default",
      serviceWorker: { ready: new Promise(() => {}) } as unknown as ServiceWorkerContainer,
    });
    const { result } = renderHook(() => usePushNotifications(2026));
    expect(result.current.status).toBe("loading");
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(result.current.status).toBe("error");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMessage).toContain("Recarregue a página");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("limpa o timeout após receber o worker pronto", async () => {
    vi.stubEnv("PROD", true);
    vi.useFakeTimers();
    installPushApis({
      permission: "default",
      serviceWorker: {
        ready: Promise.resolve(createRegistration({ getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn() })),
      } as unknown as ServiceWorkerContainer,
    });
    const { result } = renderHook(() => usePushNotifications(2026));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe("unsubscribed");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancela a espera e limpa o timeout ao desmontar", async () => {
    vi.stubEnv("PROD", true);
    vi.useFakeTimers();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    installPushApis({
      permission: "default",
      serviceWorker: { ready: new Promise(() => {}) } as unknown as ServiceWorkerContainer,
    });
    const { unmount } = renderHook(() => usePushNotifications(2026));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    await act(async () => { await Promise.resolve(); });
    expect(vi.getTimerCount()).toBe(0);
    expect(errors).not.toHaveBeenCalled();
  });
});
