CREATE TABLE `ticket_notification_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_notification_emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticket_notification_emails_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `idx_ticket_notif_emails_active` ON `ticket_notification_emails` (`active`);