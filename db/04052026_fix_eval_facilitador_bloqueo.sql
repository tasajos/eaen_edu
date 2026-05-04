-- Permite guardar y bloquear la evaluacion del facilitador por cursante.
-- Ejecutar en produccion sobre la base eaen_educacion.

ALTER TABLE eval_facilitador
  ADD COLUMN IF NOT EXISTS bloqueado TINYINT(1) NOT NULL DEFAULT 0 AFTER c4;
