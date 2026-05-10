-- ═══════════════════════════════════════════════════════════════
-- Módulo de Evaluaciones Institucionales — tablas + datos semilla
-- Safe to run multiple times (IF NOT EXISTS + INSERT IGNORE)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `eval_inst_plantillas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('CURSANTE_A_CURSANTE','CURSANTE_A_DOCENTE') NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `eval_inst_indicadores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plantilla_id` int(11) NOT NULL,
  `orden` int(11) DEFAULT 0,
  `texto` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `plantilla_id` (`plantilla_id`),
  CONSTRAINT `eval_inst_indicadores_ibfk_1`
    FOREIGN KEY (`plantilla_id`) REFERENCES `eval_inst_plantillas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `eval_inst_periodos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plantilla_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `habilitado` tinyint(1) DEFAULT 1,
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL,
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `plantilla_id` (`plantilla_id`),
  KEY `curso_id` (`curso_id`),
  CONSTRAINT `eval_inst_periodos_ibfk_1`
    FOREIGN KEY (`plantilla_id`) REFERENCES `eval_inst_plantillas` (`id`),
  CONSTRAINT `eval_inst_periodos_ibfk_2`
    FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `eval_inst_respuestas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `periodo_id` int(11) NOT NULL,
  `evaluador_id` int(11) NOT NULL,
  `evaluado_id` int(11) DEFAULT NULL,
  `completada` tinyint(1) DEFAULT 0,
  `enviado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resp` (`periodo_id`,`evaluador_id`,`evaluado_id`),
  CONSTRAINT `eval_inst_respuestas_ibfk_1`
    FOREIGN KEY (`periodo_id`) REFERENCES `eval_inst_periodos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `eval_inst_valoraciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `respuesta_id` int(11) NOT NULL,
  `indicador_id` int(11) NOT NULL,
  `valor` tinyint(4) NOT NULL DEFAULT 100,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_val` (`respuesta_id`,`indicador_id`),
  KEY `indicador_id` (`indicador_id`),
  CONSTRAINT `eval_inst_valoraciones_ibfk_1`
    FOREIGN KEY (`respuesta_id`) REFERENCES `eval_inst_respuestas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `eval_inst_valoraciones_ibfk_2`
    FOREIGN KEY (`indicador_id`) REFERENCES `eval_inst_indicadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos semilla
INSERT IGNORE INTO eval_inst_plantillas (id, tipo, titulo, descripcion, activa) VALUES
(1, 'CURSANTE_A_CURSANTE', 'Evaluación de Conducta entre Cursantes',
   'Evaluación del comportamiento y actitudes de los cursantes por sus pares.', 1),
(2, 'CURSANTE_A_DOCENTE',  'Evaluación Docente por Cursantes',
   'Evaluación del desempeño docente realizada por los cursantes de cada materia.', 1);

INSERT IGNORE INTO eval_inst_indicadores (id, plantilla_id, orden, texto) VALUES
(1,  1, 1, 'Procede con las normas institucionales'),
(2,  1, 2, 'Asume sus decisiones y/o responde por sus acciones'),
(3,  1, 3, 'Trata a las personas con dignidad y controla sus emociones'),
(4,  1, 4, 'Participa, contribuye y comparte en la investigación y la difusión del conocimiento'),
(5,  2, 1, 'El Docente elabora y presenta el programa de la asignatura al inicio del módulo'),
(6,  2, 2, 'Cumple con el programa de la asignatura de acuerdo a lo planificado'),
(7,  2, 3, 'Desarrolla con claridad los temas y relaciona la teoría con la práctica'),
(8,  2, 4, 'Promueve la participación activa del cursante en el desarrollo de la clase'),
(9,  2, 5, 'Utiliza un tono adecuado de voz y lenguaje claro y técnico'),
(10, 2, 6, 'El trato al cursante es respetuoso dentro y fuera del aula'),
(11, 2, 7, 'Absuelve las dudas de los cursantes de manera oportuna y clara'),
(12, 2, 8, 'Desarrolla sus clases de manera amena y estimulante'),
(13, 2, 9, 'Transmite confianza al cursante para que participe y realice preguntas'),
(14, 2,10, 'Evalúa las tareas asignadas de manera oportuna y dentro del plazo establecido'),
(15, 2,11, 'Existe relación entre las preguntas de los exámenes y los temas avanzados'),
(16, 2,12, 'Cumple con los horarios establecidos con puntualidad'),
(17, 2,13, 'Demuestra compromiso con su labor y formación del cursante');
