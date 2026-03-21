import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

// TODO: Add your tables here

/**
 * Tabela para persistir dados das semanas de voo
 */
export const flightWeeks = mysqlTable("flight_weeks", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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