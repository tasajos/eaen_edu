# MANUAL DE USUARIO — SISTEMA SISEAEN
## Escuela de Altos Estudios Nacionales "Avaroa"
**Versión:** 1.0 | **Fecha:** 19 de abril de 2026

---

## ÍNDICE

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Perfiles de Usuario](#3-perfiles-de-usuario)
4. [Perfil: Jefe de Estudios / Administrador](#4-perfil-jefe-de-estudios--administrador)
5. [Perfil: Administrador de Finanzas](#5-perfil-administrador-de-finanzas)
6. [Perfil: Docente](#6-perfil-docente)
7. [Perfil: Jefe de Curso](#7-perfil-jefe-de-curso)
8. [Perfil: Cursante](#8-perfil-cursante)
9. [Funcionalidades Compartidas](#9-funcionalidades-compartidas)
10. [Preguntas Frecuentes](#10-preguntas-frecuentes)

---

## 1. Introducción

El **SISEAEN** es el Sistema de Gestión Educativa de la Escuela de Altos Estudios Nacionales "Avaroa". Permite administrar de manera integral todos los procesos académicos, financieros y disciplinarios de la institución, incluyendo:

- Gestión de usuarios y cursos
- Control de asistencia y calificaciones
- Entrega y calificación de tareas
- Sistema de méritos y deméritos
- Gestión de pagos y finanzas
- Notificaciones institucionales
- Evaluaciones entre pares y docentes

**URL de acceso:** `https://siseaen.cbba.chakuy.online`

---

## 2. Acceso al Sistema

### 2.1 Inicio de Sesión

1. Ingrese a la URL del sistema en su navegador
2. En la pantalla de login introduzca:
   - **CI (Carnet de Identidad):** su número de carnet
   - **Contraseña:** su contraseña asignada
3. Haga clic en **"Ingresar"**
4. El sistema lo redirigirá automáticamente al panel correspondiente a su perfil

> **Nota:** Si olvida su contraseña, contacte al Jefe de Estudios o Administrador del sistema.

### 2.2 Cierre de Sesión

- En la barra lateral izquierda, haga clic en el botón **"Cerrar sesión"** ubicado en la parte inferior.
- Su sesión se cerrará de forma segura y será redirigido al login.

### 2.3 Navegación General

Todos los paneles cuentan con:

| Elemento | Descripción |
|---|---|
| **Barra lateral izquierda** | Menú principal con acceso a todos los módulos |
| **Encabezado superior** | Logo institucional, nombre del módulo activo y campana de notificaciones |
| **Área principal** | Contenido del módulo seleccionado |
| **Toasts (avisos emergentes)** | Mensajes de confirmación o error en la esquina inferior derecha |

---

## 3. Perfiles de Usuario

El sistema cuenta con **6 perfiles** con distintos niveles de acceso:

| Perfil | Rol en el sistema | Panel de acceso |
|---|---|---|
| **Jefe de Estudios** | Administrador general | `/dashboard-jefe` |
| **Administrador** | Igual a Jefe de Estudios | `/dashboard-jefe` |
| **Admin. Finanzas** | Gestión financiera exclusiva | `/gestion-finanzas` |
| **Docente** | Gestión académica de sus materias | `/dashboard-docente` |
| **Jefe de Curso** | Seguimiento de su curso | `/dashboard-jefe-curso` |
| **Cursante** | Consulta y entrega de actividades | `/dashboard-cursante` |

---

## 4. Perfil: Jefe de Estudios / Administrador

Es el perfil con mayor nivel de acceso. Gestiona todos los aspectos del sistema.

### 4.1 Gestión de Usuarios

**Ubicación:** Menú lateral → 👥 Gestión de Usuarios

#### Agregar Usuario
1. Haga clic en **"+ Nuevo Usuario"**
2. Complete los campos requeridos:
   - CI, Nombre, Apellido Paterno, Apellido Materno
   - Correo electrónico, contraseña inicial
   - Rol (DOCENTE, CURSANTE, JEFE_CURSO, etc.)
   - Estado (ACTIVO / INACTIVO)
3. Haga clic en **"Guardar"**

#### Modificar Usuario
1. En la lista de usuarios, haga clic en el ícono ✏️ del usuario a editar
2. Modifique los campos necesarios
3. Haga clic en **"Guardar cambios"**

#### Buscar Usuario
- Utilice el campo de búsqueda superior para filtrar por nombre, CI o correo

---

### 4.2 Gestión de Cursos

**Ubicación:** Menú lateral → 📚 Gestión de Cursos

#### Crear Curso
1. Haga clic en **"+ Nuevo Curso"**
2. Complete:
   - Nombre del curso, horas académicas, modalidad
   - Fechas de inicio y fin
   - Estado (ACTIVO / INACTIVO)
3. Haga clic en **"Crear Curso"**

#### Agregar Participantes
1. Seleccione el curso deseado
2. En la pestaña **"Participantes"** haga clic en **"+ Agregar"**
3. Busque al usuario por CI o nombre
4. Asigne su rol dentro del curso (Cursante, Docente, Jefe de Curso, etc.)
5. Confirme la asignación

#### Gestionar Materias del Curso
1. Seleccione el curso → pestaña **"Materias"**
2. Haga clic en **"+ Nueva Materia"**
3. Complete: nombre, código, horas, descripción, docente asignado
4. Guarde los cambios

---

### 4.3 Gestión Educativa

**Ubicación:** Menú lateral → 🎓 Gestión Educativa

Desde aquí el administrador puede gestionar:

#### Asistencia
- Ver y modificar registros de asistencia de cualquier materia
- Estados disponibles: **P** (Presente), **A** (Ausente), **T** (Tardanza), **J** (Justificado)

#### Calificaciones
- Configurar tipos de evaluación por materia (Parciales, Examen Final, Tareas, Trabajos)
- Asignar pesos porcentuales a cada evaluación
- Definir nota mínima aprobatoria
- Ver y editar el libro de notas de cualquier materia

#### Tareas
- Ver todas las tareas creadas por docentes
- Consultar el estado de entregas y calificaciones

---

### 4.4 Gestión de Notificaciones

**Ubicación:** Menú lateral → 🔔 Gestión de Notificaciones

#### Enviar Notificación
1. Haga clic en **"+ Nueva Notificación"**
2. Complete:
   - **Título** de la notificación
   - **Mensaje** / contenido
   - **Tipo:** INFO | ALERTA | URGENTE
3. Haga clic en **"Enviar"** — la notificación llegará a todos los usuarios del sistema

#### Ver Historial
- La lista muestra todas las notificaciones enviadas con fecha, tipo y estado
- Puede filtrar por tipo (INFO, ALERTA, URGENTE)
- Puede eliminar notificaciones obsoletas

---

### 4.5 Gestión de Disciplina

**Ubicación:** Menú lateral → ⚖️ Disciplina

#### Registrar Mérito o Demérito
1. Seleccione el curso y el participante
2. Haga clic en **"+ Registrar"**
3. Seleccione:
   - **Tipo:** Mérito ⭐ o Demérito ⚠️
   - **Categoría** (ej: Conducta ejemplar, Incumplimiento de tarea, etc.)
   - **Puntos** (0.5 a 10)
   - **Observaciones** (opcional)
4. Confirme el registro

#### Ver Historial Disciplinario
- Seleccione un participante para ver su historial completo
- El sistema muestra el balance: Méritos − Deméritos
- Se pueden filtrar registros por fecha

---

### 4.6 Gestión de Finanzas

**Ubicación:** Menú lateral → 💰 Gestión de Finanzas

#### Crear Concepto de Pago
1. En la pestaña **"Conceptos"** → **"+ Nuevo Concepto"**
2. Defina: nombre, tipo (MATRICULA, GUIA, MENSUALIDAD, OTRO), monto, fecha vencimiento
3. El concepto se asigna al curso seleccionado

#### Registrar un Pago
1. Seleccione el curso y el participante
2. En el concepto correspondiente, haga clic en **"Registrar Pago"**
3. Complete:
   - Monto pagado
   - Fecha de pago
   - N° de recibo
   - Estado: PAGADO | PENDIENTE | MORA | EXONERADO
   - Observaciones
4. Confirme el pago

#### Generar Comprobante (Voucher)
1. En el historial de pagos del participante, haga clic en el ícono 🖨️
2. Se genera un comprobante imprimible con:
   - Datos del participante
   - Concepto y monto
   - Fecha y N° de recibo
   - Sello de la institución

---

### 4.7 Evaluaciones Institucionales

**Ubicación:** Menú lateral → 📋 Evaluaciones

#### Configurar Período de Evaluación
1. Haga clic en **"+ Nuevo Período"**
2. Seleccione la plantilla de evaluación (indicadores/preguntas)
3. Defina el curso y las fechas del período
4. Active el período para que los cursantes puedan evaluarse

#### Ver Resultados
- Seleccione un período activo o cerrado
- El sistema muestra promedios por indicador
- Estadísticas de participación (cuántos completaron vs. total)

---

## 5. Perfil: Administrador de Finanzas

Tiene acceso exclusivo al módulo financiero. Sus funciones son las mismas descritas en la sección [4.6 Gestión de Finanzas](#46-gestión-de-finanzas):

- Crear y administrar conceptos de pago
- Registrar pagos y actualizar estados
- Generar comprobantes de pago
- Ver reportes financieros por curso:
  - Total recaudado
  - Pagos en mora
  - Pagos pendientes
- Ver el estado financiero individual de cada cursante

> El perfil de Administrador de Finanzas **no tiene acceso** a módulos académicos (usuarios, cursos, calificaciones, tareas ni disciplina).

---

## 6. Perfil: Docente

Gestiona la actividad académica de las materias que le han sido asignadas.

### 6.1 Selección de Materia

Al ingresar al panel, deberá seleccionar:
1. El **curso** al que pertenece la materia
2. La **materia** que desea gestionar

Una vez seleccionada, accederá a las pestañas del panel docente.

---

### 6.2 Módulo de Asistencia

**Pestaña:** 📋 Asistencia

#### Registrar Asistencia
1. Seleccione la **fecha** de la clase (por defecto el día actual)
2. La lista muestra todos los participantes del curso
3. Para cada participante, haga clic en el botón de estado para cambiarlo:
   - **P** → Verde: Presente
   - **T** → Amarillo: Tardanza
   - **A** → Rojo: Ausente
   - **J** → Azul: Justificado
4. Use **"Marcar todos presente"** para agilizar el registro
5. Haga clic en **"Guardar asistencia"**

> Los participantes recibirán una notificación automática cuando se registre una ausencia.

---

### 6.3 Módulo de Calificaciones

**Pestaña:** 📊 Calificaciones

#### Ingresar Notas
1. La tabla muestra los participantes en filas y los tipos de evaluación en columnas
2. Haga clic en la celda de nota del participante y tipo de evaluación correspondiente
3. Ingrese la nota (0 a 100)
4. Repita para todos los participantes

#### Bloquear Notas
Una vez ingresadas todas las notas de un participante:
1. Haga clic en el ícono 🔒 junto al nombre del participante
2. Confirme el bloqueo en el diálogo de confirmación
3. Las notas bloqueadas **no pueden modificarse** sin intervención del administrador
4. El ícono cambia a 🔒 indicando el estado bloqueado

> Las notas de tareas se calculan automáticamente según el promedio de las tareas calificadas.

---

### 6.4 Módulo de Tareas

**Pestaña:** 📤 Tareas

#### Ver Resumen de Tareas
La pestaña **"Todas las tareas"** muestra una tabla con:
- Título de la tarea y descripción
- Fecha límite de entrega
- Contadores: Total / Entregadas / Pendientes / Calificadas / Sin calificar
- Promedio de notas
- Botón **"Ver entregas →"**

#### Crear Nueva Tarea
1. Haga clic en la pestaña **"➕ Nueva tarea"**
2. Complete:
   - **Título** (obligatorio)
   - **Fecha límite** de entrega
   - **Consigna / Descripción** — instrucciones detalladas para los cursantes
3. Haga clic en **"📤 Publicar tarea"**
4. El sistema genera automáticamente un registro de entrega para cada cursante del curso

#### Ver y Calificar Entregas
1. En el resumen, haga clic en **"Ver entregas →"** de la tarea deseada
2. Se despliega la lista de todos los cursantes con su estado:
   - ✅ **Entregado** — con fecha de entrega
   - ⏳ **Pendiente** — no ha enviado
3. Para ver el documento entregado:
   - Haga clic en **"📄 Ver documento"**
   - Se abre un **visor en línea** del archivo Word — sin necesidad de descargarlo
4. Para calificar:
   - Ingrese la nota (0–100) en el campo correspondiente
   - Agregue un **comentario de feedback** (opcional)
   - Haga clic en **"🏅 Calificar"** o **"✏️ Actualizar"** si ya tenía nota previa

---

## 7. Perfil: Jefe de Curso

Tiene acceso de **consulta y seguimiento** sobre su curso asignado. No puede modificar datos académicos.

### 7.1 Resumen del Curso

**Pestaña:** 📊 Resumen

Muestra el panel informativo del curso:
- Nombre, modalidad, horas académicas
- Fechas de inicio y fin
- Estado (ACTIVO / INACTIVO)
- Estadísticas rápidas: N° de participantes, materias y docentes asignados

---

### 7.2 Participantes

**Pestaña:** 👥 Participantes

- Lista completa de todos los cursantes inscritos
- Datos: Nombre completo, CI, correo electrónico, estado (ACTIVO/INACTIVO)
- Campo de búsqueda para localizar rápidamente a un participante

---

### 7.3 Materias

**Pestaña:** 📚 Materias

- Lista de todas las materias del curso con:
  - Código, nombre, horas
  - Descripción
  - Docente asignado
- ⚠️ Las materias **sin docente asignado** muestran una advertencia en color rojo

---

### 7.4 Disciplina

**Pestaña:** ⚖️ Disciplina

- Visualiza el historial disciplinario de todos los participantes del curso
- Muestra méritos ⭐ y deméritos ⚠️ con fecha, categoría y puntos
- Balance general por participante (Méritos − Deméritos)
- Puede filtrar por participante o rango de fechas

> El Jefe de Curso **solo puede consultar** el historial. El registro de méritos/deméritos lo realiza el Docente o el Administrador.

---

## 8. Perfil: Cursante

Es el perfil del estudiante/participante. Puede consultar su información académica y entregar tareas.

### 8.1 Selección de Materia

Al ingresar, seleccione el **curso** y la **materia** que desea consultar para acceder a las funciones relacionadas.

---

### 8.2 Módulo de Tareas

**Pestaña:** 📤 Tareas

La pantalla muestra tarjetas por cada tarea asignada en la materia seleccionada.

#### Estados de una tarea:
| Estado | Color | Descripción |
|---|---|---|
| ⏳ Pendiente | Naranja | No ha sido entregada aún |
| ✅ Entregado | Verde | Archivo enviado correctamente |
| 🏅 Calificado | Azul | El docente ya asignó una nota |
| ⚠️ Vencida | Rojo | El plazo expiró sin entrega |

#### Entregar una Tarea
1. Haga clic en la tarjeta de la tarea para expandirla
2. Lea la **consigna** del docente
3. En la sección de entrega, haga clic en **"📂 Seleccionar archivo Word"**
4. Seleccione su archivo desde su computadora
   - Solo se aceptan archivos **.doc** o **.docx**
   - Tamaño máximo: **5 MB**
5. Verifique que el nombre y tamaño del archivo sean correctos
6. Haga clic en **"📤 Enviar tarea"**
7. Recibirá confirmación de entrega exitosa

> **Importante:** Una vez vencida la fecha límite, el sistema **no permite** enviar la tarea.

#### Ver Calificación Recibida
- Si el docente ya calificó su entrega, la tarjeta mostrará:
  - **Nota obtenida** (ej: 85 pts)
  - **Feedback / comentario** del docente
  - Estado en color: Verde (≥70 pts Aprobado) / Rojo (<70 pts Reprobado)

---

### 8.3 Módulo de Calificaciones

**Pestaña:** 📊 Mis Notas

Muestra el **boletín de notas** de la materia seleccionada:

- **Badge central grande** con el promedio general y estado (Aprobado / Reprobado)
- **Tabla de evaluaciones** con:
  - Nombre del tipo de evaluación
  - Nota obtenida
  - Peso porcentual
  - Estado individual (Aprobado / Reprobado)
- Las tarjetas se muestran en verde (aprobado) o rojo (reprobado)

---

### 8.4 Módulo de Asistencia

**Pestaña:** 📋 Asistencia

Muestra el historial de asistencia personal:

- **Barra de porcentaje visual** con código de colores:
  - 🟢 Verde: ≥ 75% (dentro del mínimo requerido)
  - 🟡 Naranja: 60%–74% (en riesgo)
  - 🔴 Rojo: < 60% (por debajo del mínimo)
- Advertencia automática si el porcentaje es insuficiente
- **Tabla de registros** con:
  - Fecha
  - Estado: ✅ Presente | ❌ Ausente | ⏰ Tardanza | 📋 Justificado
  - Observaciones del docente

---

### 8.5 Módulo de Disciplina

**Pestaña:** ⚖️ Disciplina

Muestra el historial disciplinario personal:

- **Tarjetas resumen:** Total de méritos, total de deméritos, balance neto
- **Tabla de registros** con:
  - Fecha del registro
  - Tipo: ⭐ Mérito o ⚠️ Demérito
  - Categoría (ej: Conducta ejemplar, Tardanza reiterada)
  - Puntos asignados
  - Descripción/observación

---

### 8.6 Módulo de Pagos

**Pestaña:** 💰 Pagos

Muestra el estado financiero del cursante:

#### Ver Estado de Pagos
- Lista todos los conceptos de pago del curso
- Cada concepto muestra:
  - Nombre del concepto (Matrícula, Guía, Mensualidad, Otro)
  - Monto
  - Fecha de vencimiento
  - Estado actual:

| Estado | Color | Significado |
|---|---|---|
| PAGADO | 🟢 Verde | Pago registrado correctamente |
| PENDIENTE | 🟡 Amarillo | Aún no se ha registrado el pago |
| MORA | 🔴 Rojo | Pago vencido sin regularizar |
| EXONERADO | 🔵 Azul | Exento de este pago |

#### Descargar Comprobante
1. Localice el concepto con estado **PAGADO**
2. Haga clic en el ícono 🖨️ o botón de comprobante
3. Se generará un voucher en pantalla listo para imprimir o guardar

#### Bloqueo por Mora
Si tiene pagos en estado **MORA**, al ingresar al sistema aparecerá un **modal de bloqueo financiero** que:
- Lista los conceptos impagos y los montos adeudados
- Muestra el total de deuda
- Indica que debe regularizar su situación con el departamento de finanzas
- **No puede descartarse** hasta que el pago sea registrado por finanzas

---

### 8.7 Módulo de Evaluaciones Institucionales

**Pestaña:** 📋 Evaluaciones

Permite al cursante participar en evaluaciones anónimas:

#### Evaluación entre Cursantes
1. Seleccione el período de evaluación activo
2. Aparecerá la lista de compañeros a evaluar
3. Para cada compañero, haga clic en **"Evaluar"**
4. Responda cada indicador con la escala:
   - 100 → Siempre
   - 75 → Casi siempre
   - 50 → A veces
   - 25 → Casi nunca
   - 0 → Nunca
5. Agregue observaciones opcionales
6. Haga clic en **"Enviar evaluación"**
7. El registro se marca con ✅ al completarse

#### Evaluación al Docente
- Mismo proceso que la evaluación entre cursantes
- Aparece la lista de docentes asignados al curso
- La evaluación es anónima

---

### 8.8 Módulo de Calendario

**Pestaña:** 📅 Calendario

- Visualiza el calendario académico del curso
- Muestra fechas de clases, eventos y actividades programadas
- Permite navegar entre meses

---

## 9. Funcionalidades Compartidas

### 9.1 Notificaciones

Todos los perfiles tienen acceso al panel de notificaciones:

- **Campana 🔔** en el encabezado: muestra el número de notificaciones sin leer
- Haga clic en la campana para abrir el panel de notificaciones
- Tipos de notificación:
  - 🔵 **INFO** — Información general del sistema
  - 🟡 **ALERTA** — Avisos importantes
  - 🔴 **URGENTE** — Requiere atención inmediata
- Haga clic en una notificación para leer el detalle
- Haga clic en **"Marcar todas como leídas"** para limpiar el contador

---

### 9.2 Visor de Documentos Word

El sistema incluye un **visor en línea** para archivos Word entregados en tareas:

- **Para docentes:** Al hacer clic en "📄 Ver documento" en la lista de entregas
- El documento se muestra en una **ventana modal** dentro del sistema
- No requiere descargar el archivo
- Compatible con archivos **.docx** y **.doc**
- El visor renderiza: texto, títulos, párrafos, tablas e imágenes básicas
- Para cerrar el visor, haga clic en **✕** o fuera del modal

---

### 9.3 Mensajes de Confirmación (Toasts)

El sistema muestra mensajes emergentes en la esquina inferior derecha para confirmar acciones:

| Tipo | Color | Ejemplo |
|---|---|---|
| ✅ Éxito | Verde | "Tarea entregada exitosamente" |
| ❌ Error | Rojo | "El archivo supera el límite de 5 MB" |
| ⚠️ Advertencia | Naranja | "El plazo de entrega venció" |

Los mensajes desaparecen automáticamente después de unos segundos.

---

## 10. Preguntas Frecuentes

**¿Qué hago si olvidé mi contraseña?**
Contacte al Jefe de Estudios o Administrador del sistema para que restablezca su contraseña.

**¿Por qué no puedo acceder al sistema y aparece un mensaje de bloqueo financiero?**
Tiene pagos en estado MORA (vencidos). Regularice su situación con el departamento de finanzas para recuperar el acceso completo.

**¿Puedo entregar una tarea después de la fecha límite?**
No. El sistema bloquea automáticamente la entrega una vez que la fecha límite ha expirado.

**¿Qué formatos de archivo acepta el sistema para las tareas?**
Solo archivos Word: **.doc** y **.docx**. El tamaño máximo permitido es **5 MB**.

**¿Puedo ver el documento que entregué?**
No directamente desde el panel de cursante. El docente puede verlo desde su panel de entregas.

**¿Por qué mis notas aparecen bloqueadas (🔒)?**
El docente confirmó y bloqueó sus notas. Una vez bloqueadas, solo el Administrador puede modificarlas.

**¿El porcentaje de asistencia mínimo requerido cuál es?**
El mínimo requerido es del **75%**. Por debajo de ese porcentaje, el sistema muestra una advertencia.

**¿Las evaluaciones institucionales son anónimas?**
Sí. El sistema no revela al evaluado quién realizó cada evaluación específica.

**¿Puedo imprimir mi comprobante de pago?**
Sí. Desde el módulo de Pagos, haga clic en el ícono de comprobante del concepto pagado y use la función de impresión de su navegador.

---

*Manual elaborado para uso interno de la EAEN "Avaroa" — Sistema SISEAEN v1.0*
*Fecha de elaboración: 19 de abril de 2026*
