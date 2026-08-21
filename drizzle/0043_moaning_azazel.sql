CREATE TABLE `fly_ia_voice_usage_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`durationMs` int NOT NULL DEFAULT 0,
	`audioBytes` int NOT NULL DEFAULT 0,
	`latencyMs` int NOT NULL DEFAULT 0,
	`outcome` enum('transcribed','empty','provider_error','rejected') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fly_ia_voice_usage_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `gemini_monthly_usage` ADD `estimatedCostMicrocents` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `gemini_usage_events` ADD `estimatedCostMicrocents` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_fly_ia_voice_usage_created` ON `fly_ia_voice_usage_events` (`createdAt`);