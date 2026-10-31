CREATE TABLE `additional_flights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`weekNumber` int NOT NULL,
	`isTicketIssued` int NOT NULL DEFAULT 0,
	`departureAirline` varchar(50),
	`returnAirline` varchar(50),
	`departureFlightDatetime` varchar(30),
	`returnFlightDatetime` varchar(30),
	`departureAirport` varchar(10),
	`returnAirport` varchar(10),
	`departureLocator` varchar(20),
	`returnLocator` varchar(20),
	`departureFlightNumber` varchar(20),
	`returnFlightNumber` varchar(20),
	`departureTerminal` varchar(20),
	`returnTerminal` varchar(20),
	`ticketType` varchar(20) DEFAULT 'roundtrip',
	`smilesPoints` int,
	`latamPassPoints` int,
	`departureRescheduled` int NOT NULL DEFAULT 0,
	`returnRescheduled` int NOT NULL DEFAULT 0,
	`departureCancelled` int NOT NULL DEFAULT 0,
	`returnCancelled` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `additional_flights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_additional_flights_year_week` ON `additional_flights` (`year`,`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_additional_flights_issued` ON `additional_flights` (`year`,`isTicketIssued`);