import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela para persistir dados das semanas de voo
 */
export const flightWeeks = mysqlTable(
  "flight_weeks",
  {
    id: int("id").autoincrement().primaryKey(),
    weekNumber: int("weekNumber").notNull(),
    departureDate: varchar("departureDate", { length: 20 }).notNull(),
    returnDate: varchar("returnDate", { length: 20 }).notNull(),
    departureDayOfWeek: varchar("departureDayOfWeek", { length: 20 }).notNull(),
    returnDayOfWeek: varchar("returnDayOfWeek", { length: 20 }).notNull(),
    holiday: varchar("holiday", { length: 100 }),
    isDeleted: int("isDeleted").default(0).notNull(),
    isTicketIssued: int("isTicketIssued").default(0).notNull(),
    isSelected: int("isSelected").default(0).notNull(),
    departureAirline: varchar("departureAirline", { length: 50 }),
    returnAirline: varchar("returnAirline", { length: 50 }),
    departureFlightDatetime: varchar("departureFlightDatetime", { length: 30 }),
    returnFlightDatetime: varchar("returnFlightDatetime", { length: 30 }),
    departureAirport: varchar("departureAirport", { length: 10 }),
    returnAirport: varchar("returnAirport", { length: 10 }),
    departureLocator: varchar("departureLocator", { length: 20 }),
    returnLocator: varchar("returnLocator", { length: 20 }),
    departureFlightNumber: varchar("departureFlightNumber", { length: 20 }),
    returnFlightNumber: varchar("returnFlightNumber", { length: 20 }),
    ticketType: varchar("ticketType", { length: 20 }).default("roundtrip"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    // Índice para consultas por número de semana (filtros, lookups)
    index("idx_flight_weeks_weekNumber").on(table.weekNumber),
    // Índice para filtros por status de emissão de bilhete
    index("idx_flight_weeks_isTicketIssued").on(table.isTicketIssued),
    // Índice para filtros que excluem semanas deletadas
    index("idx_flight_weeks_isDeleted").on(table.isDeleted),
    // Índice composto para a query principal: semanas ativas com bilhete emitido
    index("idx_flight_weeks_active_issued").on(
      table.isDeleted,
      table.isTicketIssued
    ),
  ]
);

export type FlightWeek = typeof flightWeeks.$inferSelect;
export type InsertFlightWeek = typeof flightWeeks.$inferInsert;

/**
 * Tabela para persistir preços por semana e companhia aérea
 */
export const flightPrices = mysqlTable("flight_prices", {
  id: int("id").autoincrement().primaryKey(),
  weekNumber: int("weekNumber").notNull(),
  airline: varchar("airline", { length: 50 }).notNull(),
  price: varchar("price", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlightPrice = typeof flightPrices.$inferSelect;
export type InsertFlightPrice = typeof flightPrices.$inferInsert;

/**
 * Tabela para armazenar preços públicos
 */
export const public_prices = mysqlTable("public_prices", {
  id: int("id").autoincrement().primaryKey(),
  airline: varchar("airline", { length: 50 }).notNull(),
  price: varchar("price", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicPrice = typeof public_prices.$inferSelect;
export type InsertPublicPrice = typeof public_prices.$inferInsert;

/**
 * Tabela para armazenar códigos OTP de autenticação por e-mail
 */
export const otpCodes = mysqlTable("otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: int("used").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;

/**
 * Tabela para armazenar sessões autenticadas
 */
export const authSessions = mysqlTable("auth_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;

/**
 * Tabela para armazenar subscriptions de notificações push Web Push
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: varchar("userAgent", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
/**
 * Tabela para armazenar configurações de agendamento de notificações push
 * aviso1Minutes e aviso2Minutes: antecedência em minutos (ex: 1440 = 24h, 30 = 30min)
 * 0 significa desativado
 */
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  aviso1Minutes: int("aviso1Minutes").notNull().default(1440), // 24h por padrão
  aviso2Minutes: int("aviso2Minutes").notNull().default(0), // desativado por padrão
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings =
  typeof notificationSettings.$inferInsert;

/**
 * Tabela para registrar histórico persistente de envios de push notifications.
 * Cada linha representa um evento de envio (ou tentativa) para um voo específico.
 */
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  weekNumber: int("weekNumber").notNull(),
  direction: varchar("direction", { length: 10 }).notNull(), // 'ida' | 'volta'
  avisoLabel: varchar("avisoLabel", { length: 30 }).notNull(), // 'Aviso 1' | 'Aviso 2'
  avisoMinutes: int("avisoMinutes").notNull(),
  airline: varchar("airline", { length: 50 }),
  flightNumber: varchar("flightNumber", { length: 20 }),
  flightDatetime: varchar("flightDatetime", { length: 30 }),
  status: varchar("status", { length: 20 }).notNull().default("success"), // 'success' | 'partial' | 'failed'
  devicesReached: int("devicesReached").notNull().default(0),
  totalDevices: int("totalDevices").notNull().default(0),
  errorMessage: text("errorMessage"),
  isTest: int("isTest").notNull().default(0), // 1 = envio de teste manual
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
