CREATE TABLE `ba_playlist_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`songTitle` text NOT NULL,
	`songLink` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `ba_user`(`id`) ON UPDATE no action ON DELETE no action
);
