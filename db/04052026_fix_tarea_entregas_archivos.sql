-- Soporte de archivos Word en entregas de tareas.
-- Ejecutar en produccion sobre la base eaen_educacion.

ALTER TABLE `tarea_entregas`
  ADD COLUMN IF NOT EXISTS `respuesta`       text DEFAULT NULL AFTER `estado`,
  ADD COLUMN IF NOT EXISTS `archivo_nombre` varchar(255) DEFAULT NULL AFTER `respuesta`,
  ADD COLUMN IF NOT EXISTS `archivo_ruta`   varchar(500) DEFAULT NULL AFTER `archivo_nombre`;
