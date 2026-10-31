ALTER TABLE `notification_logs` ADD `deliveryKey` varchar(160);--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `uq_notification_logs_delivery_key` UNIQUE(`deliveryKey`);