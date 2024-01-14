CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userLogins` (
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerId` text NOT NULL,
	`providerEmail` text NOT NULL,
	`createdAt` integer NOT NULL,
	PRIMARY KEY(`provider`, `providerId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
