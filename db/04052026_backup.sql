-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: eaen_educacion
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL DEFAULT 0,
  `usuario_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('P','A','T','J') NOT NULL DEFAULT 'P',
  `observacion` varchar(500) DEFAULT NULL,
  `registrado_por` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asist_curso_usuario_fecha` (`curso_id`,`usuario_id`,`fecha`),
  UNIQUE KEY `uq_asist_materia_usuario_fecha` (`materia_id`,`usuario_id`,`fecha`),
  KEY `registrado_por` (`registrado_por`),
  KEY `idx_asist_curso_fecha` (`curso_id`,`fecha`),
  KEY `idx_asist_usuario` (`usuario_id`),
  CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asistencia_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asistencia_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asist_materia` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
INSERT INTO `asistencia` VALUES (15,3,1,2,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(16,3,1,3,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(17,3,1,7,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(18,3,1,4,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(19,3,1,5,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(20,3,1,9,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(21,3,1,8,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37');
/*!40000 ALTER TABLE `asistencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calificaciones`
--

DROP TABLE IF EXISTS `calificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calificaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `eval_config_id` int(11) NOT NULL,
  `nota` decimal(5,2) NOT NULL DEFAULT 0.00,
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  `registrado_por` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_calif_curso_usuario_eval` (`curso_id`,`usuario_id`,`eval_config_id`),
  KEY `eval_config_id` (`eval_config_id`),
  KEY `registrado_por` (`registrado_por`),
  KEY `idx_calif_curso` (`curso_id`),
  KEY `idx_calif_usuario` (`usuario_id`),
  KEY `idx_calif_curso_usuario` (`curso_id`,`usuario_id`),
  KEY `idx_calif_materia` (`materia_id`),
  CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calificaciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calificaciones_ibfk_3` FOREIGN KEY (`eval_config_id`) REFERENCES `eval_config` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calificaciones_ibfk_4` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calif_materia` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificaciones`
--

LOCK TABLES `calificaciones` WRITE;
/*!40000 ALTER TABLE `calificaciones` DISABLE KEYS */;
INSERT INTO `calificaciones` VALUES (1,3,NULL,2,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(2,3,NULL,2,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(3,3,NULL,2,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(4,3,NULL,2,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(5,3,NULL,2,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(6,3,NULL,3,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(7,3,NULL,3,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(8,3,NULL,3,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(9,3,NULL,3,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(10,3,NULL,3,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(11,3,NULL,7,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(12,3,NULL,7,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(13,3,NULL,7,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(14,3,NULL,7,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(15,3,NULL,7,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(16,3,NULL,4,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(17,3,NULL,4,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(18,3,NULL,4,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(19,3,NULL,4,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(20,3,NULL,4,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(21,3,NULL,5,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(22,3,NULL,5,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(23,3,NULL,5,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(24,3,NULL,5,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(25,3,NULL,5,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(26,3,NULL,9,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(27,3,NULL,9,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(28,3,NULL,9,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(29,3,NULL,9,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(30,3,NULL,9,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(31,3,NULL,8,1,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(32,3,NULL,8,2,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(33,3,NULL,8,3,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(34,3,NULL,8,4,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(35,3,NULL,8,5,0.00,0,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59'),(36,3,1,2,6,100.00,1,NULL,'2026-05-03 21:14:32','2026-05-03 21:14:32'),(37,3,1,2,7,0.00,1,NULL,'2026-05-03 21:14:32','2026-05-03 21:14:32'),(38,3,1,7,6,100.00,1,NULL,'2026-05-03 23:07:59','2026-05-03 23:07:59'),(39,3,1,7,7,100.00,1,NULL,'2026-05-03 23:20:50','2026-05-03 23:46:18');
/*!40000 ALTER TABLE `calificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso_materias`
--

DROP TABLE IF EXISTS `curso_materias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso_materias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `codigo` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `horas` int(11) DEFAULT NULL,
  `docente_id` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materia_curso_nombre` (`curso_id`,`nombre`),
  KEY `idx_materia_curso` (`curso_id`),
  KEY `idx_materia_docente` (`docente_id`),
  CONSTRAINT `curso_materias_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `curso_materias_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso_materias`
