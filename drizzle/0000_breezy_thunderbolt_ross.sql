CREATE TABLE `collection_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`period` text,
	`status` text NOT NULL,
	`record_count` real NOT NULL,
	`collected_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `price_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`city` text NOT NULL,
	`community_id` text,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`price` real NOT NULL,
	`price_type` text NOT NULL,
	`source_url` text NOT NULL,
	`observed_at` text NOT NULL,
	`longitude` real,
	`latitude` real
);
--> statement-breakpoint
CREATE INDEX `entity_period_idx` ON `price_observations` (`city`,`community_id`,`period`);