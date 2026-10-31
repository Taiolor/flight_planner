CREATE TABLE `operational_category_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`category` enum('viagens','orcamento','milhas','creditos') NOT NULL,
	`targetValue` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_category_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_operational_goals_year_category` UNIQUE(`year`,`category`)
);
--> statement-breakpoint
CREATE TABLE `operational_flight_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`weekNumber` int NOT NULL,
	`attachmentType` enum('comprovante','cartao_embarque','recibo','outro') NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`description` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operational_flight_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_travel_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`weekNumber` int NOT NULL,
	`category` enum('checkin','bagagem','assento','traslado','hospedagem','documentos','outro') NOT NULL,
	`label` varchar(160) NOT NULL,
	`dueAt` timestamp,
	`completed` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_travel_checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_travel_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`airline` varchar(80) NOT NULL,
	`creditType` enum('credito','voucher','reembolso') NOT NULL,
	`code` varchar(120),
	`originalCents` int NOT NULL,
	`availableCents` int NOT NULL,
	`expiresAt` timestamp,
	`status` enum('ativo','usado','expirado') NOT NULL DEFAULT 'ativo',
	`linkedWeekNumber` int,
	`notes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_travel_credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_operational_attachments_year_week` ON `operational_flight_attachments` (`year`,`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_operational_checklists_year_week` ON `operational_travel_checklists` (`year`,`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_operational_checklists_pending` ON `operational_travel_checklists` (`year`,`completed`);--> statement-breakpoint
CREATE INDEX `idx_operational_credits_year_status` ON `operational_travel_credits` (`year`,`status`);--> statement-breakpoint
CREATE INDEX `idx_operational_credits_expiration` ON `operational_travel_credits` (`year`,`expiresAt`);