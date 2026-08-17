CREATE TABLE `planning_years` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`weekCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_years_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_years_year_unique` UNIQUE(`year`)
);
--> statement-breakpoint
ALTER TABLE `flight_quotes` ADD `year` int DEFAULT 2026 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD `year` int DEFAULT 2026 NOT NULL;--> statement-breakpoint
ALTER TABLE `flight_prices` ADD CONSTRAINT `uq_flight_prices_year_week_airline` UNIQUE(`year`,`weekNumber`,`airline`);--> statement-breakpoint
ALTER TABLE `flight_weeks` ADD CONSTRAINT `uq_flight_weeks_year_week` UNIQUE(`year`,`weekNumber`);--> statement-breakpoint
ALTER TABLE `public_prices` ADD CONSTRAINT `uq_public_prices_year_week_airline` UNIQUE(`year`,`weekNumber`,`airline`);--> statement-breakpoint
CREATE INDEX `idx_flight_prices_year` ON `flight_prices` (`year`);--> statement-breakpoint
CREATE INDEX `idx_flight_quotes_year_week` ON `flight_quotes` (`year`,`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_notification_logs_year_week` ON `notification_logs` (`year`,`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_public_prices_year` ON `public_prices` (`year`);