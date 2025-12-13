CREATE TABLE `certificateSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateId` int NOT NULL,
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	`snapshotHash` varchar(64) NOT NULL,
	`frozenScoreData` json NOT NULL,
	`frozenEvidenceSet` json NOT NULL,
	`immutable` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificateSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('lab_test','audit_report','registry_cert','contract','insurance_policy','financial_statement','land_title','sustainability_cert','quality_test','delivery_record','other') NOT NULL,
	`fileHash` varchar(64) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`issuerId` int,
	`issuerType` enum('lab','auditor','registry','counterparty','supplier','government','certification_body','self_declared') NOT NULL,
	`issuerName` varchar(255) NOT NULL,
	`issuerCredentials` text,
	`issuedDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`status` enum('valid','expired','revoked','superseded','pending_verification') NOT NULL DEFAULT 'valid',
	`versionNumber` int NOT NULL DEFAULT 1,
	`supersededById` int,
	`supersessionReason` text,
	`metadata` json,
	`uploadedBy` int NOT NULL,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceLinkages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` int NOT NULL,
	`linkedEntityType` enum('feedstock','supplier','certificate','abfi_score','bankability_assessment','grower_qualification','supply_agreement','project') NOT NULL,
	`linkedEntityId` int NOT NULL,
	`linkageType` enum('supports','validates','contradicts','supersedes','references') NOT NULL DEFAULT 'supports',
	`weightInCalculation` int,
	`linkedBy` int NOT NULL,
	`linkageNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceLinkages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `certificateSnapshots` ADD CONSTRAINT `certificateSnapshots_certificateId_certificates_id_fk` FOREIGN KEY (`certificateId`) REFERENCES `certificates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificateSnapshots` ADD CONSTRAINT `certificateSnapshots_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_supersededById_evidence_id_fk` FOREIGN KEY (`supersededById`) REFERENCES `evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceLinkages` ADD CONSTRAINT `evidenceLinkages_evidenceId_evidence_id_fk` FOREIGN KEY (`evidenceId`) REFERENCES `evidence`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceLinkages` ADD CONSTRAINT `evidenceLinkages_linkedBy_users_id_fk` FOREIGN KEY (`linkedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `certificateSnapshots_certificateId_idx` ON `certificateSnapshots` (`certificateId`);--> statement-breakpoint
CREATE INDEX `certificateSnapshots_snapshotHash_idx` ON `certificateSnapshots` (`snapshotHash`);--> statement-breakpoint
CREATE INDEX `evidence_fileHash_idx` ON `evidence` (`fileHash`);--> statement-breakpoint
CREATE INDEX `evidence_status_idx` ON `evidence` (`status`);--> statement-breakpoint
CREATE INDEX `evidence_type_idx` ON `evidence` (`type`);--> statement-breakpoint
CREATE INDEX `evidence_expiryDate_idx` ON `evidence` (`expiryDate`);--> statement-breakpoint
CREATE INDEX `evidenceLinkages_evidenceId_idx` ON `evidenceLinkages` (`evidenceId`);--> statement-breakpoint
CREATE INDEX `evidenceLinkages_entity_idx` ON `evidenceLinkages` (`linkedEntityType`,`linkedEntityId`);