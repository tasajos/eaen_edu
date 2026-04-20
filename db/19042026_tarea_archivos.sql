-- Migración: agregar soporte de archivos Word a tarea_entregas
ALTER TABLE `tarea_entregas`
  ADD COLUMN `archivo_nombre` varchar(255) DEFAULT NULL AFTER `respuesta`,
  ADD COLUMN `archivo_ruta`   varchar(500) DEFAULT NULL AFTER `archivo_nombre`;
