CREATE TABLE `flight_access_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flight_access_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `flight_access_roles_email_unique` UNIQUE(`email`)
);
