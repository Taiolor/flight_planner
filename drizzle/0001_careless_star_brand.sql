CREATE TABLE `flight_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekNumber` int NOT NULL,
	`airline` varchar(50) NOT NULL,
	`price` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flight_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flight_weeks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekNumber` int NOT NULL,
	`departureDate` varchar(20) NOT NULL,
	`returnDate` varchar(20) NOT NULL,
	`departureDayOfWeek` varchar(20) NOT NULL,
	`returnDayOfWeek` varchar(20) NOT NULL,
	`holiday` varchar(100),
	`isDeleted` int NOT NULL DEFAULT 0,
	`isTicketIssued` int NOT NULL DEFAULT 0,
	`isSelected` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flight_weeks_id` PRIMARY KEY(`id`)
);
