-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
INSERT INTO `asistencia` VALUES (15,3,1,2,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(16,3,1,3,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(17,3,1,7,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(18,3,1,4,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(19,3,1,5,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(20,3,1,9,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(21,3,1,8,'2026-03-09','P',NULL,NULL,'2026-03-08 23:10:37'),(22,3,1,2,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(23,3,1,3,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(24,3,1,7,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(25,3,1,4,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(26,3,1,5,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(27,3,1,9,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(28,3,1,8,'2026-04-07','P',NULL,NULL,'2026-04-07 15:23:15'),(29,3,1,2,'2026-04-10','J',NULL,NULL,'2026-04-10 12:18:38'),(30,3,1,3,'2026-04-10','J',NULL,NULL,'2026-04-10 12:18:38'),(31,3,1,7,'2026-04-10','A',NULL,NULL,'2026-04-10 12:18:38'),(32,3,1,4,'2026-04-10','P',NULL,NULL,'2026-04-10 12:18:38'),(33,3,1,5,'2026-04-10','P',NULL,NULL,'2026-04-10 12:18:38'),(34,3,1,9,'2026-04-10','P',NULL,NULL,'2026-04-10 12:18:38'),(35,3,1,8,'2026-04-10','P',NULL,NULL,'2026-04-10 12:18:38'),(36,3,1,2,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01'),(37,3,1,3,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01'),(38,3,1,7,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01'),(39,3,1,4,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01'),(40,3,1,5,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01'),(41,3,1,9,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01'),(42,3,1,8,'2026-04-13','P',NULL,NULL,'2026-04-13 18:58:01');
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
  `registrado_por` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_calif_curso_usuario_eval` (`curso_id`,`usuario_id`,`eval_config_id`),
  KEY `eval_config_id` (`eval_config_id`),
  KEY `registrado_por` (`registrado_por`),
  KEY `idx_calif_curso` (`curso_id`),
  KEY `idx_calif_usuario` (`usuario_id`),
  KEY `idx_calif_curso_usuario` (`curso_id`,`usuario_id`),
  CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calificaciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calificaciones_ibfk_3` FOREIGN KEY (`eval_config_id`) REFERENCES `eval_config` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calificaciones_ibfk_4` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificaciones`
--

LOCK TABLES `calificaciones` WRITE;
/*!40000 ALTER TABLE `calificaciones` DISABLE KEYS */;
INSERT INTO `calificaciones` VALUES (1,3,NULL,2,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(2,3,NULL,2,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(3,3,NULL,2,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(4,3,NULL,2,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(5,3,NULL,2,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(6,3,NULL,3,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(7,3,NULL,3,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(8,3,NULL,3,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(9,3,NULL,3,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(10,3,NULL,3,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(11,3,NULL,7,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(12,3,NULL,7,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(13,3,NULL,7,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(14,3,NULL,7,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(15,3,NULL,7,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(16,3,NULL,4,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(17,3,NULL,4,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(18,3,NULL,4,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(19,3,NULL,4,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(20,3,NULL,4,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(21,3,NULL,5,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(22,3,NULL,5,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(23,3,NULL,5,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(24,3,NULL,5,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(25,3,NULL,5,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(26,3,NULL,9,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(27,3,NULL,9,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(28,3,NULL,9,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(29,3,NULL,9,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(30,3,NULL,9,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(31,3,NULL,8,1,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(32,3,NULL,8,2,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(33,3,NULL,8,3,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(34,3,NULL,8,4,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(35,3,NULL,8,5,0.00,NULL,'2026-03-08 18:39:59','2026-03-08 18:39:59',0),(36,3,1,2,6,0.00,NULL,'2026-04-07 15:23:07','2026-04-07 16:57:06',1),(37,3,1,2,7,100.00,NULL,'2026-04-07 15:23:07','2026-04-07 16:57:06',1),(38,3,1,3,6,80.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(39,3,1,3,7,80.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(40,3,1,7,6,75.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(41,3,1,7,7,95.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(42,3,1,4,6,70.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(43,3,1,4,7,70.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(44,3,1,5,6,56.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(45,3,1,5,7,80.00,NULL,'2026-04-07 15:23:07','2026-04-07 15:23:07',0),(46,3,1,9,6,0.00,NULL,'2026-04-07 15:23:07','2026-04-10 12:19:04',1),(47,3,1,9,7,100.00,NULL,'2026-04-07 15:23:07','2026-04-10 12:19:04',1),(48,3,1,8,6,100.00,NULL,'2026-04-07 15:23:07','2026-04-07 16:52:32',1),(49,3,1,8,7,100.00,NULL,'2026-04-07 15:23:07','2026-04-07 16:52:32',1),(50,3,2,2,13,0.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:45:48',0),(51,3,2,3,13,0.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:45:48',0),(52,3,2,7,13,0.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:45:48',0),(53,3,2,4,13,0.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:45:48',0),(54,3,2,5,13,0.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:57:22',1),(55,3,2,9,13,80.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:56:45',1),(56,3,2,8,13,100.00,NULL,'2026-04-07 16:16:03','2026-04-07 16:51:52',1),(58,3,2,2,12,0.00,NULL,'2026-04-07 16:17:49','2026-04-07 16:45:48',0),(64,3,2,9,12,70.00,NULL,'2026-04-07 16:17:49','2026-04-07 16:56:45',1),(66,3,2,8,12,90.00,NULL,'2026-04-07 16:17:49','2026-04-07 16:51:52',1),(96,3,2,5,12,100.00,NULL,'2026-04-07 16:57:22','2026-04-07 16:57:22',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso_materias`
--

LOCK TABLES `curso_materias` WRITE;
/*!40000 ALTER TABLE `curso_materias` DISABLE KEYS */;
INSERT INTO `curso_materias` VALUES (1,3,'BASES DE PLANIFICACION ESTRATEGICA','','',NULL,3,'2026-03-08 19:20:08'),(2,3,'CIBERSEGURIDAD Y CIBERDEFENSA','','',NULL,3,'2026-03-08 19:20:41'),(3,3,'DERECHOS HUMANOS Y D.I.H','','',NULL,4,'2026-03-08 19:20:51'),(4,3,'DIMENSION CIENCIA Y TECNOLOGIA','','',NULL,NULL,'2026-03-08 19:21:03'),(5,3,'DIMENSION CULTURAL','','',NULL,NULL,'2026-03-08 19:21:11'),(6,3,'DIMENSION ECONOMICA','','',NULL,NULL,'2026-03-08 19:21:19'),(7,3,'DIMENSION MILITAR','','',NULL,NULL,'2026-03-08 19:21:25'),(8,3,'DIMENSION POLITICA','','',NULL,NULL,'2026-03-08 19:21:33'),(9,3,'DOCTRINA DE SEGURIDAD Y DEFENSA','','',NULL,NULL,'2026-03-08 19:21:45'),(10,3,'FORMULACION DE POLITICAS Y ESTRATEGIAS','','',NULL,NULL,'2026-03-08 19:21:59'),(11,3,'GEOPOLITICA Y GEOESTRATEGICA','','',NULL,NULL,'2026-03-08 19:22:13'),(12,3,'GESTION CONSTRUCTIVA DE CONFLICTOS Y ACCION SIN DAÑO','','',NULL,NULL,'2026-03-08 19:22:26'),(13,3,'HISTORIA CRITICA DE BOLIVIA','','',NULL,NULL,'2026-03-08 19:22:37'),(14,3,'INTELIGENCIA ESTRATEGICA Y PROSPECTIVA','','',NULL,NULL,'2026-03-08 19:22:49'),(15,3,'MEDIO AMBIENTE','','',NULL,NULL,'2026-03-08 19:22:56'),(16,3,'METODOLOIA DE LA INVESTIGACION','','',NULL,NULL,'2026-03-08 19:23:05'),(17,3,'METODOLOGIA DE LA INVESTIGACION II','','',NULL,NULL,'2026-03-08 19:23:15'),(18,3,'PRACTICA PLANIFICACION ESTRATEGICA','','',NULL,NULL,'2026-03-08 19:23:36'),(19,3,'PRINCIPIOS FUNDAMENTALES DEL ESTADO','','',NULL,NULL,'2026-03-08 19:23:46'),(20,3,'RELACIONES INTERNACIONALES','','',NULL,NULL,'2026-03-08 19:23:53'),(21,3,'TALASOPOLITICA Y PROBLEMATICA DEL MAR','','',NULL,NULL,'2026-03-08 19:24:07'),(22,3,'TEORIA Y TRANSFORMACION DEL ESTADO','','',NULL,NULL,'2026-03-08 19:24:16');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso_responsabilidades`
--

LOCK TABLES `curso_responsabilidades` WRITE;
/*!40000 ALTER TABLE `curso_responsabilidades` DISABLE KEYS */;
INSERT INTO `curso_responsabilidades` VALUES (4,2,3,'ENCARGADO_CURSO','2026-02-17 02:02:21'),(11,3,5,'JEFE_CURSO','2026-04-14 12:12:29');
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
INSERT INTO `cursos` VALUES (1,NULL,'90','ES UNA PRUEBA',NULL,NULL,'2026-02-16','2026-11-13','Presencial',75,'ACTIVO','2026-02-16 20:46:11'),(2,NULL,'91',NULL,NULL,1,'2026-02-16','2026-12-26','Presencial',55,'ACTIVO','2026-02-16 20:57:46'),(3,NULL,'69','CURSO EAEN',NULL,5,'2026-04-10','2026-11-10','Presencial',0,'ACTIVO','2026-03-08 21:17:19');
/*!40000 ALTER TABLE `cursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disciplina_catalogo`
--

DROP TABLE IF EXISTS `disciplina_catalogo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disciplina_catalogo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('MERITO','DEMERITO') NOT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `puntos` decimal(5,2) NOT NULL DEFAULT 1.00,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disciplina_catalogo`
--

LOCK TABLES `disciplina_catalogo` WRITE;
/*!40000 ALTER TABLE `disciplina_catalogo` DISABLE KEYS */;
INSERT INTO `disciplina_catalogo` VALUES (1,'MERITO','M-01','Participación destacada en clase',NULL,1.00,1,'2026-04-12 21:09:29'),(2,'MERITO','M-02','Trabajo sobresaliente',NULL,2.00,1,'2026-04-12 21:09:29'),(3,'MERITO','M-03','Puntualidad ejemplar (mes completo)',NULL,1.00,1,'2026-04-12 21:09:29'),(4,'MERITO','M-04','Apoyo a compañeros',NULL,1.00,1,'2026-04-12 21:09:29'),(5,'MERITO','M-05','Iniciativa y liderazgo',NULL,2.00,1,'2026-04-12 21:09:29'),(6,'DEMERITO','D-01','Tardanza injustificada',NULL,1.00,1,'2026-04-12 21:09:29'),(7,'DEMERITO','D-02','Falta de respeto',NULL,3.00,1,'2026-04-12 21:09:29'),(8,'DEMERITO','D-03','Incumplimiento de tareas reiterativo',NULL,2.00,1,'2026-04-12 21:09:29'),(9,'DEMERITO','D-04','Uso indebido de dispositivos en clase',NULL,1.00,1,'2026-04-12 21:09:29'),(10,'DEMERITO','D-05','Conducta inapropiada',NULL,3.00,1,'2026-04-12 21:09:29'),(11,'MERITO','M-01','Participación destacada en clase',NULL,1.00,1,'2026-04-14 08:23:03'),(12,'MERITO','M-02','Trabajo sobresaliente',NULL,2.00,1,'2026-04-14 08:23:03'),(13,'MERITO','M-03','Puntualidad ejemplar (mes completo)',NULL,1.00,1,'2026-04-14 08:23:03'),(14,'MERITO','M-04','Apoyo a compañeros',NULL,1.00,1,'2026-04-14 08:23:03'),(15,'MERITO','M-05','Iniciativa y liderazgo',NULL,2.00,1,'2026-04-14 08:23:03'),(16,'DEMERITO','D-01','Tardanza injustificada',NULL,1.00,1,'2026-04-14 08:23:03'),(17,'DEMERITO','D-02','Falta de respeto',NULL,3.00,1,'2026-04-14 08:23:03'),(18,'DEMERITO','D-03','Incumplimiento de tareas reiterativo',NULL,2.00,1,'2026-04-14 08:23:03'),(19,'DEMERITO','D-04','Uso indebido de dispositivos en clase',NULL,1.00,1,'2026-04-14 08:23:03'),(20,'DEMERITO','D-05','Conducta inapropiada',NULL,3.00,1,'2026-04-14 08:23:03');
/*!40000 ALTER TABLE `disciplina_catalogo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disciplina_config`
--

DROP TABLE IF EXISTS `disciplina_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disciplina_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `porcentaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp(),
  `actualizado_en` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_disc_config` (`curso_id`,`materia_id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `disciplina_config_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disciplina_config_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disciplina_config`
--

LOCK TABLES `disciplina_config` WRITE;
/*!40000 ALTER TABLE `disciplina_config` DISABLE KEYS */;
INSERT INTO `disciplina_config` VALUES (1,3,1,0.00,1,2,'2026-04-12 21:27:50','2026-04-12 21:27:57'),(3,3,2,10.00,1,2,'2026-04-12 21:28:10','2026-04-12 21:28:10');
/*!40000 ALTER TABLE `disciplina_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disciplina_registros`
--

DROP TABLE IF EXISTS `disciplina_registros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disciplina_registros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `catalogo_id` int(11) DEFAULT NULL,
  `tipo` enum('MERITO','DEMERITO') NOT NULL,
  `descripcion` varchar(500) NOT NULL,
  `puntos` decimal(5,2) NOT NULL DEFAULT 1.00,
  `fecha` date NOT NULL,
  `registrado_por` int(11) NOT NULL,
  `observacion` varchar(500) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `registrado_por` (`registrado_por`),
  KEY `catalogo_id` (`catalogo_id`),
  KEY `idx_disc_reg_usuario` (`usuario_id`,`curso_id`),
  KEY `idx_disc_reg_curso` (`curso_id`),
  CONSTRAINT `disciplina_registros_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disciplina_registros_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `disciplina_registros_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `disciplina_registros_ibfk_4` FOREIGN KEY (`catalogo_id`) REFERENCES `disciplina_catalogo` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disciplina_registros`
--

LOCK TABLES `disciplina_registros` WRITE;
/*!40000 ALTER TABLE `disciplina_registros` DISABLE KEYS */;
INSERT INTO `disciplina_registros` VALUES (3,3,8,2,'MERITO','Trabajo sobresaliente',2.00,'2026-04-14',5,'de acuerdo','2026-04-14 08:33:42'),(4,3,8,11,'MERITO','Participación destacada en clase',1.00,'2026-04-14',5,'de acuerdo','2026-04-14 08:42:52'),(5,3,9,7,'DEMERITO','Falta de respeto',3.00,'2026-04-14',5,'segun lo solicitado','2026-04-14 08:44:08');
/*!40000 ALTER TABLE `disciplina_registros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_config`
--

DROP TABLE IF EXISTS `eval_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `materia_id` int(11) DEFAULT NULL,
  `curso_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `peso` decimal(5,2) NOT NULL DEFAULT 20.00,
  `orden` tinyint(4) NOT NULL DEFAULT 1,
  `nota_min_apro` decimal(5,2) NOT NULL DEFAULT 70.00,
  `nota_max` decimal(5,2) NOT NULL DEFAULT 100.00,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eval_materia_nombre` (`materia_id`,`nombre`),
  KEY `idx_eval_curso` (`curso_id`),
  CONSTRAINT `eval_config_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_config`
--

LOCK TABLES `eval_config` WRITE;
/*!40000 ALTER TABLE `eval_config` DISABLE KEYS */;
INSERT INTO `eval_config` VALUES (1,NULL,3,'Eval. 1',20.00,1,70.00,100.00,'2026-03-08 18:39:59'),(2,NULL,3,'Eval. 2',20.00,2,70.00,100.00,'2026-03-08 18:39:59'),(3,NULL,3,'Eval. 3',20.00,3,70.00,100.00,'2026-03-08 18:39:59'),(4,NULL,3,'Trabajo',20.00,4,70.00,100.00,'2026-03-08 18:39:59'),(5,NULL,3,'Final',20.00,5,70.00,100.00,'2026-03-08 18:39:59'),(6,1,3,'Practica',30.00,1,70.00,100.00,'2026-04-06 16:08:38'),(7,1,3,'Teoria',70.00,2,70.00,100.00,'2026-04-06 16:08:38'),(12,2,3,'Eval.1',70.00,1,70.00,100.00,'2026-04-07 15:35:36'),(13,2,3,'Trabajo',30.00,2,70.00,100.00,'2026-04-07 15:35:36');
/*!40000 ALTER TABLE `eval_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_inst_indicadores`
--

DROP TABLE IF EXISTS `eval_inst_indicadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_inst_indicadores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plantilla_id` int(11) NOT NULL,
  `orden` int(11) DEFAULT 0,
  `texto` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `plantilla_id` (`plantilla_id`),
  CONSTRAINT `eval_inst_indicadores_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `eval_inst_plantillas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_inst_indicadores`
--

LOCK TABLES `eval_inst_indicadores` WRITE;
/*!40000 ALTER TABLE `eval_inst_indicadores` DISABLE KEYS */;
INSERT INTO `eval_inst_indicadores` VALUES (1,1,1,'Procede con las normas institucionales'),(2,1,2,'Asume sus decisiones y/o responde por sus acciones'),(3,1,3,'Trata a las personas con dignidad y controla sus emociones'),(4,1,4,'Participa, contribuye y comparte en la investigación y la difusión del conocimiento'),(5,2,1,'El Docente elabora y presenta el programa de la asignatura al inicio del módulo'),(6,2,2,'Cumple con el programa de la asignatura de acuerdo a lo planificado'),(7,2,3,'Desarrolla con claridad los temas y relaciona la teoría con la práctica'),(8,2,4,'Promueve la participación activa del cursante en el desarrollo de la clase'),(9,2,5,'Utiliza un tono adecuado de voz y lenguaje claro y técnico'),(10,2,6,'El trato al cursante es respetuoso dentro y fuera del aula'),(11,2,7,'Absuelve las dudas de los cursantes de manera oportuna y clara'),(12,2,8,'Desarrolla sus clases de manera amena y estimulante'),(13,2,9,'Transmite confianza al cursante para que participe y realice preguntas'),(14,2,10,'Evalúa las tareas asignadas de manera oportuna y dentro del plazo establecido'),(15,2,11,'Existe relación entre las preguntas de los exámenes y los temas avanzados'),(16,2,12,'Cumple con los horarios establecidos con puntualidad'),(17,2,13,'Demuestra compromiso con su labor y formación del cursante');
/*!40000 ALTER TABLE `eval_inst_indicadores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_inst_periodos`
--

DROP TABLE IF EXISTS `eval_inst_periodos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_inst_periodos` (
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
  CONSTRAINT `eval_inst_periodos_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `eval_inst_plantillas` (`id`),
  CONSTRAINT `eval_inst_periodos_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_inst_periodos`
--

LOCK TABLES `eval_inst_periodos` WRITE;
/*!40000 ALTER TABLE `eval_inst_periodos` DISABLE KEYS */;
INSERT INTO `eval_inst_periodos` VALUES (1,1,3,NULL,'Evaluacion',1,'2026-03-09 16:26:41','2026-03-10 00:00:00',2,'2026-03-09 16:26:41'),(2,2,3,1,NULL,1,'2026-03-09 16:31:08','2026-03-10 00:00:00',2,'2026-03-09 16:31:08');
/*!40000 ALTER TABLE `eval_inst_periodos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_inst_plantillas`
--

DROP TABLE IF EXISTS `eval_inst_plantillas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_inst_plantillas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('CURSANTE_A_CURSANTE','CURSANTE_A_DOCENTE') NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_inst_plantillas`
--

LOCK TABLES `eval_inst_plantillas` WRITE;
/*!40000 ALTER TABLE `eval_inst_plantillas` DISABLE KEYS */;
INSERT INTO `eval_inst_plantillas` VALUES (1,'CURSANTE_A_CURSANTE','Evaluación de Conducta entre Cursantes','Evaluación del comportamiento y actitudes de los cursantes por sus pares.',1,'2026-03-09 16:20:45'),(2,'CURSANTE_A_DOCENTE','Evaluación Docente por Cursantes','Evaluación del desempeño docente realizada por los cursantes de cada materia.',1,'2026-03-09 16:20:45');
/*!40000 ALTER TABLE `eval_inst_plantillas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_inst_respuestas`
--

DROP TABLE IF EXISTS `eval_inst_respuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_inst_respuestas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `periodo_id` int(11) NOT NULL,
  `evaluador_id` int(11) NOT NULL,
  `evaluado_id` int(11) DEFAULT NULL,
  `completada` tinyint(1) DEFAULT 0,
  `enviado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resp` (`periodo_id`,`evaluador_id`,`evaluado_id`),
  CONSTRAINT `eval_inst_respuestas_ibfk_1` FOREIGN KEY (`periodo_id`) REFERENCES `eval_inst_periodos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_inst_respuestas`
--

LOCK TABLES `eval_inst_respuestas` WRITE;
/*!40000 ALTER TABLE `eval_inst_respuestas` DISABLE KEYS */;
INSERT INTO `eval_inst_respuestas` VALUES (1,1,8,3,1,'2026-03-09 16:29:30'),(2,1,8,2,1,'2026-03-09 16:29:37'),(3,1,8,7,1,'2026-03-09 16:29:45'),(4,1,8,4,1,'2026-03-09 16:29:51'),(5,1,8,5,1,'2026-03-09 16:29:57'),(6,1,8,9,1,'2026-03-09 16:30:04'),(9,2,8,NULL,1,'2026-03-09 16:34:34'),(10,1,9,2,1,'2026-03-09 16:54:30'),(11,1,9,8,1,'2026-03-09 16:54:35'),(12,1,9,5,1,'2026-03-09 16:54:41'),(13,1,9,3,1,'2026-03-09 16:54:45'),(14,1,9,7,1,'2026-03-09 16:54:49'),(15,1,9,4,1,'2026-03-09 16:55:02'),(16,2,9,NULL,1,'2026-03-09 16:55:19');
/*!40000 ALTER TABLE `eval_inst_respuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eval_inst_valoraciones`
--

DROP TABLE IF EXISTS `eval_inst_valoraciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eval_inst_valoraciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `respuesta_id` int(11) NOT NULL,
  `indicador_id` int(11) NOT NULL,
  `valor` tinyint(4) NOT NULL DEFAULT 100,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_val` (`respuesta_id`,`indicador_id`),
  KEY `indicador_id` (`indicador_id`),
  CONSTRAINT `eval_inst_valoraciones_ibfk_1` FOREIGN KEY (`respuesta_id`) REFERENCES `eval_inst_respuestas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `eval_inst_valoraciones_ibfk_2` FOREIGN KEY (`indicador_id`) REFERENCES `eval_inst_indicadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eval_inst_valoraciones`
--

LOCK TABLES `eval_inst_valoraciones` WRITE;
/*!40000 ALTER TABLE `eval_inst_valoraciones` DISABLE KEYS */;
INSERT INTO `eval_inst_valoraciones` VALUES (1,1,1,100),(2,1,2,100),(3,1,3,100),(4,1,4,100),(5,2,1,100),(6,2,2,100),(7,2,3,100),(8,2,4,100),(9,3,1,100),(10,3,2,100),(11,3,3,100),(12,3,4,100),(13,4,1,100),(14,4,2,100),(15,4,3,100),(16,4,4,100),(17,5,1,100),(18,5,2,100),(19,5,3,100),(20,5,4,100),(21,6,1,100),(22,6,2,100),(23,6,3,100),(24,6,4,100),(25,9,5,100),(26,9,6,100),(27,9,7,100),(28,9,8,100),(29,9,9,100),(30,9,10,100),(31,9,11,100),(32,9,12,100),(33,9,13,100),(34,9,14,100),(35,9,15,100),(36,9,16,100),(37,9,17,100),(38,10,1,75),(39,10,2,100),(40,10,3,100),(41,10,4,100),(42,11,1,100),(43,11,2,50),(44,11,3,100),(45,11,4,100),(46,12,1,100),(47,12,2,75),(48,12,3,100),(49,12,4,100),(50,13,1,75),(51,13,2,100),(52,13,3,100),(53,13,4,100),(54,14,1,100),(55,14,2,100),(56,14,3,75),(57,14,4,100),(58,15,1,100),(59,15,2,75),(60,15,3,100),(61,15,4,75),(62,16,5,100),(63,16,6,100),(64,16,7,100),(65,16,8,100),(66,16,9,100),(67,16,10,100),(68,16,11,100),(69,16,12,100),(70,16,13,100),(71,16,14,100),(72,16,15,100),(73,16,16,100),(74,16,17,100);
/*!40000 ALTER TABLE `eval_inst_valoraciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finanzas_conceptos`
--

DROP TABLE IF EXISTS `finanzas_conceptos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finanzas_conceptos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `tipo` enum('MATRICULA','GUIA','MENSUALIDAD','OTRO') NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fecha_venc` date DEFAULT NULL,
  `mes` tinyint(4) DEFAULT NULL,
  `anio` smallint(6) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `curso_id` (`curso_id`),
  KEY `idx_conceptos_tipo` (`tipo`,`curso_id`),
  CONSTRAINT `finanzas_conceptos_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finanzas_conceptos`
--

LOCK TABLES `finanzas_conceptos` WRITE;
/*!40000 ALTER TABLE `finanzas_conceptos` DISABLE KEYS */;
INSERT INTO `finanzas_conceptos` VALUES (1,3,'MENSUALIDAD',NULL,700.00,'2026-04-09',4,2026,0,7,'2026-04-09 14:46:39'),(2,3,'MENSUALIDAD',NULL,700.00,'2026-04-09',4,2026,0,7,'2026-04-09 14:46:48'),(3,3,'GUIA',NULL,35.00,'2026-04-09',4,2026,0,7,'2026-04-09 14:49:05'),(4,3,'GUIA','guia',35.00,'2026-04-09',4,2026,0,7,'2026-04-09 14:49:42'),(5,3,'GUIA','guias2',50.00,'2026-04-09',4,2026,0,7,'2026-04-09 14:52:11'),(6,3,'GUIA',NULL,50.00,'2026-04-09',4,2026,1,7,'2026-04-09 14:54:07'),(7,3,'MATRICULA',NULL,500.00,NULL,4,2026,1,7,'2026-04-09 15:06:32'),(8,3,'OTRO','Aporte Voluntario',120.00,'2026-04-09',4,2026,1,7,'2026-04-09 15:12:38');
/*!40000 ALTER TABLE `finanzas_conceptos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finanzas_pagos`
--

DROP TABLE IF EXISTS `finanzas_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finanzas_pagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `concepto_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `estado` enum('PENDIENTE','PAGADO','EXONERADO','MORA') NOT NULL DEFAULT 'PENDIENTE',
  `monto_pagado` decimal(10,2) DEFAULT NULL,
  `fecha_pago` date DEFAULT NULL,
  `comprobante` varchar(255) DEFAULT NULL,
  `observacion` varchar(500) DEFAULT NULL,
  `registrado_por` int(11) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp(),
  `actualizado_en` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pago` (`concepto_id`,`usuario_id`),
  KEY `curso_id` (`curso_id`),
  KEY `idx_pagos_usuario` (`usuario_id`),
  KEY `idx_pagos_estado` (`estado`),
  CONSTRAINT `finanzas_pagos_ibfk_1` FOREIGN KEY (`concepto_id`) REFERENCES `finanzas_conceptos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `finanzas_pagos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `finanzas_pagos_ibfk_3` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finanzas_pagos`
--

LOCK TABLES `finanzas_pagos` WRITE;
/*!40000 ALTER TABLE `finanzas_pagos` DISABLE KEYS */;
INSERT INTO `finanzas_pagos` VALUES (1,3,2,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(2,3,3,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(3,3,4,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(4,3,5,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(5,3,7,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(6,3,8,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(7,3,9,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:05','2026-04-09 14:49:05'),(8,4,2,3,'PENDIENTE',35.00,'2026-04-09',NULL,NULL,7,'2026-04-09 14:49:42','2026-04-09 14:53:14'),(9,4,3,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:42','2026-04-09 14:49:42'),(10,4,4,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:42','2026-04-09 14:49:42'),(11,4,5,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:42','2026-04-09 14:49:42'),(12,4,7,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:42','2026-04-09 14:49:42'),(13,4,8,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:42','2026-04-09 14:49:42'),(14,4,9,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:49:42','2026-04-09 14:49:42'),(15,5,2,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(16,5,3,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(17,5,4,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(18,5,5,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(19,5,7,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(20,5,8,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(21,5,9,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:52:11','2026-04-09 14:52:11'),(24,6,2,3,'PAGADO',50.00,'2026-04-09',NULL,NULL,7,'2026-04-09 14:54:07','2026-04-09 14:54:26'),(25,6,3,3,'PAGADO',50.00,'2026-04-09',NULL,NULL,7,'2026-04-09 14:54:07','2026-04-09 15:02:38'),(26,6,4,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:54:07','2026-04-09 14:54:07'),(27,6,5,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:54:07','2026-04-09 14:54:07'),(28,6,7,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:54:07','2026-04-09 14:54:07'),(29,6,8,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 14:54:07','2026-04-09 14:54:07'),(30,6,9,3,'PAGADO',50.00,'2026-04-09',NULL,NULL,7,'2026-04-09 14:54:07','2026-04-09 15:06:19'),(37,7,2,3,'PAGADO',500.00,'2026-04-13',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-13 19:06:38'),(38,7,3,3,'PAGADO',500.00,'2026-04-13',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-13 19:06:45'),(39,7,4,3,'PAGADO',500.00,'2026-04-13',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-13 19:06:27'),(40,7,5,3,'PAGADO',500.00,'2026-04-10',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-13 19:06:52'),(41,7,7,3,'PAGADO',500.00,'2026-04-13',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-13 19:06:34'),(42,7,8,3,'MORA',500.00,'2026-04-10',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-10 12:24:34'),(43,7,9,3,'PAGADO',500.00,'2026-04-09',NULL,NULL,7,'2026-04-09 15:06:32','2026-04-13 19:06:19'),(46,8,2,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38'),(47,8,3,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38'),(48,8,4,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38'),(49,8,5,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38'),(50,8,7,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38'),(51,8,8,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38'),(52,8,9,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-09 15:12:38','2026-04-09 15:12:38');
/*!40000 ALTER TABLE `finanzas_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horarios`
--

DROP TABLE IF EXISTS `horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `aula` varchar(100) DEFAULT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  `creado_por` int(11) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_horario_slot` (`curso_id`,`fecha`,`hora_inicio`,`aula`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horarios_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `curso_materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horarios`
--

LOCK TABLES `horarios` WRITE;
/*!40000 ALTER TABLE `horarios` DISABLE KEYS */;
INSERT INTO `horarios` VALUES (1,3,9,'2026-04-06','07:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:06:44'),(2,3,9,'2026-04-07','07:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:06:44'),(3,3,9,'2026-04-08','07:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:06:44'),(4,3,9,'2026-04-09','07:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:06:44'),(5,3,9,'2026-04-10','07:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:06:44'),(6,3,9,'2026-04-13','19:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:07:24'),(7,3,9,'2026-04-14','19:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:07:24'),(8,3,9,'2026-04-15','19:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:07:24'),(9,3,9,'2026-04-16','19:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:07:24'),(10,3,9,'2026-04-17','19:00:00','22:00:00','Aula Magna',NULL,2,'2026-04-09 10:07:24');
/*!40000 ALTER TABLE `horarios` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,'Examen de Evaluacion','Evamen Prueba','INFO',NULL,'2026-03-08 17:51:31',1),(2,'Traer Documentacion','Traer Documentacion','ALERTA',NULL,'2026-03-08 17:51:57',1),(3,'PRioridad Reunion','Reunion','URGENTE',NULL,'2026-03-08 17:52:15',1),(4,'Reunion emergencia','DAEN','URGENTE',NULL,'2026-04-10 12:17:11',1),(5,'presentar de acuerdo a lo establecido perfil','de forma inmediata','URGENTE',NULL,'2026-04-13 18:57:17',1);
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
INSERT INTO `notificaciones_leidas` VALUES (1,2,'2026-03-08 23:02:11'),(1,3,'2026-04-06 15:42:58'),(1,4,'2026-03-09 13:09:15'),(1,5,'2026-04-07 16:57:58'),(1,8,'2026-03-09 16:29:03'),(1,9,'2026-03-08 23:03:47'),(2,2,'2026-03-08 23:02:11'),(2,3,'2026-04-06 15:42:58'),(2,4,'2026-03-09 13:09:15'),(2,5,'2026-04-07 16:57:58'),(2,8,'2026-03-09 16:29:03'),(2,9,'2026-03-08 23:03:47'),(3,2,'2026-03-08 23:02:11'),(3,3,'2026-04-06 15:42:58'),(3,4,'2026-03-09 13:09:15'),(3,5,'2026-04-07 16:57:58'),(3,8,'2026-03-09 16:29:03'),(3,9,'2026-03-08 23:03:47'),(4,2,'2026-04-10 12:28:15'),(4,5,'2026-04-14 08:43:24'),(5,5,'2026-04-14 08:43:25');
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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarea_entregas`
--

LOCK TABLES `tarea_entregas` WRITE;
/*!40000 ALTER TABLE `tarea_entregas` DISABLE KEYS */;
INSERT INTO `tarea_entregas` VALUES (1,1,2,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-03-09 13:11:39','2026-03-09 13:11:39'),(2,1,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-03-09 13:11:39','2026-03-09 13:11:39'),(3,1,4,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-03-09 13:11:39','2026-03-09 13:11:39'),(4,1,5,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-03-09 13:11:39','2026-03-09 13:11:39'),(5,1,7,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-03-09 13:11:39','2026-03-09 13:11:39'),(6,1,8,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-03-09 13:11:39','2026-03-09 13:11:39'),(7,1,9,'ENTREGADO','se procedio al envio',100.00,'','2026-03-09 14:47:33',4,'2026-03-09 13:11:39','2026-03-09 15:26:17'),(8,2,2,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:23:37','2026-04-07 15:23:37'),(9,2,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:23:37','2026-04-07 15:23:37'),(10,2,4,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:23:37','2026-04-07 15:23:37'),(11,2,5,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:23:37','2026-04-07 15:23:37'),(12,2,7,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:23:37','2026-04-07 15:23:37'),(13,2,8,'ENTREGADO','sdfsdf',100.00,'','2026-04-07 15:25:20',3,'2026-04-07 15:23:37','2026-04-07 15:26:02'),(14,2,9,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:23:37','2026-04-07 15:23:37'),(15,3,2,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:27:39','2026-04-07 15:27:39'),(16,3,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:27:39','2026-04-07 15:27:39'),(17,3,4,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:27:39','2026-04-07 15:27:39'),(18,3,5,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 15:27:39','2026-04-07 15:27:39'),(19,3,7,'ENTREGADO','asdasd',100.00,'','2026-04-07 16:58:50',3,'2026-04-07 15:27:39','2026-04-07 16:59:44'),(20,3,8,'ENTREGADO','trssad',100.00,'','2026-04-07 15:28:00',3,'2026-04-07 15:27:39','2026-04-07 15:28:50'),(21,3,9,'ENTREGADO','test',80.00,'','2026-04-07 16:15:06',3,'2026-04-07 15:27:39','2026-04-07 16:15:55'),(22,4,2,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 16:14:21','2026-04-07 16:14:21'),(23,4,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 16:14:21','2026-04-07 16:14:21'),(24,4,4,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 16:14:21','2026-04-07 16:14:21'),(25,4,5,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 16:14:21','2026-04-07 16:14:21'),(26,4,7,'ENTREGADO','sdasd',100.00,'','2026-04-07 16:58:47',3,'2026-04-07 16:14:21','2026-04-07 16:59:26'),(27,4,8,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-07 16:14:21','2026-04-07 16:14:21'),(28,4,9,'ENTREGADO','test',100.00,'','2026-04-07 16:15:01',3,'2026-04-07 16:14:21','2026-04-07 16:59:27'),(29,5,2,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-10 12:19:45','2026-04-10 12:19:45'),(30,5,3,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-10 12:19:45','2026-04-10 12:19:45'),(31,5,4,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-10 12:19:45','2026-04-10 12:19:45'),(32,5,5,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-10 12:19:45','2026-04-10 12:19:45'),(33,5,7,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-10 12:19:45','2026-04-10 12:19:45'),(34,5,8,'ENTREGADO','trarea por drive',100.00,'','2026-04-10 12:21:10',3,'2026-04-10 12:19:45','2026-04-13 18:58:39'),(35,5,9,'PENDIENTE',NULL,NULL,NULL,NULL,NULL,'2026-04-10 12:19:45','2026-04-10 12:19:45');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,3,3,'prueba','es una prueba','2026-03-10',4,'2026-03-09 13:11:39'),(2,3,1,'Ejercicio','Todos','2026-04-08',3,'2026-04-07 15:23:37'),(3,3,2,'ensayo ss','tast','2026-04-07',3,'2026-04-07 15:27:39'),(4,3,2,'Practica de Tareas','test','2026-04-07',3,'2026-04-07 16:14:21'),(5,3,1,'Tarea daen eejmp','','2026-04-11',3,'2026-04-10 12:19:45');
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
  `rol` enum('ADMIN','JEFE_ESTUDIOS','DOCENTE','JEFE_CURSO','CURSANTE','ADMIN_FINANZAS') NOT NULL DEFAULT 'ADMIN',
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Carlos','Azcarraga',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'admin@eaen.bo','$2b$10$JHOMdTA7wN8S4BTy1xl/tuekoHM54K/ytMPM72ufJdaFDiHD5Y6zi','ADMIN','ACTIVO',NULL,'2026-02-15 18:59:29',NULL),(2,'CARLOS ANDRES','AZCARRAGA ESQUIVEL','Ing. Sistemas','AZCARRAGA','ESQUIVEL','4947021','LP','Cochabamba','Civil','Noche','70776212','2026-01-20','BAIRESDEV','tasajos@gmail.com','tasajos@gmail.com','$2b$10$9tccmYrCQynD15PZlDtm8unLEs8KoioCxEggvg13lcSVmHDR0TG32','JEFE_ESTUDIOS','ACTIVO',NULL,'2026-02-16 00:45:01','1985-11-29'),(3,'PABLO ERNESTO','AZCARRAGA ESQUIVEL','Lic. Administracion Empresas','AZCARRAGA','ESQUIVEL','4947022','LP','Cochabamba','Civil','Noche','79361121','2026-02-05','PERSONAL','pablo.azcarraga@gmail.com','pablo.azcarraga@gmail.com','$2b$10$.UdDoO/IqPmH4IfiOX.rf.3VQ7.gf.rLjSfXEza2LFm1c7gbQgTz.','DOCENTE','ACTIVO','Docente','2026-02-16 00:46:51','1979-11-23'),(4,'EDGAR ARIEL','DIAZ ANDIA','Tte.Cnl','DIAZ','ANDIA','4314966','LP','Cochabamba','Ejército','Noche','71566670','2026-01-19','ECEM','diazari83@gmail.com','diazari83@gmail.com','$2b$10$u5zvCsdlLCsQ44P4tPW1nuhgVhHYc4HOPnxFe8FUAPmEW1YcfR3vy','DOCENTE','ACTIVO','Docente','2026-02-16 00:51:00','1979-11-09'),(5,'NIELSEN AMADO','FERNANDEZ ALIAGA','Tte.Cnl','FERNANDEZ','ALIAGA','3450202','LP','Cochabamba','Ejército','Noche','6822835','2026-01-19','ECEM','archivos0123456789@gmail.com','archivos0123456789@gmail.com','$2b$10$uzI0xNUOxdF1iVHTli7Cxe2.vgswH/mJzVc7z5aZDE0P8P4FXifoS','JEFE_CURSO','ACTIVO',NULL,'2026-02-16 01:03:45','1979-11-09'),(6,'asd','asd asd','Tte.Cnl','asd','asd','asd','LP','Cochabamba','Armada','Tarde','ads','1549-02-11','asd','asdasd@asdasd.com','asdasd@asdasd.com','$2b$10$gDiQmk3D6ooW.H3qXVnojujJ7ebxkkkos2QZQ.7z6eeeCyA2K5Phi','ADMIN','ACTIVO',NULL,'2026-02-16 01:05:24','1895-02-11'),(7,'TOMMY ABRAHAM','BUEZO ALVAREZ','Tte.Cnl','BUEZO','ALVAREZ','4283060','LP','Cochabamba','Ejército','Noche','68225225','2026-01-19','REGION MILITAR 7','pruebagoogle@chakuy.com','pruebagoogle@chakuy.com','$2b$10$lfgUI0drGyvawBHGIFr9YevaK1r35FeZJpL37GQugu12tN/RUC5XW','ADMIN_FINANZAS','ACTIVO','Administrador','2026-02-16 01:07:59','1000-10-10'),(8,'JOSE LUIS','QUIROZ BANEGAS','Tte.Cnl','QUIROZ','BANEGAS','3808543','CB','Cochabamba','Ejército','Noche','67407704','2026-01-19','DIV 7','joseluisquirozbanegas@gmail.com','joseluisquirozbanegas@gmail.com','$2b$10$SjkXAMnqIhSmnktI0EqVouoqqq1moVRrvOoQYfeQ81mW3gwyn3A4y','CURSANTE','ACTIVO','Cursante','2026-02-16 01:09:49','1000-10-10'),(9,'PEDRO PETER','GALVEZ GALVEZ','Tte.Cnl','GALVEZ','GALVEZ','4794001','LP','Cochabamba','Ejército','Noche','71733969','2026-01-19','ECEME','harjavi666@hotmail.com','harjavi666@hotmail.com','$2b$10$M1XJUpttRAg3t1hVPF1JxejO3l05IJ5PncGpv1sOT2fD8OHUOdHmS','CURSANTE','ACTIVO','Cursante','2026-02-16 01:42:04','1978-03-28'),(11,'Carlos Andres','Azcarraga Esquivel','Ing. Sistemas','Azcarraga','Esquivel','4947021011','LP','Cochabamba','Civil','Noche','70776212','2026-04-06','bairesdev','cazcarraga@chakuy.com','cazcarraga@chakuy.com','$2b$10$Tlxm.ryV6rpW8V/MsnyPFe4RRGR1TNJz8/ebsGvrMD/Hig6UHk2Iu','ADMIN','ACTIVO','Administrador','2026-04-06 19:09:47','2000-11-29');
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

-- Dump completed on 2026-04-14  8:50:00
