ALTER TABLE `flight_prices` ADD `year` int DEFAULT 2026 NOT NULL;--> statement-breakpoint
ALTER TABLE `flight_weeks` ADD `year` int DEFAULT 2026 NOT NULL;--> statement-breakpoint
ALTER TABLE `public_prices` ADD `year` int DEFAULT 2026 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_flight_weeks_year` ON `flight_weeks` (`year`);