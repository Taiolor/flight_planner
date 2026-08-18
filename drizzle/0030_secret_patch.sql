CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric` varchar(20) NOT NULL,
	`value` int NOT NULL,
	`route` varchar(120),
	`procedure` varchar(160),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_performance_metrics_metric_recorded_at` ON `performance_metrics` (`metric`,`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_performance_metrics_recorded_at` ON `performance_metrics` (`recordedAt`);