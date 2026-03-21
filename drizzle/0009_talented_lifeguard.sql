CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aviso1Minutes` int NOT NULL DEFAULT 1440,
	`aviso2Minutes` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
