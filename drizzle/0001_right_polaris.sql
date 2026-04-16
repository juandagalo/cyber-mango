CREATE TABLE `phases` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#00FFFF' NOT NULL,
	`position` real NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_phases_board_position` ON `phases` (`board_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_phases_board_name` ON `phases` (`board_id`,`name`);--> statement-breakpoint
ALTER TABLE `cards` ADD `phase_id` text REFERENCES phases(id) ON DELETE SET NULL;