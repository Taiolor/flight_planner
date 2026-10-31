CREATE TABLE `pwa_installation_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` varchar(64) NOT NULL,
	`platform` varchar(20) NOT NULL DEFAULT 'unknown',
	`method` varchar(20) NOT NULL DEFAULT 'manual',
	`consentedAt` timestamp NOT NULL DEFAULT (now()),
	`installedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pwa_installation_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pwa_installation_events_installation_id` UNIQUE(`installationId`)
);
--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `flightPushEnabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `ticketEmailEnabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_pwa_installation_events_installed_at` ON `pwa_installation_events` (`installedAt`);