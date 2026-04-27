CREATE INDEX `idx_flight_weeks_weekNumber` ON `flight_weeks` (`weekNumber`);--> statement-breakpoint
CREATE INDEX `idx_flight_weeks_isTicketIssued` ON `flight_weeks` (`isTicketIssued`);--> statement-breakpoint
CREATE INDEX `idx_flight_weeks_isDeleted` ON `flight_weeks` (`isDeleted`);--> statement-breakpoint
CREATE INDEX `idx_flight_weeks_active_issued` ON `flight_weeks` (`isDeleted`,`isTicketIssued`);