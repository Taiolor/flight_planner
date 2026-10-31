CREATE TABLE `fly_ia_context_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`model` varchar(80) NOT NULL,
	`outcome` enum('generated','deterministic','provider_error','budget_blocked') NOT NULL,
	`contextChars` int NOT NULL DEFAULT 0,
	`historyChars` int NOT NULL DEFAULT 0,
	`memoryChars` int NOT NULL DEFAULT 0,
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`latencyMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fly_ia_context_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fly_ia_session_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`summary` text NOT NULL,
	`sourceResponsesCount` int NOT NULL DEFAULT 0,
	`summaryChars` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fly_ia_session_memories_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_fly_ia_session_memories_session_year` UNIQUE(`sessionKey`,`year`)
);
--> statement-breakpoint
CREATE INDEX `idx_fly_ia_context_metrics_created` ON `fly_ia_context_metrics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_fly_ia_context_metrics_session_year` ON `fly_ia_context_metrics` (`sessionKey`,`year`);--> statement-breakpoint
CREATE INDEX `idx_fly_ia_session_memories_expires` ON `fly_ia_session_memories` (`expiresAt`);