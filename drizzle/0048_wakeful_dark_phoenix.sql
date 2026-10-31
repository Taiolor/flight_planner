CREATE TABLE `mileage_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`purchaseDate` varchar(10) NOT NULL,
	`miles` int NOT NULL,
	`program` varchar(100) NOT NULL,
	`paidPriceCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mileage_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_mileage_purchases_year_date` ON `mileage_purchases` (`year`,`purchaseDate`);--> statement-breakpoint
CREATE INDEX `idx_mileage_purchases_year_program` ON `mileage_purchases` (`year`,`program`);