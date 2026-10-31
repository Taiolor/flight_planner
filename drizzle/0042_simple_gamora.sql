CREATE TABLE `financial_monthly_budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`budgetCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_monthly_budgets_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_financial_monthly_budgets_year_month` UNIQUE(`year`,`month`)
);
--> statement-breakpoint
CREATE INDEX `idx_financial_monthly_budgets_year` ON `financial_monthly_budgets` (`year`);