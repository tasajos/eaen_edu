-- Normaliza calificaciones antiguas para que la vista del cursante las encuentre por materia.
-- Ejecutar en produccion sobre la base eaen_educacion.

START TRANSACTION;

UPDATE calificaciones c
JOIN eval_config ec ON ec.id = c.eval_config_id
SET
  c.materia_id = COALESCE(c.materia_id, ec.materia_id),
  c.curso_id   = COALESCE(c.curso_id, ec.curso_id)
WHERE c.eval_config_id IS NOT NULL
  AND ec.materia_id IS NOT NULL
  AND (c.materia_id IS NULL OR c.curso_id IS NULL);

INSERT INTO calificaciones (
  curso_id,
  materia_id,
  usuario_id,
  eval_config_id,
  nota,
  bloqueado,
  registrado_por
)
SELECT
  ec.curso_id,
  ec.materia_id,
  base.usuario_id,
  ec.id,
  0,
  base.bloqueado,
  base.registrado_por
FROM eval_config ec
JOIN (
  SELECT
    ec2.materia_id,
    c.usuario_id,
    MAX(c.bloqueado) AS bloqueado,
    MAX(c.registrado_por) AS registrado_por
  FROM calificaciones c
  JOIN eval_config ec2 ON ec2.id = c.eval_config_id
  WHERE ec2.materia_id IS NOT NULL
  GROUP BY ec2.materia_id, c.usuario_id
) base ON base.materia_id = ec.materia_id
LEFT JOIN calificaciones existente
  ON existente.usuario_id = base.usuario_id
 AND existente.eval_config_id = ec.id
WHERE existente.id IS NULL;

COMMIT;
