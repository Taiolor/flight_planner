CREATE TABLE `protected_access_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resource` enum('fly-ia','share-by-email','quotes','memories','admin-notifications','admin-telemetry','gemini-budget') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protected_access_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_protected_access_resource_created_at` ON `protected_access_attempts` (`resource`,`createdAt`);