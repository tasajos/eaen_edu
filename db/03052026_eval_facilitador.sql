-- ============================================================
-- Migración: tabla eval_facilitador
-- Sistema de nota final compuesta (pesos fijos):
--   Catedrático 90% | Facilitador 2.5% | Cursantes 5% | Disciplina 2.5%
--
-- Los criterios c1-c4 se ingresan en escala 1-10 (TINYINT).
-- El backend convierte a 0-100 multiplicando ×10 para el cálculo final.
-- ============================================================

CREATE TABLE IF NOT EXISTS `eval_facilitador` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `curso_id`       INT           NOT NULL,
  `materia_id`     INT           NOT NULL,
  `cursante_id`    INT           NOT NULL,
  `registrado_por` INT           NOT NULL,
  `c1` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Aporte de información (1-10)',
  `c2` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Aprecia los hechos objetivamente (1-10)',
  `c3` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Decide con Acierto (1-10)',
  `c4` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Sostiene criterios con seguridad (1-10)',
  `actualizado_en` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_fac` (`materia_id`, `cursante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
