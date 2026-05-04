-- ============================================================
-- Fix: corregir pesos del eval_config mal auto-generados (50/50)
-- Sistema fijo: Examen 70% + Tarea 20% = 90% catedrático
-- ============================================================

UPDATE `eval_config` SET `peso` = 70 WHERE `nombre` = 'Examen';
UPDATE `eval_config` SET `peso` = 20 WHERE `nombre` = 'Tarea';
