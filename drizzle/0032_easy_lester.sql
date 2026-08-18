CREATE TABLE `flight_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`weekNumber` int NOT NULL,
	`title` varchar(160),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flight_memories_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_flight_memories_year_week` UNIQUE(`year`,`weekNumber`)
);
--> statement-breakpoint
CREATE TABLE `flight_memory_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memoryId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` text NOT NULL,
	`mediaType` enum('image','video') NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`caption` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flight_memory_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_flight_memory_media_memory` ON `flight_memory_media` (`memoryId`);