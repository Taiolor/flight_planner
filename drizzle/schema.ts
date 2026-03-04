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