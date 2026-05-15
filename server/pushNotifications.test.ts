import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendPushToAll,
  sendPushToOne,
  type PushPayload,
} from "./pushNotifications";
import * as db from "./db";
import webpush from "web-push";
import { WebPushError } from "web-push";
import { ENV } from "./_core/env";

vi.mock("./db");
vi.mock("web-push");
vi.mock("./_core/env", () => ({
  ENV: {
    vapidPublicKey: "fake-public-key",
    vapidPrivateKey: "fake-private-key",
  },
}));

describe("pushNotifications", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sendPushToOne", () => {
    const payload: PushPayload = { title: "Test", body: "Test body" };

    it("should successfully send a push notification", async () => {
      vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

      const result = await sendPushToOne(
        "endpoint1",
        "p256dh1",
        "auth1",
        payload
      );

      expect(result).toBe(true);
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: "endpoint1", keys: { p256dh: "p256dh1", auth: "auth1" } },
        JSON.stringify(payload),
        { TTL: 86400 }
      );
    });

    it("should delete subscription and return false if webpush throws WebPushError with statusCode 410", async () => {
      const error = new WebPushError("Gone", 410, {} as any, "", "");
      error.statusCode = 410; // set manually because WebPushError is mocked
      vi.mocked(webpush.sendNotification).mockRejectedValue(error);

      const result = await sendPushToOne(
        "endpoint1",
        "p256dh1",
        "auth1",
        payload
      );

      expect(result).toBe(false);
      expect(db.deletePushSubscription).toHaveBeenCalledWith("endpoint1");
    });

    it("should delete subscription and return false if webpush throws WebPushError with statusCode 404", async () => {
      const error = new WebPushError("Not Found", 404, {} as any, "", "");
      error.statusCode = 404; // set manually because WebPushError is mocked
      vi.mocked(webpush.sendNotification).mockRejectedValue(error);

      const result = await sendPushToOne(
        "endpoint1",
        "p256dh1",
        "auth1",
        payload
      );

      expect(result).toBe(false);
      expect(db.deletePushSubscription).toHaveBeenCalledWith("endpoint1");
    });

    it("should return false without deleting subscription for other WebPushError status codes", async () => {
      const error = new WebPushError("Unauthorized", 401, {} as any, "", "");
      error.statusCode = 401; // set manually because WebPushError is mocked
      vi.mocked(webpush.sendNotification).mockRejectedValue(error);

      const result = await sendPushToOne(
        "endpoint1",
        "p256dh1",
        "auth1",
        payload
      );

      expect(result).toBe(false);
      expect(db.deletePushSubscription).not.toHaveBeenCalled();
    });

    it("should return false without deleting subscription for generic errors", async () => {
      const error = new Error("Generic error");
      vi.mocked(webpush.sendNotification).mockRejectedValue(error);

      const result = await sendPushToOne(
        "endpoint1",
        "p256dh1",
        "auth1",
        payload
      );

      expect(result).toBe(false);
      expect(db.deletePushSubscription).not.toHaveBeenCalled();
    });
  });

  describe("sendPushToAll", () => {
    const payload: PushPayload = { title: "Test", body: "Test body" };

    it("should return 0 when there are no subscriptions", async () => {
      vi.mocked(db.getAllPushSubscriptions).mockResolvedValue([]);

      const result = await sendPushToAll(payload);

      expect(result).toBe(0);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it("should send push to all subscriptions and return the count of successful sends", async () => {
      vi.mocked(db.getAllPushSubscriptions).mockResolvedValue([
        {
          id: 1,
          endpoint: "endpoint1",
          p256dh: "p1",
          auth: "a1",
          createdAt: new Date(),
        },
        {
          id: 2,
          endpoint: "endpoint2",
          p256dh: "p2",
          auth: "a2",
          createdAt: new Date(),
        },
      ]);
      vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

      const result = await sendPushToAll(payload);

      expect(result).toBe(2);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed success and failure", async () => {
      vi.mocked(db.getAllPushSubscriptions).mockResolvedValue([
        {
          id: 1,
          endpoint: "endpoint1",
          p256dh: "p1",
          auth: "a1",
          createdAt: new Date(),
        },
        {
          id: 2,
          endpoint: "endpoint2",
          p256dh: "p2",
          auth: "a2",
          createdAt: new Date(),
        },
      ]);

      vi.mocked(webpush.sendNotification)
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error("Failed"));

      const result = await sendPushToAll(payload);

      expect(result).toBe(1);
    });

    it("should use provided subscriptions instead of fetching from db", async () => {
      const subs = [
        {
          id: 1,
          endpoint: "endpoint1",
          p256dh: "p1",
          auth: "a1",
          createdAt: new Date(),
        },
      ];
      vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

      const result = await sendPushToAll(payload, subs);

      expect(result).toBe(1);
      expect(db.getAllPushSubscriptions).not.toHaveBeenCalled();
      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    });
  });
});
