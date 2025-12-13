CREATE TABLE `bankabilityAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`assessmentNumber` varchar(50) NOT NULL,
	`assessmentDate` timestamp NOT NULL,
	`assessedBy` int,
	`volumeSecurityScore` int NOT NULL,
	`counterpartyQualityScore` int NOT NULL,
	`contractStructureScore` int NOT NULL,
	`concentrationRiskScore` int NOT NULL,
	`operationalReadinessScore` int NOT NULL,
	`compositeScore` int NOT NULL,
	`rating` enum('AAA','AA','A','BBB','BB','B','CCC') NOT NULL,
	`ratingDescription` varchar(100),
	`tier1Volume` int,
	`tier1Percent` int,
	`tier2Volume` int,
	`tier2Percent` int,
	`optionsVolume` int,
	`optionsPercent` int,
	`rofrVolume` int,
	`rofrPercent` int,
	`totalPrimaryVolume` int,
	`totalPrimaryPercent` int,
	`totalSecondaryVolume` int,
	`totalSecondaryPercent` int,
	`totalSecuredVolume` int,
	`totalSecuredPercent` int,
	`totalAgreements` int,
	`weightedAvgTerm` varchar(20),
	`weightedAvgGQ` varchar(20),
	`securityCoverageAmount` int,
	`supplierHHI` int,
	`largestSupplierPercent` int,
	`climateZones` int,
	`maxSingleEventExposure` int,
	`strengths` json,
	`monitoringItems` json,
	`status` enum('draft','submitted','under_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`validFrom` timestamp,
	`validUntil` timestamp,
	`certificateIssued` boolean DEFAULT false,
	`certificateIssuedAt` timestamp,
	`certificateUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankabilityAssessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankabilityAssessments_assessmentNumber_unique` UNIQUE(`assessmentNumber`)
);
--> statement-breakpoint
CREATE TABLE `covenantMonitoring` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`covenantType` varchar(100) NOT NULL,
	`covenantDescription` text,
	`thresholdValue` varchar(100) NOT NULL,
	`thresholdOperator` enum('>=','<=','=','>','<') NOT NULL,
	`currentValue` varchar(100),
	`inCompliance` boolean NOT NULL,
	`breachDate` timestamp,
	`breachNotified` boolean DEFAULT false,
	`breachNotifiedAt` timestamp,
	`curePeriodDays` int,
	`cureDeadline` timestamp,
	`cured` boolean DEFAULT false,
	`curedAt` timestamp,
	`lastCheckedAt` timestamp NOT NULL,
	`checkFrequency` enum('daily','weekly','monthly','quarterly') NOT NULL,
	`status` enum('active','breached','cured','waived','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `covenantMonitoring_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growerQualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`level` enum('GQ1','GQ2','GQ3','GQ4') NOT NULL,
	`levelName` varchar(50),
	`operatingHistoryScore` int,
	`financialStrengthScore` int,
	`landTenureScore` int,
	`productionCapacityScore` int,
	`creditScore` int,
	`insuranceScore` int,
	`compositeScore` int NOT NULL,
	`assessedBy` int,
	`assessmentDate` timestamp NOT NULL,
	`assessmentNotes` text,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`status` enum('pending','approved','expired','revoked') NOT NULL DEFAULT 'pending',
	`documentsUrl` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `growerQualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lenderAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`lenderName` varchar(255) NOT NULL,
	`lenderEmail` varchar(320) NOT NULL,
	`lenderContact` varchar(255),
	`accessToken` varchar(64) NOT NULL,
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`canViewAgreements` boolean DEFAULT true,
	`canViewAssessments` boolean DEFAULT true,
	`canViewCovenants` boolean DEFAULT true,
	`canDownloadReports` boolean DEFAULT true,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`status` enum('active','suspended','revoked','expired') NOT NULL DEFAULT 'active',
	`lastAccessedAt` timestamp,
	`accessCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lenderAccess_id` PRIMARY KEY(`id`),
	CONSTRAINT `lenderAccess_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`facilityLocation` varchar(255),
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`nameplateCapacity` int NOT NULL,
	`feedstockType` varchar(100),
	`targetCOD` timestamp,
	`financialCloseTarget` timestamp,
	`debtTenor` int,
	`status` enum('planning','development','financing','construction','operational','suspended') NOT NULL DEFAULT 'planning',
	`tier1Target` int DEFAULT 80,
	`tier2Target` int DEFAULT 40,
	`optionsTarget` int DEFAULT 15,
	`rofrTarget` int DEFAULT 15,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplyAgreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`supplierId` int NOT NULL,
	`tier` enum('tier1','tier2','option','rofr') NOT NULL,
	`annualVolume` int NOT NULL,
	`flexBandPercent` int,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`termYears` int NOT NULL,
	`pricingMechanism` enum('fixed','fixed_with_escalation','index_linked','index_with_floor_ceiling','spot_reference') NOT NULL,
	`basePrice` int,
	`floorPrice` int,
	`ceilingPrice` int,
	`escalationRate` varchar(50),
	`takeOrPayPercent` int,
	`deliverOrPayPercent` int,
	`optionFeePercent` int,
	`strikePrice` int,
	`exerciseWindowDays` int,
	`rofrAnnualFee` int,
	`rofrNoticeDays` int,
	`minAbfiScore` int,
	`maxCarbonIntensity` int,
	`qualitySpecs` json,
	`bankGuaranteePercent` int,
	`bankGuaranteeAmount` int,
	`parentGuarantee` boolean DEFAULT false,
	`lenderStepInRights` boolean DEFAULT false,
	`earlyTerminationNoticeDays` int,
	`lenderConsentRequired` boolean DEFAULT false,
	`forceMajeureVolumeReductionCap` int,
	`status` enum('draft','negotiation','executed','active','suspended','terminated') NOT NULL DEFAULT 'draft',
	`executionDate` timestamp,
	`documentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplyAgreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bankabilityAssessments` ADD CONSTRAINT `bankabilityAssessments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bankabilityAssessments` ADD CONSTRAINT `bankabilityAssessments_assessedBy_users_id_fk` FOREIGN KEY (`assessedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `covenantMonitoring` ADD CONSTRAINT `covenantMonitoring_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `growerQualifications` ADD CONSTRAINT `growerQualifications_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `growerQualifications` ADD CONSTRAINT `growerQualifications_assessedBy_users_id_fk` FOREIGN KEY (`assessedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lenderAccess` ADD CONSTRAINT `lenderAccess_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lenderAccess` ADD CONSTRAINT `lenderAccess_grantedBy_users_id_fk` FOREIGN KEY (`grantedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplyAgreements` ADD CONSTRAINT `supplyAgreements_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplyAgreements` ADD CONSTRAINT `supplyAgreements_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bankabilityAssessments_projectId_idx` ON `bankabilityAssessments` (`projectId`);--> statement-breakpoint
CREATE INDEX `bankabilityAssessments_assessmentNumber_idx` ON `bankabilityAssessments` (`assessmentNumber`);--> statement-breakpoint
CREATE INDEX `bankabilityAssessments_rating_idx` ON `bankabilityAssessments` (`rating`);--> statement-breakpoint
CREATE INDEX `bankabilityAssessments_status_idx` ON `bankabilityAssessments` (`status`);--> statement-breakpoint
CREATE INDEX `bankabilityAssessments_validUntil_idx` ON `bankabilityAssessments` (`validUntil`);--> statement-breakpoint
CREATE INDEX `covenantMonitoring_projectId_idx` ON `covenantMonitoring` (`projectId`);--> statement-breakpoint
CREATE INDEX `covenantMonitoring_status_idx` ON `covenantMonitoring` (`status`);--> statement-breakpoint
CREATE INDEX `covenantMonitoring_lastCheckedAt_idx` ON `covenantMonitoring` (`lastCheckedAt`);--> statement-breakpoint
CREATE INDEX `growerQualifications_supplierId_idx` ON `growerQualifications` (`supplierId`);--> statement-breakpoint
CREATE INDEX `growerQualifications_level_idx` ON `growerQualifications` (`level`);--> statement-breakpoint
CREATE INDEX `growerQualifications_status_idx` ON `growerQualifications` (`status`);--> statement-breakpoint
CREATE INDEX `growerQualifications_validUntil_idx` ON `growerQualifications` (`validUntil`);--> statement-breakpoint
CREATE INDEX `lenderAccess_projectId_idx` ON `lenderAccess` (`projectId`);--> statement-breakpoint
CREATE INDEX `lenderAccess_accessToken_idx` ON `lenderAccess` (`accessToken`);--> statement-breakpoint
CREATE INDEX `lenderAccess_status_idx` ON `lenderAccess` (`status`);--> statement-breakpoint
CREATE INDEX `projects_userId_idx` ON `projects` (`userId`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `supplyAgreements_projectId_idx` ON `supplyAgreements` (`projectId`);--> statement-breakpoint
CREATE INDEX `supplyAgreements_supplierId_idx` ON `supplyAgreements` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplyAgreements_tier_idx` ON `supplyAgreements` (`tier`);--> statement-breakpoint
CREATE INDEX `supplyAgreements_status_idx` ON `supplyAgreements` (`status`);