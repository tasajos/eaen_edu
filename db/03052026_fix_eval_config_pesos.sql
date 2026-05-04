-- ============================================================
-- Fix: corregir pesos del eval_config auto-generados con 50/50
-- Sistema fijo: Examen 70% + Tarea 20% = 90% catedrático
-- (Examen 70 + Tarea 20 + Facilitador 2.5 + Cursantes 5 + Disciplina 2.5 = 100)
-- ============================================================

UPDATE `eval_config` SET `peso` = 70 WHERE `nombre` = 'Examen';
UPDATE `eval_config` SET `peso` = 20 WHERE `nombre` = 'Tarea';

-- Verificar resultado:
-- SELECT id, materia_id, nombre, peso FROM eval_config WHERE nombre IN ('Examen','Tarea');
-- Esperado: Examen=70.00, Tarea=20.00
