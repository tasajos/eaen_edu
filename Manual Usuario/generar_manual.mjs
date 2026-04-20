import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak, TableOfContents,
  StyleLevel, LevelFormat, convertInchesToTwip, Header,
  ImageRun, Footer, PageNumber, NumberFormat
} from "docx";
import fs from "fs";
import path from "path";

const AZUL_OSCURO = "1a237e";
const AZUL_MEDIO  = "3949ab";
const AZUL_CLARO  = "e8eaf6";
const GRIS_CLARO  = "f5f5f5";
const VERDE       = "2e7d32";
const ROJO        = "c62828";
const NARANJA     = "e65100";
const BLANCO      = "FFFFFF";

// ── Helpers ────────────────────────────────────────────────

function titulo1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    thematicBreak: false,
    style: "Heading1",
  });
}

function titulo2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
  });
}

function titulo3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  });
}

function parrafo(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", ...opts })],
    spacing: { after: 120 },
  });
}

function negrita(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, font: "Calibri" })],
    spacing: { after: 100 },
  });
}

function viñeta(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri" })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function viñeta2(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri" })],
    bullet: { level: 1 },
    spacing: { after: 60 },
  });
}

function paso(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 22, font: "Calibri", color: AZUL_OSCURO }),
      new TextRun({ text, size: 22, font: "Calibri" }),
    ],
    indent: { left: 360 },
    spacing: { after: 80 },
  });
}

function nota(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "Nota: ", bold: true, italics: true, size: 20, font: "Calibri", color: AZUL_MEDIO }),
      new TextRun({ text, italics: true, size: 20, font: "Calibri", color: "444444" }),
    ],
    border: { left: { style: BorderStyle.THICK, size: 6, color: AZUL_MEDIO } },
    indent: { left: 200 },
    spacing: { before: 100, after: 150 },
    shading: { type: ShadingType.CLEAR, fill: "EEF2FF" },
  });
}

function importante(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "⚠ Importante: ", bold: true, size: 20, font: "Calibri", color: "b45309" }),
      new TextRun({ text, size: 20, font: "Calibri", color: "444444" }),
    ],
    border: { left: { style: BorderStyle.THICK, size: 6, color: "f59e0b" } },
    indent: { left: 200 },
    spacing: { before: 100, after: 150 },
    shading: { type: ShadingType.CLEAR, fill: "fffbeb" },
  });
}

function espacio() {
  return new Paragraph({ text: "", spacing: { after: 100 } });
}

function lineaDivisora() {
  return new Paragraph({
    text: "",
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "cccccc" } },
    spacing: { after: 200 },
  });
}

function tablaCeldas(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, color: BLANCO, size: 20, font: "Calibri" })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { type: ShadingType.CLEAR, fill: AZUL_OSCURO },
        width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell), size: 20, font: "Calibri" })],
            alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          })],
          shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? BLANCO : GRIS_CLARO },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

// ── Portada ────────────────────────────────────────────────

