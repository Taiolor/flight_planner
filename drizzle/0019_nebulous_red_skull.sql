CREATE TABLE `public_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`airline` varchar(50) NOT NULL,
	`price` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_prices_id` PRIMARY KEY(`id`)
);
