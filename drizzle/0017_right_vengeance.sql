CREATE TABLE `api_usage_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`yearMonth` varchar(7) NOT NULL,
	`requestsUsed` int NOT NULL DEFAULT 0,
	`requestsLimit` int NOT NULL DEFAULT 20,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_usage_tracker_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_usage_tracker_yearMonth_unique` UNIQUE(`yearMonth`)
);
--> statement-breakpoint
CREATE TABLE `flight_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekNumber` int NOT NULL,
	`departureDate` varchar(20) NOT NULL,
	`returnDate` varchar(20) NOT NULL,
	`lowestPrice` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'BRL',
	`source` enum('api','manual') NOT NULL,
	`airline` varchar(100),
	`apiRequestsUsed` int NOT NULL DEFAULT 0,
	`rawResponse` text,
	`quotedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flight_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_flight_quotes_weekNumber` ON `flight_quotes` (`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_flight_quotes_quotedAt` ON `flight_quotes` (`quotedAt`);