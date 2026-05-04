-- Sincroniza la columna academica Tarea/Trabajo/Practica con las entregas calificadas.
-- Si un docente califica una entrega Word con 100, la evaluacion "Tarea" queda en 100
-- y su ponderacion se aplica por el peso configurado en eval_config, normalmente 20%.
-- Ejecutar en produccion sobre la base eaen_educacion.

START TRANSACTION;

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
  te.usuario_id,
  ec.id,
  ROUND(AVG(te.nota), 2) AS nota,
  0 AS bloqueado,
  NULL AS registrado_por
FROM eval_config ec
JOIN tareas t ON t.materia_id = ec.materia_id
JOIN tarea_entregas te ON te.tarea_id = t.id
LEFT JOIN calificaciones c
  ON c.eval_config_id = ec.id
 AND c.usuario_id = te.usuario_id
WHERE (
    LOWER(ec.nombre) IN ('tarea','trabajo')
    OR LOWER(ec.nombre) LIKE 'pr_ctica'
  )
  AND te.nota IS NOT NULL
  AND c.id IS NULL
GROUP BY ec.curso_id, ec.materia_id, te.usuario_id, ec.id;

UPDATE calificaciones c
JOIN eval_config ec ON ec.id = c.eval_config_id
JOIN (
  SELECT
    t.materia_id,
    te.usuario_id,
    ROUND(AVG(te.nota), 2) AS promedio_tarea
  FROM tareas t
  JOIN tarea_entregas te ON te.tarea_id = t.id
  WHERE te.nota IS NOT NULL
  GROUP BY t.materia_id, te.usuario_id
) tarea_prom
  ON tarea_prom.materia_id = ec.materia_id
 AND tarea_prom.usuario_id = c.usuario_id
SET
  c.nota = tarea_prom.promedio_tarea,
  c.materia_id = COALESCE(c.materia_id, ec.materia_id),
  c.curso_id = COALESCE(c.curso_id, ec.curso_id),
  c.actualizado_en = NOW()
WHERE (
    LOWER(ec.nombre) IN ('tarea','trabajo')
    OR LOWER(ec.nombre) LIKE 'pr_ctica'
  );

COMMIT;
