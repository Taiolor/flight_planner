CREATE TABLE `gemini_budget_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`yearMonth` varchar(7) NOT NULL,
	`thresholdPercent` int NOT NULL,
	`estimatedCostCents` int NOT NULL,
	`emailSent` int NOT NULL DEFAULT 0,
	`pushSent` int NOT NULL DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT 'processing',
	`deliveryKey` varchar(32) NOT NULL,
	`notifiedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gemini_budget_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_gemini_budget_alerts_delivery_key` UNIQUE(`deliveryKey`)
);
--> statement-breakpoint
CREATE TABLE `gemini_budget_settings` (
	`id` int NOT NULL,
	`monthlyBudgetCents` int NOT NULL DEFAULT 10000,
	`inputCostCentsPerMillion` int NOT NULL DEFAULT 165,
	`outputCostCentsPerMillion` int NOT NULL DEFAULT 1375,
	`warningThresholdPercent` int NOT NULL DEFAULT 70,
	`criticalThresholdPercent` int NOT NULL DEFAULT 90,
	`limitThresholdPercent` int NOT NULL DEFAULT 100,
	`emailAlertsEnabled` int NOT NULL DEFAULT 1,
	`pushAlertsEnabled` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gemini_budget_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gemini_monthly_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`yearMonth` varchar(7) NOT NULL,
	`requestsCount` int NOT NULL DEFAULT 0,
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`estimatedCostCents` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gemini_monthly_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `gemini_monthly_usage_yearMonth_unique` UNIQUE(`yearMonth`)
);
--> statement-breakpoint
CREATE TABLE `gemini_usage_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`yearMonth` varchar(7) NOT NULL,
	`model` varchar(80) NOT NULL,
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`estimatedCostCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gemini_usage_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_gemini_budget_alerts_month` ON `gemini_budget_alerts` (`yearMonth`);--> statement-breakpoint
CREATE INDEX `idx_gemini_usage_events_month_created` ON `gemini_usage_events` (`yearMonth`,`createdAt`);