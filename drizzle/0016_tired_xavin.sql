CREATE TABLE `demandSignals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`userId` int NOT NULL,
	`signalNumber` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`feedstockType` varchar(100) NOT NULL,
	`feedstockCategory` enum('agricultural_residue','forestry_residue','energy_crop','organic_waste','algae_aquatic','mixed') NOT NULL,
	`annualVolume` int NOT NULL,
	`volumeFlexibility` int,
	`deliveryFrequency` enum('continuous','weekly','fortnightly','monthly','quarterly','seasonal','spot') NOT NULL,
	`minMoistureContent` int,
	`maxMoistureContent` int,
	`minEnergyContent` int,
	`maxAshContent` int,
	`maxChlorineContent` int,
	`otherQualitySpecs` text,
	`deliveryLocation` varchar(255) NOT NULL,
	`deliveryState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`deliveryLatitude` varchar(20),
	`deliveryLongitude` varchar(20),
	`maxTransportDistance` int,
	`deliveryMethod` enum('ex_farm','delivered','fob_port','negotiable') NOT NULL,
	`indicativePriceMin` int,
	`indicativePriceMax` int,
	`pricingMechanism` enum('fixed','indexed','spot','negotiable') NOT NULL,
	`supplyStartDate` timestamp NOT NULL,
	`supplyEndDate` timestamp,
	`contractTerm` int,
	`responseDeadline` timestamp NOT NULL,
	`requiredCertifications` json,
	`sustainabilityRequirements` text,
	`status` enum('draft','published','closed','awarded','cancelled') NOT NULL DEFAULT 'draft',
	`isPublic` boolean NOT NULL DEFAULT true,
	`targetSuppliers` json,
	`listingFee` int,
	`listingFeePaid` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`responseCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	`closedAt` timestamp,
	CONSTRAINT `demandSignals_id` PRIMARY KEY(`id`),
	CONSTRAINT `demandSignals_signalNumber_unique` UNIQUE(`signalNumber`)
);
--> statement-breakpoint
CREATE TABLE `platformTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`supplierId` int NOT NULL,
	`demandSignalId` int,
	`supplierResponseId` int,
	`supplyAgreementId` int,
	`transactionNumber` varchar(50) NOT NULL,
	`transactionType` enum('offtake_agreement','spot_purchase','listing_fee','verification_fee','subscription_fee','assessment_fee') NOT NULL,
	`contractValue` int,
	`annualVolume` int,
	`platformFeePercent` varchar(10),
	`platformFeeAmount` int,
	`status` enum('pending','confirmed','completed','disputed','cancelled') NOT NULL DEFAULT 'pending',
	`invoiceIssued` boolean NOT NULL DEFAULT false,
	`invoiceIssuedAt` timestamp,
	`paymentReceived` boolean NOT NULL DEFAULT false,
	`paymentReceivedAt` timestamp,
	`confirmedBy` int,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformTransactions_transactionNumber_unique` UNIQUE(`transactionNumber`)
);
--> statement-breakpoint
CREATE TABLE `supplierResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demandSignalId` int NOT NULL,
	`supplierId` int NOT NULL,
	`userId` int NOT NULL,
	`responseNumber` varchar(50) NOT NULL,
	`proposedVolume` int NOT NULL,
	`proposedPrice` int NOT NULL,
	`proposedDeliveryMethod` varchar(100),
	`proposedStartDate` timestamp NOT NULL,
	`proposedContractTerm` int,
	`coverLetter` text,
	`linkedFeedstocks` json,
	`linkedCertificates` json,
	`linkedEvidence` json,
	`matchScore` int,
	`matchReasons` json,
	`status` enum('submitted','shortlisted','rejected','accepted','withdrawn') NOT NULL DEFAULT 'submitted',
	`viewedByBuyer` boolean NOT NULL DEFAULT false,
	`viewedAt` timestamp,
	`buyerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierResponses_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplierResponses_responseNumber_unique` UNIQUE(`responseNumber`)
);
--> statement-breakpoint
ALTER TABLE `demandSignals` ADD CONSTRAINT `demandSignals_buyerId_buyers_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demandSignals` ADD CONSTRAINT `demandSignals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformTransactions` ADD CONSTRAINT `platformTransactions_buyerId_buyers_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformTransactions` ADD CONSTRAINT `platformTransactions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformTransactions` ADD CONSTRAINT `platformTransactions_demandSignalId_demandSignals_id_fk` FOREIGN KEY (`demandSignalId`) REFERENCES `demandSignals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformTransactions` ADD CONSTRAINT `platformTransactions_supplierResponseId_supplierResponses_id_fk` FOREIGN KEY (`supplierResponseId`) REFERENCES `supplierResponses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformTransactions` ADD CONSTRAINT `platformTransactions_supplyAgreementId_supplyAgreements_id_fk` FOREIGN KEY (`supplyAgreementId`) REFERENCES `supplyAgreements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformTransactions` ADD CONSTRAINT `platformTransactions_confirmedBy_users_id_fk` FOREIGN KEY (`confirmedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponses` ADD CONSTRAINT `supplierResponses_demandSignalId_demandSignals_id_fk` FOREIGN KEY (`demandSignalId`) REFERENCES `demandSignals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponses` ADD CONSTRAINT `supplierResponses_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponses` ADD CONSTRAINT `supplierResponses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `demandSignals_buyerId_idx` ON `demandSignals` (`buyerId`);--> statement-breakpoint
CREATE INDEX `demandSignals_status_idx` ON `demandSignals` (`status`);--> statement-breakpoint
CREATE INDEX `demandSignals_feedstockType_idx` ON `demandSignals` (`feedstockType`);--> statement-breakpoint
CREATE INDEX `demandSignals_deliveryState_idx` ON `demandSignals` (`deliveryState`);--> statement-breakpoint
CREATE INDEX `demandSignals_responseDeadline_idx` ON `demandSignals` (`responseDeadline`);--> statement-breakpoint
CREATE INDEX `platformTransactions_buyerId_idx` ON `platformTransactions` (`buyerId`);--> statement-breakpoint
CREATE INDEX `platformTransactions_supplierId_idx` ON `platformTransactions` (`supplierId`);--> statement-breakpoint
CREATE INDEX `platformTransactions_status_idx` ON `platformTransactions` (`status`);--> statement-breakpoint
CREATE INDEX `platformTransactions_transactionType_idx` ON `platformTransactions` (`transactionType`);--> statement-breakpoint
CREATE INDEX `supplierResponses_demandSignalId_idx` ON `supplierResponses` (`demandSignalId`);--> statement-breakpoint
CREATE INDEX `supplierResponses_supplierId_idx` ON `supplierResponses` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierResponses_status_idx` ON `supplierResponses` (`status`);--> statement-breakpoint
CREATE INDEX `supplierResponses_matchScore_idx` ON `supplierResponses` (`matchScore`);