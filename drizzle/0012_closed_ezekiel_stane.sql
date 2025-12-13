ALTER TABLE `certificates` ADD `ratingGrade` varchar(10);--> statement-breakpoint
ALTER TABLE `certificates` ADD `assessmentDate` timestamp;--> statement-breakpoint
ALTER TABLE `certificates` ADD `certificatePdfUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `certificates` ADD `certificatePdfKey` varchar(500);