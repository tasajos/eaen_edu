-- ============================================================
-- Migración: columnas materia_id y bloqueado en calificaciones,
--            columna materia_id en eval_config
-- Requerido para el sistema de calificaciones por materia
-- ============================================================

-- 1. Agregar materia_id y bloqueado a calificaciones
ALTER TABLE `calificaciones`
  ADD COLUMN `materia_id` INT DEFAULT NULL AFTER `curso_id`,
  ADD COLUMN `bloqueado`  TINYINT(1) NOT NULL DEFAULT 0 AFTER `nota`;

-- 2. Agregar FK de materia_id a curso_materias (opcional, si existe la tabla)
ALTER TABLE `calificaciones`
  ADD KEY `idx_calif_materia` (`materia_id`),
  ADD CONSTRAINT `fk_calif_materia`
    FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE;

-- 3. Agregar materia_id a eval_config
ALTER TABLE `eval_config`
  ADD COLUMN `materia_id` INT DEFAULT NULL AFTER `curso_id`,
  ADD KEY `idx_eval_materia` (`materia_id`),
  ADD CONSTRAINT `fk_eval_materia`
    FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE;
