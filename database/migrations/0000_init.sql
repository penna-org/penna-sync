CREATE TABLE `personal_access_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tokenable_type` text NOT NULL,
	`tokenable_id` text NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`abilities` text NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personal_access_tokens_token_unique` ON `personal_access_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_tokenable_index` ON `personal_access_tokens` (`tokenable_type`,`tokenable_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`doc_id` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text,
	`deleted_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_doc_id_unique` ON `documents` (`doc_id`);--> statement-breakpoint
CREATE INDEX `documents_updated_index` ON `documents` (`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text,
	`created_at` integer,
	`updated_at` integer
);