function portada() {
  return [
    new Paragraph({ text: "", spacing: { after: 1200 } }),
    new Paragraph({
      children: [new TextRun({
        text: "MANUAL DE USUARIO",
        bold: true, size: 56, font: "Calibri", color: AZUL_OSCURO, allCaps: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: "SISTEMA SISEAEN",
        bold: true, size: 44, font: "Calibri", color: AZUL_MEDIO, allCaps: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.THICK, size: 8, color: AZUL_OSCURO } },
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Escuela de Altos Estudios Nacionales "Avaroa"',
        size: 30, font: "Calibri", color: "444444", italics: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({ text: "", spacing: { after: 1400 } }),
    new Paragraph({
      children: [new TextRun({ text: "Versión: ", bold: true, size: 22, font: "Calibri", color: "666666" }),
                 new TextRun({ text: "1.0", size: 22, font: "Calibri", color: "666666" })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Fecha: ", bold: true, size: 22, font: "Calibri", color: "666666" }),
                 new TextRun({ text: "19 de abril de 2026", size: 22, font: "Calibri", color: "666666" })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Sistema: ", bold: true, size: 22, font: "Calibri", color: "666666" }),
                 new TextRun({ text: "https://siseaen.cbba.chakuy.online", size: 22, font: "Calibri", color: AZUL_MEDIO })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── DOCUMENTO ──────────────────────────────────────────────

const children = [
  ...portada(),

  // ── 1. Introducción
  titulo1("1. Introducción"),
  parrafo('El SISEAEN es el Sistema de Gestion Educativa de la Escuela de Altos Estudios Nacionales "Avaroa". Permite administrar de manera integral todos los procesos academicos, financieros y disciplinarios de la institucion.'),
  espacio(),
  negrita("El sistema cubre los siguientes procesos:"),
  viñeta("Gestión de usuarios y cursos"),
  viñeta("Control de asistencia y calificaciones"),
  viñeta("Entrega y calificación de tareas (archivos Word)"),
  viñeta("Sistema de méritos y deméritos"),
  viñeta("Gestión de pagos y finanzas"),
  viñeta("Notificaciones institucionales"),
  viñeta("Evaluaciones entre pares y docentes"),
  espacio(),
  parrafo("URL de acceso: https://siseaen.cbba.chakuy.online"),
  lineaDivisora(),

  // ── 2. Acceso al Sistema
  titulo1("2. Acceso al Sistema"),
  titulo2("2.1 Inicio de Sesión"),
  paso(1, "Ingrese a la URL del sistema en su navegador web."),
  paso(2, "En la pantalla de login introduzca su CI (Carnet de Identidad) y su contraseña asignada."),
  paso(3, "Haga clic en \"Ingresar\"."),
  paso(4, "El sistema lo redirigirá automáticamente al panel correspondiente a su perfil."),
  espacio(),
  nota("Si olvida su contraseña, contacte al Jefe de Estudios o Administrador del sistema."),
  titulo2("2.2 Cierre de Sesión"),
  parrafo("En la barra lateral izquierda, haga clic en el botón \"Cerrar sesión\" ubicado en la parte inferior. Su sesión se cerrará de forma segura y será redirigido al login."),
  titulo2("2.3 Navegación General"),
  espacio(),
  tablaCeldas(
    ["Elemento", "Descripción"],
    [
      ["Barra lateral izquierda", "Menú principal con acceso a todos los módulos"],
      ["Encabezado superior", "Logo institucional, nombre del módulo activo y campana de notificaciones"],
      ["Área principal", "Contenido del módulo seleccionado"],
      ["Toasts (avisos emergentes)", "Mensajes de confirmación o error en la esquina inferior derecha"],
    ],
    [30, 70]
  ),
  lineaDivisora(),

  // ── 3. Perfiles de Usuario
  titulo1("3. Perfiles de Usuario"),
  parrafo("El sistema cuenta con 6 perfiles con distintos niveles de acceso:"),
  espacio(),
  tablaCeldas(
    ["Perfil", "Rol en el sistema", "Panel de acceso"],
    [
      ["Jefe de Estudios", "Administrador general", "/dashboard-jefe"],
      ["Administrador", "Igual a Jefe de Estudios", "/dashboard-jefe"],
      ["Admin. Finanzas", "Gestión financiera exclusiva", "/gestion-finanzas"],
      ["Docente", "Gestión académica de sus materias", "/dashboard-docente"],
      ["Jefe de Curso", "Seguimiento de su curso", "/dashboard-jefe-curso"],
      ["Cursante", "Consulta y entrega de actividades", "/dashboard-cursante"],
    ],
    [25, 45, 30]
  ),
  espacio(),
  titulo2("Resumen de accesos por perfil"),
  espacio(),
  tablaCeldas(
    ["Funcionalidad", "Admin", "Fin.", "Docente", "Jefe Curso", "Cursante"],
    [
      ["Gestión de Usuarios",       "✔", "✘", "✘", "✘", "✘"],
      ["Creación de Cursos",        "✔", "✘", "✘", "✘", "✘"],
      ["Gestión de Materias",       "✔", "✘", "✘", "Solo ver", "✘"],
      ["Registro de Asistencia",    "✔", "✘", "✔", "✘", "Solo ver"],
      ["Ingreso de Calificaciones", "✔", "✘", "✔", "✘", "Solo ver"],
      ["Crear y Calificar Tareas",  "✘", "✘", "✔", "✘", "Solo entregar"],
      ["Gestión de Finanzas",       "✔", "✔", "✘", "✘", "Solo ver"],
      ["Registro de Disciplina",    "✔", "✘", "✔", "Solo ver", "Solo ver"],
      ["Enviar Notificaciones",     "✔", "✘", "✘", "✘", "Solo ver"],
      ["Evaluaciones Institucionales","✔", "✘", "✘", "✘", "Completar"],
      ["Ver Calendario",            "✔", "✘", "✔", "✔", "✔"],
    ],
    [34, 11, 11, 14, 16, 14]
  ),
  lineaDivisora(),

  // ── 4. Jefe de Estudios
  titulo1("4. Perfil: Jefe de Estudios / Administrador"),
  parrafo("Es el perfil con mayor nivel de acceso. Gestiona todos los aspectos del sistema desde el panel /dashboard-jefe."),

  titulo2("4.1 Gestión de Usuarios"),
  parrafo("Ubicación: Menú lateral → 👥 Gestión de Usuarios"),
  titulo3("Agregar Usuario"),
  paso(1, "Haga clic en \"+ Nuevo Usuario\"."),
  paso(2, "Complete los campos: CI, Nombre, Apellidos, Correo, contraseña inicial, Rol y Estado."),
  paso(3, "Haga clic en \"Guardar\"."),
  titulo3("Modificar Usuario"),
  paso(1, "En la lista, haga clic en el ícono ✏️ del usuario a editar."),
  paso(2, "Modifique los campos necesarios."),
  paso(3, "Haga clic en \"Guardar cambios\"."),
  titulo3("Buscar Usuario"),
  parrafo("Utilice el campo de búsqueda superior para filtrar por nombre, CI o correo."),

  titulo2("4.2 Gestión de Cursos"),
  parrafo("Ubicación: Menú lateral → 📚 Gestión de Cursos"),
  titulo3("Crear Curso"),
  paso(1, "Haga clic en \"+ Nuevo Curso\"."),
  paso(2, "Complete: nombre del curso, horas académicas, modalidad, fechas de inicio y fin."),
  paso(3, "Haga clic en \"Crear Curso\"."),
  titulo3("Agregar Participantes"),
  paso(1, "Seleccione el curso deseado."),
  paso(2, "En la pestaña \"Participantes\" haga clic en \"+ Agregar\"."),
  paso(3, "Busque al usuario por CI o nombre y asigne su rol dentro del curso."),
  paso(4, "Confirme la asignación."),
  titulo3("Gestionar Materias del Curso"),
  paso(1, "Seleccione el curso → pestaña \"Materias\"."),
  paso(2, "Haga clic en \"+ Nueva Materia\"."),
  paso(3, "Complete: nombre, código, horas, descripción y docente asignado."),
  paso(4, "Guarde los cambios."),

  titulo2("4.3 Gestión Educativa"),
  parrafo("Ubicación: Menú lateral → 🎓 Gestión Educativa"),
  titulo3("Asistencia"),
  parrafo("Ver y modificar registros de asistencia de cualquier materia. Estados: P (Presente), A (Ausente), T (Tardanza), J (Justificado)."),
  titulo3("Calificaciones"),
  parrafo("Configurar tipos de evaluación por materia (Parciales, Examen Final, Tareas, Trabajos), asignar pesos porcentuales, definir nota mínima aprobatoria y gestionar el libro de notas."),

  titulo2("4.4 Gestión de Notificaciones"),
  parrafo("Ubicación: Menú lateral → 🔔 Gestión de Notificaciones"),
  titulo3("Enviar Notificación"),
  paso(1, "Haga clic en \"+ Nueva Notificación\"."),
  paso(2, "Complete el título, mensaje y seleccione el tipo: INFO | ALERTA | URGENTE."),
  paso(3, "Haga clic en \"Enviar\" — llegará a todos los usuarios del sistema."),
  titulo3("Ver Historial"),
  parrafo("La lista muestra todas las notificaciones enviadas con fecha, tipo y estado. Puede filtrar por tipo y eliminar notificaciones obsoletas."),

  titulo2("4.5 Gestión de Disciplina"),
  parrafo("Ubicación: Menú lateral → ⚖️ Disciplina"),
  titulo3("Registrar Mérito o Demérito"),
  paso(1, "Seleccione el curso y el participante."),
  paso(2, "Haga clic en \"+ Registrar\"."),
  paso(3, "Seleccione el tipo (Mérito ⭐ o Demérito ⚠️), categoría, puntos (0.5 a 10) y observaciones."),
  paso(4, "Confirme el registro."),
  parrafo("El sistema muestra el balance acumulado: Méritos − Deméritos por participante."),

  titulo2("4.6 Gestión de Finanzas"),
  parrafo("Ubicación: Menú lateral → 💰 Gestión de Finanzas"),
  titulo3("Crear Concepto de Pago"),
  paso(1, "En la pestaña \"Conceptos\" → \"+ Nuevo Concepto\"."),
  paso(2, "Defina: nombre, tipo (MATRICULA, GUIA, MENSUALIDAD, OTRO), monto y fecha de vencimiento."),
  titulo3("Registrar un Pago"),
  paso(1, "Seleccione el curso y el participante."),
  paso(2, "En el concepto correspondiente, haga clic en \"Registrar Pago\"."),
  paso(3, "Complete: monto pagado, fecha, N° de recibo y estado (PAGADO / PENDIENTE / MORA / EXONERADO)."),
  paso(4, "Confirme el pago."),
  titulo3("Generar Comprobante (Voucher)"),
  paso(1, "En el historial del participante, haga clic en el ícono 🖨️."),
  paso(2, "Se genera un comprobante imprimible con datos del participante, concepto, monto, fecha y N° de recibo."),

  titulo2("4.7 Evaluaciones Institucionales"),
  parrafo("Ubicación: Menú lateral → 📋 Evaluaciones"),
  titulo3("Configurar Período de Evaluación"),
  paso(1, "Haga clic en \"+ Nuevo Período\"."),
  paso(2, "Seleccione la plantilla de evaluación y defina el curso y fechas del período."),
  paso(3, "Active el período para que los cursantes puedan evaluarse."),
  parrafo("El sistema muestra estadísticas de participación y promedios por indicador una vez completado el período."),
  lineaDivisora(),

  // ── 5. Admin Finanzas
  titulo1("5. Perfil: Administrador de Finanzas"),
  parrafo("Tiene acceso exclusivo al módulo financiero. Sus funciones son:"),
  viñeta("Crear y administrar conceptos de pago por curso"),
  viñeta("Registrar pagos y actualizar estados (PAGADO, PENDIENTE, MORA, EXONERADO)"),
  viñeta("Generar comprobantes de pago para los cursantes"),
  viñeta("Ver reportes financieros: total recaudado, pagos en mora, pendientes"),
  viñeta("Ver el estado financiero individual de cada cursante"),
  espacio(),
  importante("Este perfil NO tiene acceso a módulos académicos (usuarios, cursos, calificaciones, tareas ni disciplina)."),
  parrafo("El proceso de registro de pagos y generación de comprobantes es idéntico al descrito en la sección 4.6."),
  lineaDivisora(),

  // ── 6. Docente
  titulo1("6. Perfil: Docente"),
  parrafo("Gestiona la actividad académica de las materias que le han sido asignadas desde el panel /dashboard-docente."),
  titulo2("Selección de Materia"),
  parrafo("Al ingresar, seleccione el curso y la materia que desea gestionar. Una vez seleccionada, accederá a las pestañas del panel docente."),

  titulo2("6.1 Módulo de Asistencia"),
  parrafo("Pestaña: 📋 Asistencia"),
  titulo3("Registrar Asistencia"),
  paso(1, "Seleccione la fecha de la clase (por defecto el día actual)."),
  paso(2, "La lista muestra todos los participantes del curso."),
  paso(3, "Para cada participante, haga clic en el botón de estado para cambiarlo:"),
  viñeta2("P → Verde: Presente"),
  viñeta2("T → Amarillo: Tardanza"),
  viñeta2("A → Rojo: Ausente"),
  viñeta2("J → Azul: Justificado"),
  paso(4, "Use \"Marcar todos presente\" para agilizar el registro."),
  paso(5, "Haga clic en \"Guardar asistencia\"."),
  nota("Los participantes recibirán una notificación automática cuando se registre una ausencia."),

  titulo2("6.2 Módulo de Calificaciones"),
  parrafo("Pestaña: 📊 Calificaciones"),
  titulo3("Ingresar Notas"),
  paso(1, "La tabla muestra los participantes en filas y los tipos de evaluación en columnas."),
  paso(2, "Haga clic en la celda de nota y escriba el valor (0 a 100)."),
  paso(3, "Repita para todos los participantes."),
  titulo3("Bloquear Notas"),
  paso(1, "Una vez ingresadas todas las notas de un participante, haga clic en el ícono 🔒."),
  paso(2, "Confirme el bloqueo en el diálogo de confirmación."),
  paso(3, "Las notas bloqueadas no pueden modificarse sin intervención del administrador."),
  importante("Las notas de tareas se calculan automáticamente según el promedio de las tareas calificadas."),

  titulo2("6.3 Módulo de Tareas"),
  parrafo("Pestaña: 📤 Tareas"),
  titulo3("Ver Resumen de Tareas"),
  parrafo("La pestaña \"Todas las tareas\" muestra una tabla con: título, fecha límite, contadores (total / entregadas / pendientes / calificadas / sin calificar) y promedio de notas."),
  titulo3("Crear Nueva Tarea"),
  paso(1, "Haga clic en la pestaña \"➕ Nueva tarea\"."),
  paso(2, "Complete el título (obligatorio), fecha límite y la consigna/descripción para los cursantes."),
  paso(3, "Haga clic en \"📤 Publicar tarea\"."),
  paso(4, "El sistema genera automáticamente un registro de entrega para cada cursante del curso."),
  titulo3("Ver y Calificar Entregas"),
  paso(1, "En el resumen, haga clic en \"Ver entregas →\" de la tarea deseada."),
  paso(2, "Se despliega la lista de todos los cursantes con su estado: ✅ Entregado o ⏳ Pendiente."),
  paso(3, "Para ver el documento entregado, haga clic en \"📄 Ver documento\"."),
  paso(4, "Se abre un visor en línea del archivo Word — sin necesidad de descargarlo."),
  paso(5, "Ingrese la nota (0–100) y un comentario de feedback (opcional)."),
  paso(6, "Haga clic en \"🏅 Calificar\" o \"✏️ Actualizar\" si ya tenía nota previa."),
  lineaDivisora(),

  // ── 7. Jefe de Curso
  titulo1("7. Perfil: Jefe de Curso"),
  parrafo("Tiene acceso de consulta y seguimiento sobre su curso asignado. No puede modificar datos académicos."),

  titulo2("7.1 Resumen del Curso"),
  parrafo("Muestra el panel informativo: nombre del curso, modalidad, horas académicas, fechas de inicio y fin, estado (ACTIVO/INACTIVO) y estadísticas rápidas de participantes, materias y docentes asignados."),

  titulo2("7.2 Participantes"),
  parrafo("Lista completa de todos los cursantes inscritos con datos: nombre completo, CI, correo y estado. Incluye campo de búsqueda para localizar rápidamente a un participante."),

  titulo2("7.3 Materias"),
  parrafo("Lista de todas las materias del curso con: código, nombre, horas, descripción y docente asignado."),
  nota("Las materias sin docente asignado muestran una advertencia en color rojo."),

  titulo2("7.4 Disciplina"),
  parrafo("Visualiza el historial disciplinario completo de los participantes: méritos ⭐ y deméritos ⚠️ con fecha, categoría, puntos y balance general. Puede filtrar por participante o rango de fechas."),
  importante("El Jefe de Curso solo puede consultar el historial. El registro de méritos/deméritos lo realiza el Docente o el Administrador."),
  lineaDivisora(),

  // ── 8. Cursante
  titulo1("8. Perfil: Cursante"),
  parrafo("Es el perfil del estudiante/participante. Puede consultar su información académica y entregar tareas desde el panel /dashboard-cursante."),
  titulo2("Selección de Materia"),
  parrafo("Al ingresar, seleccione el curso y la materia que desea consultar para acceder a las funciones relacionadas."),

  titulo2("8.1 Módulo de Tareas"),
  parrafo("Pestaña: 📤 Tareas"),
  parrafo("La pantalla muestra tarjetas por cada tarea asignada. Los estados posibles son:"),
  espacio(),
  tablaCeldas(
    ["Estado", "Color", "Descripción"],
    [
      ["⏳ Pendiente", "Naranja", "No ha sido entregada aún"],
      ["✅ Entregado", "Verde", "Archivo enviado correctamente"],
      ["🏅 Calificado", "Azul", "El docente ya asignó una nota"],
      ["⚠️ Vencida", "Rojo", "El plazo expiró sin entrega"],
    ],
    [25, 20, 55]
  ),
  espacio(),
  titulo3("Entregar una Tarea"),
  paso(1, "Haga clic en la tarjeta de la tarea para expandirla y leer la consigna."),
  paso(2, "En la sección de entrega, haga clic en \"📂 Seleccionar archivo Word\"."),
  paso(3, "Seleccione su archivo desde su computadora."),
  viñeta2("Solo se aceptan archivos .doc o .docx"),
  viñeta2("Tamaño máximo: 5 MB"),
  paso(4, "Verifique que el nombre y tamaño del archivo sean correctos."),
  paso(5, "Haga clic en \"📤 Enviar tarea\"."),
  importante("Una vez vencida la fecha límite, el sistema NO permite enviar la tarea."),
  titulo3("Ver Calificación Recibida"),
  parrafo("Si el docente calificó su entrega, la tarjeta mostrará la nota obtenida, el feedback del docente y el estado en color: Verde (≥70 pts, Aprobado) o Rojo (<70 pts, Reprobado)."),

  titulo2("8.2 Módulo de Calificaciones"),
  parrafo("Pestaña: 📊 Mis Notas"),
  parrafo("Muestra el boletín de notas de la materia seleccionada con:"),
  viñeta("Badge central con el promedio general y estado (Aprobado / Reprobado)"),
  viñeta("Tabla de evaluaciones con nombre, nota obtenida, peso porcentual y estado individual"),
  viñeta("Tarjetas en verde (aprobado) o rojo (reprobado) por evaluación"),

  titulo2("8.3 Módulo de Asistencia"),
  parrafo("Pestaña: 📋 Asistencia"),
  parrafo("Muestra el historial de asistencia personal con barra de porcentaje y código de colores:"),
  viñeta("🟢 Verde: ≥ 75% (dentro del mínimo requerido)"),
  viñeta("🟡 Naranja: 60%–74% (en riesgo)"),
  viñeta("🔴 Rojo: < 60% (por debajo del mínimo)"),
  parrafo("La tabla de registros muestra: fecha, estado (✅ Presente | ❌ Ausente | ⏰ Tardanza | 📋 Justificado) y observaciones del docente."),

  titulo2("8.4 Módulo de Disciplina"),
  parrafo("Pestaña: ⚖️ Disciplina"),
  parrafo("Muestra el historial disciplinario personal con tarjetas resumen (total de méritos, deméritos y balance neto) y tabla de registros con fecha, tipo, categoría, puntos y descripción."),

  titulo2("8.5 Módulo de Pagos"),
  parrafo("Pestaña: 💰 Pagos"),
  parrafo("Muestra el estado financiero del cursante. Los estados de pago son:"),
  espacio(),
  tablaCeldas(
    ["Estado", "Color", "Significado"],
    [
      ["PAGADO",     "🟢 Verde",    "Pago registrado correctamente"],
      ["PENDIENTE",  "🟡 Amarillo", "Aún no se ha registrado el pago"],
      ["MORA",       "🔴 Rojo",     "Pago vencido sin regularizar"],
      ["EXONERADO",  "🔵 Azul",     "Exento de este pago"],
    ],
    [20, 20, 60]
  ),
  espacio(),
  titulo3("Descargar Comprobante"),
  paso(1, "Localice el concepto con estado PAGADO."),
  paso(2, "Haga clic en el ícono 🖨️ o botón de comprobante."),
  paso(3, "Se generará un voucher listo para imprimir o guardar."),
  titulo3("Bloqueo por Mora"),
  parrafo("Si tiene pagos en estado MORA, al ingresar aparecerá un modal de bloqueo financiero que lista los conceptos impagos, el total adeudado y no puede descartarse hasta que finanzas registre el pago."),

  titulo2("8.6 Módulo de Evaluaciones Institucionales"),
  parrafo("Pestaña: 📋 Evaluaciones"),
  titulo3("Evaluación entre Cursantes"),
  paso(1, "Seleccione el período de evaluación activo."),
  paso(2, "Aparecerá la lista de compañeros a evaluar."),
  paso(3, "Para cada compañero, haga clic en \"Evaluar\"."),
  paso(4, "Responda cada indicador con la escala:"),
  viñeta2("100 → Siempre"),
  viñeta2("75 → Casi siempre"),
  viñeta2("50 → A veces"),
  viñeta2("25 → Casi nunca"),
  viñeta2("0 → Nunca"),
  paso(5, "Agregue observaciones opcionales y haga clic en \"Enviar evaluación\"."),
  nota("Las evaluaciones son completamente anónimas. El sistema no revela al evaluado quién realizó cada evaluación."),

  titulo2("8.7 Módulo de Calendario"),
  parrafo("Pestaña: 📅 Calendario — Visualiza el calendario académico del curso con fechas de clases, eventos y actividades programadas."),
  lineaDivisora(),

  // ── 9. Funcionalidades Compartidas
  titulo1("9. Funcionalidades Compartidas"),

  titulo2("9.1 Notificaciones"),
  parrafo("Todos los perfiles tienen acceso al panel de notificaciones:"),
  viñeta("Campana 🔔 en el encabezado: muestra el número de notificaciones sin leer."),
  viñeta("Haga clic en la campana para abrir el panel de notificaciones."),
  viñeta("Tipos: 🔵 INFO (información general) | 🟡 ALERTA (avisos importantes) | 🔴 URGENTE (requiere atención inmediata)."),
  viñeta("Haga clic en \"Marcar todas como leídas\" para limpiar el contador."),

  titulo2("9.2 Visor de Documentos Word"),
  parrafo("El sistema incluye un visor en línea para archivos Word entregados en tareas. Los docentes pueden hacer clic en \"📄 Ver documento\" para abrir el archivo en una ventana modal dentro del sistema, sin necesidad de descargarlo. Compatible con archivos .docx y .doc. Para cerrar el visor, haga clic en ✕ o fuera del modal."),

  titulo2("9.3 Mensajes de Confirmación"),
  parrafo("El sistema muestra mensajes emergentes en la esquina inferior derecha:"),
  espacio(),
  tablaCeldas(
    ["Tipo", "Color", "Ejemplo"],
    [
      ["✅ Éxito",      "Verde",  "Tarea entregada exitosamente"],
      ["❌ Error",      "Rojo",   "El archivo supera el límite de 5 MB"],
      ["⚠️ Advertencia","Naranja","El plazo de entrega venció"],
    ],
    [20, 20, 60]
  ),
  lineaDivisora(),

  // ── 10. Preguntas Frecuentes
  titulo1("10. Preguntas Frecuentes"),

  titulo3("¿Qué hago si olvidé mi contraseña?"),
  parrafo("Contacte al Jefe de Estudios o Administrador del sistema para que restablezca su contraseña."),

  titulo3("¿Por qué aparece un mensaje de bloqueo financiero al ingresar?"),
  parrafo("Tiene pagos en estado MORA (vencidos). Regularice su situación con el departamento de finanzas para recuperar el acceso completo."),

  titulo3("¿Puedo entregar una tarea después de la fecha límite?"),
  parrafo("No. El sistema bloquea automáticamente la entrega una vez que la fecha límite ha expirado."),

  titulo3("¿Qué formatos acepta el sistema para las tareas?"),
  parrafo("Solo archivos Word: .doc y .docx. El tamaño máximo permitido es 5 MB."),

  titulo3("¿Por qué mis notas aparecen bloqueadas (🔒)?"),
  parrafo("El docente confirmó y bloqueó sus notas. Una vez bloqueadas, solo el Administrador puede modificarlas."),

  titulo3("¿Cuál es el porcentaje de asistencia mínimo requerido?"),
  parrafo("El mínimo requerido es del 75%. Por debajo de ese porcentaje, el sistema muestra una advertencia."),

  titulo3("¿Las evaluaciones institucionales son anónimas?"),
  parrafo("Sí. El sistema no revela al evaluado quién realizó cada evaluación específica."),

  titulo3("¿Puedo imprimir mi comprobante de pago?"),
  parrafo("Sí. Desde el módulo de Pagos, haga clic en el ícono de comprobante del concepto pagado y use la función de impresión de su navegador."),

  espacio(),
  espacio(),
  new Paragraph({
    children: [new TextRun({
      text: "Manual elaborado para uso interno de la EAEN \"Avaroa\" — Sistema SISEAEN v1.0 — 19 de abril de 2026",
      italics: true, size: 18, font: "Calibri", color: "888888",
    })],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: "cccccc" } },
    spacing: { before: 200 },
  }),
];

// ── Estilos ────────────────────────────────────────────────

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 36, bold: true, color: AZUL_OSCURO, font: "Calibri" },
        paragraph: {
          spacing: { before: 400, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: AZUL_OSCURO } },
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 28, bold: true, color: AZUL_MEDIO, font: "Calibri" },
        paragraph: { spacing: { before: 320, after: 160 } },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 24, bold: true, color: "333333", font: "Calibri" },
        paragraph: { spacing: { before: 240, after: 100 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "SISEAEN — Manual de Usuario", size: 18, font: "Calibri", color: "888888" }),
              new TextRun({ text: "   |   Escuela de Altos Estudios Nacionales \"Avaroa\"", size: 18, font: "Calibri", color: "aaaaaa" }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "dddddd" } },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Página ", size: 18, font: "Calibri", color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Calibri", color: "888888" }),
              new TextRun({ text: " de ", size: 18, font: "Calibri", color: "888888" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Calibri", color: "888888" }),
              new TextRun({ text: "   |   19 de abril de 2026", size: 18, font: "Calibri", color: "aaaaaa" }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "dddddd" } },
          }),
        ],
      }),
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
const outPath = "C:/ChakuySoft/eaen_edu/Manual Usuario/Manual_Usuario_SISEAEN_19042026.docx";
fs.writeFileSync(outPath, buffer);
console.log("✅ Manual generado: Manual_Usuario_SISEAEN_19042026.docx");
