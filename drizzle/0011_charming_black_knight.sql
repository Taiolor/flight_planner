CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekNumber` int NOT NULL,
	`direction` varchar(10) NOT NULL,
	`avisoLabel` varchar(30) NOT NULL,
	`avisoMinutes` int NOT NULL,
	`airline` varchar(50),
	`flightNumber` varchar(20),
	`flightDatetime` varchar(30),
	`status` varchar(20) NOT NULL DEFAULT 'success',
	`devicesReached` int NOT NULL DEFAULT 0,
	`totalDevices` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`isTest` int NOT NULL DEFAULT 0,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
