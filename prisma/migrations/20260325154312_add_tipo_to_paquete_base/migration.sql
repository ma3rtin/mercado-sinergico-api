-- Dummy migration to sync drift without losing data
ALTER TABLE `PaqueteBase` ADD COLUMN `tipo` ENUM('SINERGICO', 'ENERGICO', 'POR_DEFINIR') NOT NULL DEFAULT 'SINERGICO';
