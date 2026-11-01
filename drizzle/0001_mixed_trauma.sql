CREATE TABLE `data_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cache_expiry_idx` ON `data_cache` (`kind`,`expires_at`);--> statement-breakpoint
CREATE INDEX `spatial_period_idx` ON `price_observations` (`city`,`period`,`longitude`,`latitude`);