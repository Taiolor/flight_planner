import {
  bigint,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
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
 * Catálogo dos exercícios de planejamento disponíveis no aplicativo.
 * A existência de um ano é a fonte de verdade para gerar semanas e manter
 * semanas, preços, cotações, notificações e relatórios isolados por período.
 */
export const planningYears = mysqlTable("planning_years", {
  id: int("id").autoincrement().primaryKey(),
  year: int("year").notNull().unique(),
  status: mysqlEnum("status", ["draft", "active", "archived"])
    .notNull()
    .default("draft"),
  weekCount: int("weekCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanningYear = typeof planningYears.$inferSelect;
export type InsertPlanningYear = typeof planningYears.$inferInsert;

/**
 * Tabela para persistir dados das semanas de voo
 */
export const flightWeeks = mysqlTable(
  "flight_weeks",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").default(2026).notNull(),
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
    departureTerminal: varchar("departureTerminal", { length: 20 }),
    returnTerminal: varchar("returnTerminal", { length: 20 }),
    ticketType: varchar("ticketType", { length: 20 }).default("roundtrip"),
    // Campos de pagamento por milhas (pontos, não R$)
    smilesPoints: int("smilesPoints"), // pontos SMILES gastos
    latamPassPoints: int("latamPassPoints"), // pontos LATAM PASS gastos
    // Campos de voo remarcado (0 = normal, 1 = remarcado/não será voado)
    departureRescheduled: int("departureRescheduled").default(0).notNull(),
    returnRescheduled: int("returnRescheduled").default(0).notNull(),
    // Campos de voo cancelado (0 = ativo, 1 = cancelado)
    departureCancelled: int("departureCancelled").default(0).notNull(),
    returnCancelled: int("returnCancelled").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    // Índice para consultas por número de semana (filtros, lookups)
    index("idx_flight_weeks_year").on(table.year),
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
    uniqueIndex("uq_flight_weeks_year_week").on(
      table.year,
      table.weekNumber
    ),
  ]
);

export type FlightWeek = typeof flightWeeks.$inferSelect;
export type InsertFlightWeek = typeof flightWeeks.$inferInsert;

/**
 * Pares extras de ida e volta vinculados a uma semana do exercício. Mantém os
 * mesmos campos de emissão, milhas e estados do bilhete principal.
 */
export const additionalFlights = mysqlTable(
  "additional_flights",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    weekNumber: int("weekNumber").notNull(),
    isTicketIssued: int("isTicketIssued").default(0).notNull(),
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
    departureTerminal: varchar("departureTerminal", { length: 20 }),
    returnTerminal: varchar("returnTerminal", { length: 20 }),
    ticketType: varchar("ticketType", { length: 20 }).default("roundtrip"),
    // Valor total pago pelo bilhete adicional, em centavos, para evitar perda de precisão.
    paidPriceCents: int("paidPriceCents"),
    smilesPoints: int("smilesPoints"),
    latamPassPoints: int("latamPassPoints"),
    departureRescheduled: int("departureRescheduled").default(0).notNull(),
    returnRescheduled: int("returnRescheduled").default(0).notNull(),
    departureCancelled: int("departureCancelled").default(0).notNull(),
    returnCancelled: int("returnCancelled").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_additional_flights_year_week").on(table.year, table.weekNumber),
    index("idx_additional_flights_issued").on(table.year, table.isTicketIssued),
  ]
);

export type AdditionalFlight = typeof additionalFlights.$inferSelect;
export type InsertAdditionalFlight = typeof additionalFlights.$inferInsert;

/**
 * Uma memória editorial por passagem semanal. O vínculo anual impede a mistura
 * de recordações entre exercícios de planejamento.
 */
export const flightMemories = mysqlTable(
  "flight_memories",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    weekNumber: int("weekNumber").notNull(),
    title: varchar("title", { length: 160 }),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("uq_flight_memories_year_week").on(
      table.year,
      table.weekNumber
    ),
  ]
);

export type FlightMemory = typeof flightMemories.$inferSelect;
export type InsertFlightMemory = typeof flightMemories.$inferInsert;

/**
 * Resumo factual gerado pelo Gemini para uma passagem semanal. A tabela é
 * separada da memória editorial para preservar as anotações do usuário.
 */
export const flightMemorySummaries = mysqlTable(
  "flight_memory_summaries",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    weekNumber: int("weekNumber").notNull(),
    summary: text("summary").notNull(),
    model: varchar("model", { length: 80 }).notNull(),
    sourceFingerprint: varchar("sourceFingerprint", { length: 64 }).notNull(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("uq_flight_memory_summaries_year_week").on(
      table.year,
      table.weekNumber
    ),
    index("idx_flight_memory_summaries_year_generated").on(
      table.year,
      table.generatedAt
    ),
  ]
);

export type FlightMemorySummary = typeof flightMemorySummaries.$inferSelect;
export type InsertFlightMemorySummary = typeof flightMemorySummaries.$inferInsert;

/**
 * Metadados de arquivos armazenados no S3. Os bytes não são mantidos no banco.
 */
export const flightMemoryMedia = mysqlTable(
  "flight_memory_media",
  {
    id: int("id").autoincrement().primaryKey(),
    memoryId: int("memoryId").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileSizeBytes: int("fileSizeBytes").notNull(),
    caption: varchar("caption", { length: 240 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("idx_flight_memory_media_memory").on(table.memoryId)]
);

export type FlightMemoryMedia = typeof flightMemoryMedia.$inferSelect;
export type InsertFlightMemoryMedia = typeof flightMemoryMedia.$inferInsert;

/**
 * Checklist operacional por viagem. Cada item é isolado pelo exercício e pela
 * semana para acompanhar check-in, documentos, bagagem e logística.
 */
export const operationalTravelChecklists = mysqlTable(
  "operational_travel_checklists",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    weekNumber: int("weekNumber").notNull(),
    category: mysqlEnum("category", [
      "checkin",
      "bagagem",
      "assento",
      "traslado",
      "hospedagem",
      "documentos",
      "outro",
    ]).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    dueAt: timestamp("dueAt"),
    completed: int("completed").default(0).notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_operational_checklists_year_week").on(table.year, table.weekNumber),
    index("idx_operational_checklists_pending").on(table.year, table.completed),
  ]
);

export type OperationalTravelChecklist =
  typeof operationalTravelChecklists.$inferSelect;
export type InsertOperationalTravelChecklist =
  typeof operationalTravelChecklists.$inferInsert;

/** Metadados de comprovantes e documentos operacionais guardados no S3. */
export const operationalFlightAttachments = mysqlTable(
  "operational_flight_attachments",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    weekNumber: int("weekNumber").notNull(),
    attachmentType: mysqlEnum("attachmentType", [
      "comprovante",
      "cartao_embarque",
      "recibo",
      "outro",
    ]).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileSizeBytes: int("fileSizeBytes").notNull(),
    description: varchar("description", { length: 240 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("idx_operational_attachments_year_week").on(table.year, table.weekNumber),
  ]
);

export type OperationalFlightAttachment =
  typeof operationalFlightAttachments.$inferSelect;
export type InsertOperationalFlightAttachment =
  typeof operationalFlightAttachments.$inferInsert;

/** Créditos, vouchers e reembolsos disponíveis para reduzir o custo de viagens. */
export const operationalTravelCredits = mysqlTable(
  "operational_travel_credits",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    airline: varchar("airline", { length: 80 }).notNull(),
    creditType: mysqlEnum("creditType", ["credito", "voucher", "reembolso"]).notNull(),
    code: varchar("code", { length: 120 }),
    originalCents: int("originalCents").notNull(),
    availableCents: int("availableCents").notNull(),
    expiresAt: timestamp("expiresAt"),
    status: mysqlEnum("status", ["ativo", "usado", "expirado"]).default("ativo").notNull(),
    linkedWeekNumber: int("linkedWeekNumber"),
    notes: varchar("notes", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_operational_credits_year_status").on(table.year, table.status),
    index("idx_operational_credits_expiration").on(table.year, table.expiresAt),
  ]
);

export type OperationalTravelCredit = typeof operationalTravelCredits.$inferSelect;
export type InsertOperationalTravelCredit =
  typeof operationalTravelCredits.$inferInsert;

/** Metas anuais complementares à meta de emissões existente. */
export const operationalCategoryGoals = mysqlTable(
  "operational_category_goals",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    category: mysqlEnum("category", ["viagens", "orcamento", "milhas", "creditos"])
      .notNull(),
    targetValue: int("targetValue").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("uq_operational_goals_year_category").on(table.year, table.category),
  ]
);

export type OperationalCategoryGoal = typeof operationalCategoryGoals.$inferSelect;
export type InsertOperationalCategoryGoal =
  typeof operationalCategoryGoals.$inferInsert;

/** Configuração única do relatório executivo recorrente, vinculada ao job Heartbeat. */
export const operationalReportSchedules = mysqlTable(
  "operational_report_schedules",
  {
    id: int("id").primaryKey(),
    year: int("year").notNull(),
    enabled: int("enabled").default(0).notNull(),
    cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    lastSentAt: timestamp("lastSentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("idx_operational_report_schedule_task").on(table.scheduleCronTaskUid)]
);

export type OperationalReportSchedule = typeof operationalReportSchedules.$inferSelect;
export type InsertOperationalReportSchedule =
  typeof operationalReportSchedules.$inferInsert;

/**
 * Campos adicionados:
 * - departureTerminal: Terminal de embarque do voo de ida
 * - returnTerminal: Terminal de embarque do voo de volta
 */

/**
 * Tabela para persistir preços por semana e companhia aérea
 */
export const flightPrices = mysqlTable(
  "flight_prices",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").default(2026).notNull(),
    weekNumber: int("weekNumber").notNull(),
    airline: varchar("airline", { length: 50 }).notNull(),
    price: varchar("price", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_flight_prices_year").on(table.year),
    uniqueIndex("uq_flight_prices_year_week_airline").on(
      table.year,
      table.weekNumber,
      table.airline
    ),
  ]
);

export type FlightPrice = typeof flightPrices.$inferSelect;
export type InsertFlightPrice = typeof flightPrices.$inferInsert;

/**
 * Tabela para armazenar preços públicos
 */
export const public_prices = mysqlTable(
  "public_prices",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").default(2026).notNull(),
    weekNumber: int("weekNumber").notNull(),
    airline: varchar("airline", { length: 50 }).notNull(),
    price: varchar("price", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_public_prices_year").on(table.year),
    uniqueIndex("uq_public_prices_year_week_airline").on(
      table.year,
      table.weekNumber,
      table.airline
    ),
  ]
);

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
 * Papéis persistidos do login interno. A conta configurada no ambiente é usada
 * apenas para o provisionamento inicial; as decisões de autorização consultam
 * esta tabela em todas as sessões válidas.
 */
export const flightAccessRoles = mysqlTable("flight_access_roles", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlightAccessRole = typeof flightAccessRoles.$inferSelect;
export type InsertFlightAccessRole = typeof flightAccessRoles.$inferInsert;

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
  flightPushEnabled: int("flightPushEnabled").notNull().default(1),
  ticketEmailEnabled: int("ticketEmailEnabled").notNull().default(1),
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
  year: int("year").default(2026).notNull(),
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
  deliveryKey: varchar("deliveryKey", { length: 160 }), // chave idempotente de envios automáticos
  sentAt: timestamp("sentAt").defaultNow().notNull(),
}, table => [
  index("idx_notification_logs_year_week").on(table.year, table.weekNumber),
  index("idx_notification_logs_year_sent_at_id").on(
    table.year,
    table.sentAt,
    table.id
  ),
  uniqueIndex("uq_notification_logs_delivery_key").on(table.deliveryKey),
]);

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Histórico pseudônimo de instalações do PWA. O identificador só é criado e
 * enviado após consentimento explícito; não armazena conta, IP ou user-agent.
 */
export const pwaInstallationEvents = mysqlTable("pwa_installation_events", {
  id: int("id").autoincrement().primaryKey(),
  installationId: varchar("installationId", { length: 64 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull().default("unknown"),
  method: varchar("method", { length: 20 }).notNull().default("manual"),
  consentedAt: timestamp("consentedAt").defaultNow().notNull(),
  installedAt: timestamp("installedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("uq_pwa_installation_events_installation_id").on(table.installationId),
  index("idx_pwa_installation_events_installed_at").on(table.installedAt),
]);

export type PwaInstallationEvent = typeof pwaInstallationEvents.$inferSelect;
export type InsertPwaInstallationEvent = typeof pwaInstallationEvents.$inferInsert;

/**
 * Métricas anônimas de desempenho da aplicação. Não armazena usuário, IP,
 * identificadores de dispositivo, URL com parâmetros ou conteúdo de requisições.
 */
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metric: varchar("metric", { length: 20 }).notNull(),
  value: int("value").notNull(),
  route: varchar("route", { length: 120 }),
  procedure: varchar("procedure", { length: 160 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, table => [
  index("idx_performance_metrics_metric_recorded_at").on(
    table.metric,
    table.recordedAt
  ),
  index("idx_performance_metrics_recorded_at").on(table.recordedAt),
]);

export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

/**
 * Eventos de uso consentidos. A localização é armazenada em centésimos de grau
 * (latitudeE2/longitudeE2), sem precisão GPS e sem vínculo com usuário, IP ou
 * dispositivo persistente. sessionHash deriva de um nonce efêmero do navegador.
 */
export const usageTelemetryEvents = mysqlTable("usage_telemetry_events", {
  id: int("id").autoincrement().primaryKey(),
  sessionHash: varchar("sessionHash", { length: 64 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "route",
    "interaction",
    "query",
    "mutation",
  ]).notNull(),
  route: varchar("route", { length: 120 }).notNull(),
  procedure: varchar("procedure", { length: 160 }),
  latitudeE2: int("latitudeE2"),
  longitudeE2: int("longitudeE2"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_usage_telemetry_created_at").on(table.createdAt),
  index("idx_usage_telemetry_session_created_at").on(
    table.sessionHash,
    table.createdAt
  ),
  index("idx_usage_telemetry_location_created_at").on(
    table.latitudeE2,
    table.longitudeE2,
    table.createdAt
  ),
]);

export type InsertUsageTelemetryEvent =
  typeof usageTelemetryEvents.$inferInsert;

/**
 * Métricas agregadas de tentativas de recursos protegidos. Não há usuário,
 * sessão, IP, localização ou qualquer identificador persistente nesta tabela.
 */
export const protectedAccessAttempts = mysqlTable("protected_access_attempts", {
  id: int("id").autoincrement().primaryKey(),
  resource: mysqlEnum("resource", [
    "fly-ia",
    "share-by-email",
    "quotes",
    "financial",
    "memories",
    "admin-notifications",
    "admin-telemetry",
    "gemini-budget",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_protected_access_resource_created_at").on(
    table.resource,
    table.createdAt
  ),
]);

export type InsertProtectedAccessAttempt =
  typeof protectedAccessAttempts.$inferInsert;

/**
 * Tabela para armazenar cotações de preços de passagens aéreas
 * (Colunas adicionadas: outboundAirline, returnAirline, outboundDeparture, outboundArrival, returnDeparture, returnArrival)
 * source: 'api' = obtido via Sky Scrapper API | 'manual' = inserido manualmente via Kayak
 */
export const flightQuotes = mysqlTable(
  "flight_quotes",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").default(2026).notNull(),
    weekNumber: int("weekNumber").notNull(),
    departureDate: varchar("departureDate", { length: 20 }).notNull(), // YYYY-MM-DD
    returnDate: varchar("returnDate", { length: 20 }).notNull(), // YYYY-MM-DD
    lowestPrice: int("lowestPrice").notNull(), // em centavos (R$)
    currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
    source: mysqlEnum("source", ["api", "manual"]).notNull(), // origem do preço
    airline: varchar("airline", { length: 100 }), // companhia ida (quando disponível)
    outboundAirline: varchar("outboundAirline", { length: 100 }), // companhia aérea voo de ida
    returnAirline: varchar("returnAirline", { length: 100 }), // companhia aérea voo de volta
    outboundDeparture: varchar("outboundDeparture", { length: 30 }), // data/hora partida ida (ISO 8601)
    outboundArrival: varchar("outboundArrival", { length: 30 }), // data/hora chegada ida (ISO 8601)
    returnDeparture: varchar("returnDeparture", { length: 30 }), // data/hora partida volta (ISO 8601)
    returnArrival: varchar("returnArrival", { length: 30 }), // data/hora chegada volta (ISO 8601)
    apiRequestsUsed: int("apiRequestsUsed").default(0).notNull(), // contador de req usadas no mês
    rawResponse: text("rawResponse"), // resposta bruta da API (debug)
    quotedAt: timestamp("quotedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_flight_quotes_year_week").on(table.year, table.weekNumber),
    index("idx_flight_quotes_weekNumber").on(table.weekNumber),
    index("idx_flight_quotes_quotedAt").on(table.quotedAt),
  ]
);

export type FlightQuote = typeof flightQuotes.$inferSelect;
export type InsertFlightQuote = typeof flightQuotes.$inferInsert;

/**
 * Envelope mensal de gastos do planejamento. Cada valor pertence exclusivamente
 * a um exercício e é armazenado em centavos para preservar precisão monetária.
 */
export const financialMonthlyBudgets = mysqlTable(
  "financial_monthly_budgets",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    month: int("month").notNull(),
    budgetCents: int("budgetCents").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("uq_financial_monthly_budgets_year_month").on(
      table.year,
      table.month
    ),
    index("idx_financial_monthly_budgets_year").on(table.year),
  ]
);

export type FinancialMonthlyBudget = typeof financialMonthlyBudgets.$inferSelect;
export type InsertFinancialMonthlyBudget =
  typeof financialMonthlyBudgets.$inferInsert;

/**
 * Tabela para rastrear uso mensal da API Sky Scrapper
 */
export const apiUsageTracker = mysqlTable("api_usage_tracker", {
  id: int("id").autoincrement().primaryKey(),
  yearMonth: varchar("yearMonth", { length: 7 }).notNull().unique(), // YYYY-MM
  requestsUsed: int("requestsUsed").default(0).notNull(),
  requestsLimit: int("requestsLimit").default(20).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiUsageTracker = typeof apiUsageTracker.$inferSelect;
export type InsertApiUsageTracker = typeof apiUsageTracker.$inferInsert;

/**
 * Configuração única do orçamento interno do Gemini. Os valores de preço são
 * estimativas em centavos de real por 1 milhão de tokens e podem ser revisados
 * pelo administrador quando a tabela oficial do provedor mudar.
 */
export const geminiBudgetSettings = mysqlTable("gemini_budget_settings", {
  id: int("id").primaryKey(),
  monthlyBudgetCents: int("monthlyBudgetCents").notNull().default(10000),
  inputCostCentsPerMillion: int("inputCostCentsPerMillion").notNull().default(165),
  outputCostCentsPerMillion: int("outputCostCentsPerMillion").notNull().default(1375),
  warningThresholdPercent: int("warningThresholdPercent").notNull().default(70),
  criticalThresholdPercent: int("criticalThresholdPercent").notNull().default(90),
  limitThresholdPercent: int("limitThresholdPercent").notNull().default(100),
  emailAlertsEnabled: int("emailAlertsEnabled").notNull().default(1),
  pushAlertsEnabled: int("pushAlertsEnabled").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeminiBudgetSettings = typeof geminiBudgetSettings.$inferSelect;
export type InsertGeminiBudgetSettings = typeof geminiBudgetSettings.$inferInsert;

/** Eventos mínimos de resposta bem-sucedida do Gemini, sem prompts ou conteúdo. */
export const geminiUsageEvents = mysqlTable("gemini_usage_events", {
  id: int("id").autoincrement().primaryKey(),
  yearMonth: varchar("yearMonth", { length: 7 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  inputTokens: int("inputTokens").notNull().default(0),
  outputTokens: int("outputTokens").notNull().default(0),
  totalTokens: int("totalTokens").notNull().default(0),
  estimatedCostCents: int("estimatedCostCents").notNull().default(0),
  /** Microcentavos evitam a perda de frações em chamadas pequenas. */
  estimatedCostMicrocents: bigint("estimatedCostMicrocents", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_gemini_usage_events_month_created").on(table.yearMonth, table.createdAt),
]);

export type GeminiUsageEvent = typeof geminiUsageEvents.$inferSelect;

/** Agregado mensal para leitura do painel sem recalcular todos os eventos. */
export const geminiMonthlyUsage = mysqlTable("gemini_monthly_usage", {
  id: int("id").autoincrement().primaryKey(),
  yearMonth: varchar("yearMonth", { length: 7 }).notNull().unique(),
  requestsCount: int("requestsCount").notNull().default(0),
  inputTokens: int("inputTokens").notNull().default(0),
  outputTokens: int("outputTokens").notNull().default(0),
  totalTokens: int("totalTokens").notNull().default(0),
  estimatedCostCents: int("estimatedCostCents").notNull().default(0),
  /** Soma exata de custo, em microcentavos. */
  estimatedCostMicrocents: bigint("estimatedCostMicrocents", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeminiMonthlyUsage = typeof geminiMonthlyUsage.$inferSelect;

/** Registro idempotente de cada faixa já notificada no ciclo mensal. */
export const geminiBudgetAlerts = mysqlTable("gemini_budget_alerts", {
  id: int("id").autoincrement().primaryKey(),
  yearMonth: varchar("yearMonth", { length: 7 }).notNull(),
  thresholdPercent: int("thresholdPercent").notNull(),
  estimatedCostCents: int("estimatedCostCents").notNull(),
  estimatedCostMicrocents: bigint("estimatedCostMicrocents", { mode: "number" }).notNull().default(0),
  emailSent: int("emailSent").notNull().default(0),
  pushSent: int("pushSent").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("processing"),
  deliveryKey: varchar("deliveryKey", { length: 32 }).notNull(),
  notifiedAt: timestamp("notifiedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("uq_gemini_budget_alerts_delivery_key").on(table.deliveryKey),
  index("idx_gemini_budget_alerts_month").on(table.yearMonth),
]);

export type GeminiBudgetAlert = typeof geminiBudgetAlerts.$inferSelect;

/**
 * Memória compacta e efêmera do Fly.IA, isolada pela sessão autenticada e pelo
 * exercício selecionado. O conteúdo preserva apenas resumos de respostas do
 * assistente, nunca prompts brutos ou credenciais.
 */
export const flyIaSessionMemories = mysqlTable("fly_ia_session_memories", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 64 }).notNull(),
  year: int("year").notNull(),
  summary: text("summary").notNull(),
  sourceResponsesCount: int("sourceResponsesCount").notNull().default(0),
  summaryChars: int("summaryChars").notNull().default(0),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("uq_fly_ia_session_memories_session_year").on(table.sessionKey, table.year),
  index("idx_fly_ia_session_memories_expires").on(table.expiresAt),
]);

export type FlyIaSessionMemory = typeof flyIaSessionMemories.$inferSelect;

/**
 * Métricas sem conteúdo conversacional usadas para acompanhar o tamanho de
 * contexto, o efeito da memória compacta e a latência do Fly.IA.
 */
export const flyIaContextMetrics = mysqlTable("fly_ia_context_metrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 64 }).notNull(),
  year: int("year").notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  outcome: mysqlEnum("outcome", ["generated", "deterministic", "provider_error", "budget_blocked"]).notNull(),
  contextChars: int("contextChars").notNull().default(0),
  historyChars: int("historyChars").notNull().default(0),
  payloadHistoryChars: int("payloadHistoryChars").notNull().default(0),
  memoryChars: int("memoryChars").notNull().default(0),
  inputTokens: int("inputTokens").notNull().default(0),
  outputTokens: int("outputTokens").notNull().default(0),
  totalTokens: int("totalTokens").notNull().default(0),
  latencyMs: int("latencyMs").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_fly_ia_context_metrics_created").on(table.createdAt),
  index("idx_fly_ia_context_metrics_session_year").on(table.sessionKey, table.year),
]);

export type FlyIaContextMetric = typeof flyIaContextMetrics.$inferSelect;

/**
 * Telemetria operacional da transcrição de voz. Não armazena áudio, texto,
 * identificadores de sessão, MIME type ou qualquer conteúdo conversacional.
 */
export const flyIaVoiceUsageEvents = mysqlTable("fly_ia_voice_usage_events", {
  id: int("id").autoincrement().primaryKey(),
  durationMs: int("durationMs").notNull().default(0),
  audioBytes: int("audioBytes").notNull().default(0),
  latencyMs: int("latencyMs").notNull().default(0),
  outcome: mysqlEnum("outcome", ["transcribed", "empty", "provider_error", "rejected"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("idx_fly_ia_voice_usage_created").on(table.createdAt),
]);

export type FlyIaVoiceUsageEvent = typeof flyIaVoiceUsageEvents.$inferSelect;

/**
 * Tabela para armazenar a lista de e-mails que receberão alertas de
 * inclusão, alteração e exclusão de bilhetes emitidos.
 */
export const ticketNotificationEmails = mysqlTable(
  "ticket_notification_emails",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: varchar("name", { length: 100 }),
    active: int("active").notNull().default(1), // 1 = ativo, 0 = inativo
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("idx_ticket_notif_emails_active").on(table.active)]
);

export type TicketNotificationEmail =
  typeof ticketNotificationEmails.$inferSelect;
export type InsertTicketNotificationEmail =
  typeof ticketNotificationEmails.$inferInsert;


/** Compras avulsas de milhas, isoladas pelo exercício selecionado. */
export const mileagePurchases = mysqlTable(
  "mileage_purchases",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    purchaseDate: varchar("purchaseDate", { length: 10 }).notNull(),
    miles: int("miles").notNull(),
    program: varchar("program", { length: 100 }).notNull(),
    paidPriceCents: int("paidPriceCents").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_mileage_purchases_year_date").on(table.year, table.purchaseDate),
    index("idx_mileage_purchases_year_program").on(table.year, table.program),
  ]
);

export type MileagePurchase = typeof mileagePurchases.$inferSelect;
export type InsertMileagePurchase = typeof mileagePurchases.$inferInsert;
