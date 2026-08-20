CREATE TABLE `flight_memory_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`weekNumber` int NOT NULL,
	`summary` text NOT NULL,
	`model` varchar(80) NOT NULL,
	`sourceFingerprint` varchar(64) NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flight_memory_summaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_flight_memory_summaries_year_week` UNIQUE(`year`,`weekNumber`)
);
--> statement-breakpoint
CREATE INDEX `idx_flight_memory_summaries_year_generated` ON `flight_memory_summaries` (`year`,`generatedAt`);