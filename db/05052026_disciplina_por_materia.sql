-- Disciplina por materia: agrega materia_id a disciplina_registros
-- Registros existentes quedan con materia_id = NULL

ALTER TABLE disciplina_registros
  ADD COLUMN materia_id INT NULL AFTER curso_id;

ALTER TABLE disciplina_registros
  ADD INDEX idx_disc_reg_materia (materia_id);
