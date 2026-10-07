-- Refactor: auth 100% Firebase. Contraseñas legacy se mantienen en DB pero ya no se usan.
-- Nuevo campo firebaseUid permite login silencioso de usuarios existentes por email.

ALTER TABLE `Usuario`
  ADD COLUMN `firebaseUid` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Usuario_firebaseUid_key`(`firebaseUid`);

ALTER TABLE `Usuario`
  MODIFY COLUMN `contraseña` VARCHAR(191) NULL;