--

LOCK TABLES `curso_materias` WRITE;
/*!40000 ALTER TABLE `curso_materias` DISABLE KEYS */;
INSERT INTO `curso_materias` VALUES (1,3,'BASES DE PLANIFICACION ESTRATEGICA','','',NULL,3,'2026-03-08 19:20:08'),(2,3,'CIBERSEGURIDAD Y CIBERDEFENSA','','',NULL,3,'2026-03-08 19:20:41'),(3,3,'DERECHOS HUMANOS Y D.I.H','','',NULL,NULL,'2026-03-08 19:20:51'),(4,3,'DIMENSION CIENCIA Y TECNOLOGIA','','',NULL,NULL,'2026-03-08 19:21:03'),(5,3,'DIMENSION CULTURAL','','',NULL,NULL,'2026-03-08 19:21:11'),(6,3,'DIMENSION ECONOMICA','','',NULL,NULL,'2026-03-08 19:21:19'),(7,3,'DIMENSION MILITAR','','',NULL,NULL,'2026-03-08 19:21:25'),(8,3,'DIMENSION POLITICA','','',NULL,NULL,'2026-03-08 19:21:33'),(9,3,'DOCTRINA DE SEGURIDAD Y DEFENSA','','',NULL,NULL,'2026-03-08 19:21:45'),(10,3,'FORMULACION DE POLITICAS Y ESTRATEGIAS','','',NULL,NULL,'2026-03-08 19:21:59'),(11,3,'GEOPOLITICA Y GEOESTRATEGICA','','',NULL,NULL,'2026-03-08 19:22:13'),(12,3,'GESTION CONSTRUCTIVA DE CONFLICTOS Y ACCION SIN DAÑO','','',NULL,NULL,'2026-03-08 19:22:26'),(13,3,'HISTORIA CRITICA DE BOLIVIA','','',NULL,NULL,'2026-03-08 19:22:37'),(14,3,'INTELIGENCIA ESTRATEGICA Y PROSPECTIVA','','',NULL,NULL,'2026-03-08 19:22:49'),(15,3,'MEDIO AMBIENTE','','',NULL,NULL,'2026-03-08 19:22:56'),(16,3,'METODOLOIA DE LA INVESTIGACION','','',NULL,NULL,'2026-03-08 19:23:05'),(17,3,'METODOLOGIA DE LA INVESTIGACION II','','',NULL,NULL,'2026-03-08 19:23:15'),(18,3,'PRACTICA PLANIFICACION ESTRATEGICA','','',NULL,NULL,'2026-03-08 19:23:36'),(19,3,'PRINCIPIOS FUNDAMENTALES DEL ESTADO','','',NULL,NULL,'2026-03-08 19:23:46'),(20,3,'RELACIONES INTERNACIONALES','','',NULL,NULL,'2026-03-08 19:23:53'),(21,3,'TALASOPOLITICA Y PROBLEMATICA DEL MAR','','',NULL,NULL,'2026-03-08 19:24:07'),(22,3,'TEORIA Y TRANSFORMACION DEL ESTADO','','',NULL,NULL,'2026-03-08 19:24:16');
/*!40000 ALTER TABLE `curso_materias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso_participantes`
--

DROP TABLE IF EXISTS `curso_participantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso_participantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curso_usuario` (`curso_id`,`usuario_id`),
  KEY `idx_curso` (`curso_id`),
  KEY `idx_usuario` (`usuario_id`),
  CONSTRAINT `fk_cp_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cp_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso_participantes`
--

LOCK TABLES `curso_participantes` WRITE;
/*!40000 ALTER TABLE `curso_participantes` DISABLE KEYS */;
INSERT INTO `curso_participantes` VALUES (1,1,2,'2026-02-16 20:46:11'),(2,1,3,'2026-02-16 20:46:11'),(3,1,7,'2026-02-16 20:46:11'),(4,1,4,'2026-02-16 20:46:11'),(5,1,5,'2026-02-16 20:46:11'),(6,1,9,'2026-02-16 20:46:11'),(7,1,8,'2026-02-16 20:46:11'),(8,2,2,'2026-02-16 20:57:46'),(9,2,3,'2026-02-16 20:57:46'),(10,2,7,'2026-02-16 20:57:46'),(11,2,4,'2026-02-16 20:57:46'),(12,2,5,'2026-02-16 20:57:46'),(13,2,9,'2026-02-16 20:57:46'),(14,2,8,'2026-02-16 20:57:46'),(15,3,2,'2026-03-08 21:17:19'),(16,3,3,'2026-03-08 21:17:19'),(17,3,7,'2026-03-08 21:17:19'),(18,3,4,'2026-03-08 21:17:19'),(19,3,5,'2026-03-08 21:17:19'),(20,3,9,'2026-03-08 21:17:19'),(21,3,8,'2026-03-08 21:17:19');
/*!40000 ALTER TABLE `curso_participantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso_responsabilidades`
--

DROP TABLE IF EXISTS `curso_responsabilidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso_responsabilidades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `rol` varchar(40) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curso_usuario_rol` (`curso_id`,`usuario_id`,`rol`),
  KEY `idx_curso` (`curso_id`),
  KEY `idx_usuario` (`usuario_id`),
  CONSTRAINT `fk_cr_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso_responsabilidades`
--

LOCK TABLES `curso_responsabilidades` WRITE;
/*!40000 ALTER TABLE `curso_responsabilidades` DISABLE KEYS */;
INSERT INTO `curso_responsabilidades` VALUES (4,2,3,'ENCARGADO_CURSO','2026-02-17 02:02:21');
/*!40000 ALTER TABLE `curso_responsabilidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cursos`
--

DROP TABLE IF EXISTS `cursos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cursos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `programa_id` int(11) DEFAULT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `docente_id` int(11) DEFAULT NULL,
  `jefe_curso_id` int(11) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `modalidad` varchar(30) DEFAULT NULL,
  `horas_academicas` int(11) DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `programa_id` (`programa_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `cursos_ibfk_1` FOREIGN KEY (`programa_id`) REFERENCES `programas` (`id`),
  CONSTRAINT `cursos_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cursos`
--

LOCK TABLES `cursos` WRITE;
/*!40000 ALTER TABLE `cursos` DISABLE KEYS */;
INSERT INTO `cursos` VALUES (1,NULL,'90','ES UNA PRUEBA',NULL,NULL,'2026-02-16','2026-11-13','Presencial',75,'ACTIVO','2026-02-16 20:46:11'),(2,NULL,'91',NULL,NULL,1,'2026-02-16','2026-12-26','Presencial',55,'ACTIVO','2026-02-16 20:57:46'),(3,NULL,'69','CURSO EAEN',NULL,1,'2026-04-10','2026-11-10','Presencial',0,'ACTIVO','2026-03-08 21:17:19');
/*!40000 ALTER TABLE `cursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_config`
--

DROP TABLE IF EXISTS `eval_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `peso` decimal(5,2) NOT NULL DEFAULT 20.00,
  `orden` tinyint(4) NOT NULL DEFAULT 1,
  `nota_min_apro` decimal(5,2) NOT NULL DEFAULT 70.00,
  `nota_max` decimal(5,2) NOT NULL DEFAULT 100.00,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eval_curso_nombre` (`curso_id`,`nombre`),
  KEY `idx_eval_curso` (`curso_id`),
  KEY `idx_eval_materia` (`materia_id`),
  CONSTRAINT `eval_config_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eval_materia` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_config`
--

LOCK TABLES `eval_config` WRITE;
/*!40000 ALTER TABLE `eval_config` DISABLE KEYS */;
INSERT INTO `eval_config` VALUES (1,3,NULL,'Eval. 1',20.00,1,70.00,100.00,'2026-03-08 18:39:59'),(2,3,NULL,'Eval. 2',20.00,2,70.00,100.00,'2026-03-08 18:39:59'),(3,3,NULL,'Eval. 3',20.00,3,70.00,100.00,'2026-03-08 18:39:59'),(4,3,NULL,'Trabajo',20.00,4,70.00,100.00,'2026-03-08 18:39:59'),(5,3,NULL,'Final',20.00,5,70.00,100.00,'2026-03-08 18:39:59'),(6,3,1,'Examen',70.00,1,70.00,100.00,'2026-05-03 21:14:32'),(7,3,1,'Tarea',20.00,2,70.00,100.00,'2026-05-03 21:14:32');
/*!40000 ALTER TABLE `eval_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_facilitador`
--

DROP TABLE IF EXISTS `eval_facilitador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_facilitador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `cursante_id` int(11) NOT NULL,
  `registrado_por` int(11) NOT NULL,
  `c1` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Aporte de información',
  `c2` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Aprecia los hechos objetivamente',
  `c3` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Decide con Acierto',
  `c4` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Sostiene criterios con seguridad',
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_fac` (`materia_id`,`cursante_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_facilitador`
--

LOCK TABLES `eval_facilitador` WRITE;
/*!40000 ALTER TABLE `eval_facilitador` DISABLE KEYS */;
INSERT INTO `eval_facilitador` VALUES (1,3,1,2,3,10.00,10.00,10.00,10.00,0,'2026-05-04 01:14:50'),(2,3,1,3,3,0.00,0.00,0.00,0.00,0,'2026-05-04 01:14:50'),(3,3,1,7,3,10.00,10.00,10.00,10.00,1,'2026-05-04 04:14:31'),(4,3,1,4,3,0.00,0.00,0.00,0.00,0,'2026-05-04 01:14:50'),(5,3,1,5,3,0.00,0.00,0.00,0.00,0,'2026-05-04 01:14:50'),(6,3,1,9,3,0.00,0.00,0.00,0.00,0,'2026-05-04 01:14:50'),(7,3,1,8,3,0.00,0.00,0.00,0.00,0,'2026-05-04 01:14:50');
/*!40000 ALTER TABLE `eval_facilitador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `curso_id` int(11) DEFAULT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `curso_id` (`curso_id`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('INFO','ALERTA','URGENTE') NOT NULL DEFAULT 'INFO',
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_notif_activa` (`activa`),
  KEY `idx_notif_tipo` (`tipo`),
  KEY `idx_notif_creado` (`creado_en`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,'Examen de Evaluacion','Evamen Prueba','INFO',NULL,'2026-03-08 17:51:31',1),(2,'Traer Documentacion','Traer Documentacion','ALERTA',NULL,'2026-03-08 17:51:57',1),(3,'PRioridad Reunion','Reunion','URGENTE',NULL,'2026-03-08 17:52:15',1);
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones_leidas`
--

DROP TABLE IF EXISTS `notificaciones_leidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones_leidas` (
  `notificacion_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `leida_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notificacion_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `notificaciones_leidas_ibfk_1` FOREIGN KEY (`notificacion_id`) REFERENCES `notificaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notificaciones_leidas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones_leidas`
--

LOCK TABLES `notificaciones_leidas` WRITE;
/*!40000 ALTER TABLE `notificaciones_leidas` DISABLE KEYS */;
INSERT INTO `notificaciones_leidas` VALUES (1,2,'2026-03-08 23:02:11'),(1,9,'2026-03-08 23:03:47'),(2,2,'2026-03-08 23:02:11'),(2,9,'2026-03-08 23:03:47'),(3,2,'2026-03-08 23:02:11'),(3,9,'2026-03-08 23:03:47');
/*!40000 ALTER TABLE `notificaciones_leidas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planificacion_docente`
--

DROP TABLE IF EXISTS `planificacion_docente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planificacion_docente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `docente_id` int(11) DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `objetivos` text DEFAULT NULL,
  `archivo_url` varchar(500) DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  `observacion` varchar(500) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `aprobado_en` datetime DEFAULT NULL,
  `aprobado_por` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `docente_id` (`docente_id`),
  KEY `aprobado_por` (`aprobado_por`),
  KEY `idx_plan_materia` (`materia_id`),
  KEY `idx_plan_curso` (`curso_id`),
  CONSTRAINT `planificacion_docente_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planificacion_docente_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `planificacion_docente_ibfk_3` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `planificacion_docente_ibfk_4` FOREIGN KEY (`aprobado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planificacion_docente`
--

LOCK TABLES `planificacion_docente` WRITE;
/*!40000 ALTER TABLE `planificacion_docente` DISABLE KEYS */;
/*!40000 ALTER TABLE `planificacion_docente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programas`
--

DROP TABLE IF EXISTS `programas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `nivel` enum('MAESTRIA','DIPLOMADO','DOCTORADO') NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programas`
--

LOCK TABLES `programas` WRITE;
/*!40000 ALTER TABLE `programas` DISABLE KEYS */;
/*!40000 ALTER TABLE `programas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tarea_entregas`
--

DROP TABLE IF EXISTS `tarea_entregas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarea_entregas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('PENDIENTE','ENTREGADO') NOT NULL DEFAULT 'PENDIENTE',
  `respuesta` text DEFAULT NULL,
  `archivo_nombre` varchar(255) DEFAULT NULL,
  `archivo_ruta` varchar(500) DEFAULT NULL,
  `nota` decimal(5,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `entregado_en` datetime DEFAULT NULL,
  `calificado_por` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entrega_tarea_usuario` (`tarea_id`,`usuario_id`),
  KEY `calificado_por` (`calificado_por`),
  KEY `idx_entrega_tarea` (`tarea_id`),
  KEY `idx_entrega_usuario` (`usuario_id`),
  CONSTRAINT `tarea_entregas_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tarea_entregas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tarea_entregas_ibfk_3` FOREIGN KEY (`calificado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarea_entregas`
--

LOCK TABLES `tarea_entregas` WRITE;
/*!40000 ALTER TABLE `tarea_entregas` DISABLE KEYS */;
INSERT INTO `tarea_entregas` VALUES (1,1,2,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 23:05:45','2026-05-03 23:05:45'),(2,1,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 23:05:45','2026-05-03 23:05:45'),(3,1,4,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 23:05:45','2026-05-03 23:05:45'),(4,1,5,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 23:05:45','2026-05-03 23:05:45'),(5,1,7,'ENTREGADO',NULL,'Tema_Tesis_Carlos_Azcarraga.docx','1777865604227-9b9k0t.docx',100.00,'','2026-05-03 23:33:24',3,'2026-05-03 23:05:45','2026-05-03 23:33:47'),(6,1,8,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 23:05:45','2026-05-03 23:05:45'),(7,1,9,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 23:05:45','2026-05-03 23:05:45');
/*!40000 ALTER TABLE `tarea_entregas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_limite` date DEFAULT NULL,
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_tarea_materia` (`materia_id`),
  KEY `idx_tarea_curso` (`curso_id`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,3,1,'ensayo','tes','2026-05-04',3,'2026-05-03 23:05:45');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `grado` varchar(80) DEFAULT NULL,
  `ap_paterno` varchar(100) DEFAULT NULL,
  `ap_materno` varchar(100) DEFAULT NULL,
  `ci` varchar(20) DEFAULT NULL,
  `ex` varchar(5) DEFAULT NULL,
  `filial` varchar(60) DEFAULT NULL,
  `fuerza` varchar(40) DEFAULT NULL,
  `turno` varchar(20) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `fecha_inscripcion` date DEFAULT NULL,
  `lugar_trabajo` varchar(150) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMIN','JEFE_ESTUDIOS','DOCENTE','JEFE_CURSO','CURSANTE') NOT NULL DEFAULT 'ADMIN',
  `estado` enum('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
  `tipo_usuario` varchar(40) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_nacimiento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  UNIQUE KEY `uq_usuarios_ci` (`ci`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`),
  KEY `idx_usuarios_ci` (`ci`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Carlos','Azcarraga',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'admin@eaen.bo','$2b$10$JHOMdTA7wN8S4BTy1xl/tuekoHM54K/ytMPM72ufJdaFDiHD5Y6zi','ADMIN','ACTIVO',NULL,'2026-02-15 18:59:29',NULL),(2,'CARLOS ANDRES','AZCARRAGA ESQUIVEL','Ing. Sistemas','AZCARRAGA','ESQUIVEL','4947021','LP','Cochabamba','Civil','Noche','70776212','2026-01-20','BAIRESDEV','tasajos@gmail.com','tasajos@gmail.com','$2b$10$9tccmYrCQynD15PZlDtm8unLEs8KoioCxEggvg13lcSVmHDR0TG32','JEFE_ESTUDIOS','ACTIVO',NULL,'2026-02-16 00:45:01','1985-11-29'),(3,'PABLO ERNESTO','AZCARRAGA ESQUIVEL','Lic. Administracion Empresas','AZCARRAGA','ESQUIVEL','4947022','LP','Cochabamba','Civil','Noche','79361121','2026-02-05','PERSONAL','pablo.azcarraga@gmail.com','pablo.azcarraga@gmail.com','$2b$10$.UdDoO/IqPmH4IfiOX.rf.3VQ7.gf.rLjSfXEza2LFm1c7gbQgTz.','DOCENTE','ACTIVO',NULL,'2026-02-16 00:46:51','1979-11-23'),(4,'EDGAR ARIEL','DIAZ ANDIA','Tte.Cnl','DIAZ','ANDIA','4314966','LP','Cochabamba','Ejército','Noche','71566670','2026-01-19','ECEM','diazari83@gmail.com','diazari83@gmail.com','$2b$10$u5zvCsdlLCsQ44P4tPW1nuhgVhHYc4HOPnxFe8FUAPmEW1YcfR3vy','DOCENTE','ACTIVO',NULL,'2026-02-16 00:51:00','1979-11-09'),(5,'NIELSEN AMADO','FERNANDEZ ALIAGA','Tte.Cnl','FERNANDEZ','ALIAGA','3450202','LP','Cochabamba','Ejército','Noche','6822835','2026-01-19','ECEM','archivos0123456789@gmail.com','archivos0123456789@gmail.com','$2b$10$uzI0xNUOxdF1iVHTli7Cxe2.vgswH/mJzVc7z5aZDE0P8P4FXifoS','JEFE_CURSO','ACTIVO',NULL,'2026-02-16 01:03:45','1979-11-09'),(6,'asd','asd asd','Tte.Cnl','asd','asd','asd','LP','Cochabamba','Armada','Tarde','ads','1549-02-11','asd','asdasd@asdasd.com','asdasd@asdasd.com','$2b$10$gDiQmk3D6ooW.H3qXVnojujJ7ebxkkkos2QZQ.7z6eeeCyA2K5Phi','ADMIN','ACTIVO',NULL,'2026-02-16 01:05:24','1895-02-11'),(7,'TOMMY ABRAHAM','BUEZO ALVAREZ','Tte.Cnl','BUEZO','ALVAREZ','4283060','LP','Cochabamba','Ejército','Noche','68225225','2026-01-19','REGION MILITAR 7','pruebagoogle@chakuy.com','pruebagoogle@chakuy.com','$2b$10$lfgUI0drGyvawBHGIFr9YevaK1r35FeZJpL37GQugu12tN/RUC5XW','CURSANTE','ACTIVO','Cursante','2026-02-16 01:07:59','1000-10-10'),(8,'JOSE LUIS','QUIROZ BANEGAS','Tte.Cnl','QUIROZ','BANEGAS','3808543','CB','Cochabamba','Ejército','Noche','67407704','2026-01-19','DIV 7','joseluisquirozbanegas@gmail.com','joseluisquirozbanegas@gmail.com','$2b$10$SjkXAMnqIhSmnktI0EqVouoqqq1moVRrvOoQYfeQ81mW3gwyn3A4y','CURSANTE','ACTIVO','Cursante','2026-02-16 01:09:49','1000-10-10'),(9,'PEDRO PETER','GALVEZ GALVEZ','Tte.Cnl','GALVEZ','GALVEZ','4794001','LP','Cochabamba','Ejército','Noche','71733969','2026-01-19','ECEME','harjavi666@hotmail.com','harjavi666@hotmail.com','$2b$10$M1XJUpttRAg3t1hVPF1JxejO3l05IJ5PncGpv1sOT2fD8OHUOdHmS','CURSANTE','ACTIVO','Cursante','2026-02-16 01:42:04','1978-03-28');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-04  7:06:50
