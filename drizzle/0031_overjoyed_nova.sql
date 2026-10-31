CREATE TABLE `usage_telemetry_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionHash` varchar(64) NOT NULL,
	`eventType` enum('route','interaction','query','mutation') NOT NULL,
	`route` varchar(120) NOT NULL,
	`procedure` varchar(160),
	`latitudeE2` int,
	`longitudeE2` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_telemetry_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_usage_telemetry_created_at` ON `usage_telemetry_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_usage_telemetry_session_created_at` ON `usage_telemetry_events` (`sessionHash`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_usage_telemetry_location_created_at` ON `usage_telemetry_events` (`latitudeE2`,`longitudeE2`,`createdAt`);