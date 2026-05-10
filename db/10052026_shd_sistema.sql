-- ═══════════════════════════════════════════════════════════════
-- Sistema SHD — Saber (30%) / Hacer (40%) / Decidir (20%)
-- Reemplaza el sistema Examen/Tarea para la calificación del docente
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shd_indicadores (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  dimension  VARCHAR(20)  NOT NULL,
  seccion    VARCHAR(100) NOT NULL,
  codigo     VARCHAR(5)   NOT NULL,
  nombre     VARCHAR(255) NOT NULL,
  orden      INT NOT NULL DEFAULT 0
);

INSERT INTO shd_indicadores (dimension, seccion, codigo, nombre, orden) VALUES
-- SABER / 30 pts ── Dimensión 2
('SABER', 'RESOLUCIÓN DE PROBLEMAS', 'a', 'Investigación con Profundidad y acierto',  1),
('SABER', 'RESOLUCIÓN DE PROBLEMAS', 'b', 'Capacidad de Análisis',                    2),
('SABER', 'RESOLUCIÓN DE PROBLEMAS', 'c', 'Acierto en la comprensión y solución',     3),
('SABER', 'EXPRESIÓN ESCRITA',       'a', 'Calidad y precisión en la redacción',      4),
('SABER', 'EXPRESIÓN ESCRITA',       'b', 'Ortografía',                               5),
('SABER', 'EXPRESIÓN ESCRITA',       'c', 'Hecho coherente y con objetividad',        6),
-- HACER / 40 pts ── Dimensión 3
('HACER', 'EXPRESIÓN ORAL',          'a', 'Expone sus ideas en forma clara',          7),
('HACER', 'EXPRESIÓN ORAL',          'b', 'Coherente en el razonamiento',             8),
('HACER', 'EXPRESIÓN ORAL',          'c', 'Capacidad de síntesis',                   9),
('HACER', 'EXPRESIÓN ORAL',          'd', 'Uso correcto de terminología',            10),
('HACER', 'EXPRESIÓN ORAL',          'e', 'Uso correcto de recursos técnicos',       11),
('HACER', 'EXPRESIÓN ORAL',          'f', 'Sostiene sus criterios con seguridad',    12),
('HACER', 'EXPRESIÓN ORAL',          'g', 'Prueba o sustentación oral individual',   13),
-- DECIDIR / 20 pts ── Dimensión 4
('DECIDIR', 'ACTUACIÓN EN GRUPOS',   'a', 'Aporte de Información',                  14),
('DECIDIR', 'ACTUACIÓN EN GRUPOS',   'b', 'Dominio de técnicas de dinámica de grupo',15),
('DECIDIR', 'ACTUACIÓN EN GRUPOS',   'c', 'Capacidad de Organización',              16),
('DECIDIR', 'TOMA DE DECISIONES',    'a', 'Aprecia los hechos objetivamente',       17),
('DECIDIR', 'TOMA DE DECISIONES',    'b', 'Decide con acierto',                     18);

CREATE TABLE IF NOT EXISTS shd_notas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  materia_id      INT NOT NULL,
  curso_id        INT NOT NULL,
  usuario_id      INT NOT NULL,
  indicador_id    INT NOT NULL,
  nota            DECIMAL(5,2)  DEFAULT NULL,
  bloqueado       TINYINT NOT NULL DEFAULT 0,
  registrado_por  INT DEFAULT NULL,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_shd_nota (materia_id, usuario_id, indicador_id),
  KEY idx_shd_materia  (materia_id),
  KEY idx_shd_mat_usr  (materia_id, usuario_id)
);
