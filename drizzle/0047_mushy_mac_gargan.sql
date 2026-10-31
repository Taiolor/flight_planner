CREATE TABLE `operational_report_schedules` (
	`id` int NOT NULL,
	`year` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`cronExpression` varchar(80) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_report_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_operational_report_schedule_task` ON `operational_report_schedules` (`scheduleCronTaskUid`);