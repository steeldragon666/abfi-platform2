CREATE TABLE `financialInstitutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`institutionName` varchar(255) NOT NULL,
	`abn` varchar(11) NOT NULL,
	`institutionType` enum('commercial_bank','investment_bank','private_equity','venture_capital','insurance','superannuation','government_agency','development_finance','other') NOT NULL,
	`regulatoryBody` varchar(255),
	`licenseNumber` varchar(100),
	`contactName` varchar(255) NOT NULL,
	`contactTitle` varchar(255),
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`verificationMethod` enum('mygov_id','document_upload','manual_review'),
	`verificationStatus` enum('pending','verified','rejected','suspended') NOT NULL DEFAULT 'pending',
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`accessTier` enum('basic','professional','enterprise') NOT NULL DEFAULT 'basic',
	`dataCategories` json,
	`authorizedRepresentative` boolean NOT NULL DEFAULT false,
	`dataProtection` boolean NOT NULL DEFAULT false,
	`regulatoryCompliance` boolean NOT NULL DEFAULT false,
	`termsAccepted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialInstitutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `financialInstitutions_abn_unique` UNIQUE(`abn`)
);
--> statement-breakpoint
ALTER TABLE `financialInstitutions` ADD CONSTRAINT `financialInstitutions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financialInstitutions` ADD CONSTRAINT `financialInstitutions_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `financialInstitutions_userId_idx` ON `financialInstitutions` (`userId`);--> statement-breakpoint
CREATE INDEX `financialInstitutions_verificationStatus_idx` ON `financialInstitutions` (`verificationStatus`);