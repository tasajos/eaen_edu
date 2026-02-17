import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Pool MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eaen_educacion",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});
function normEstado(v) {
  const s = String(v || "").trim().toUpperCase();
  // tu enum parece "ACTIVO"/"INACTIVO"
  if (s === "ACTIVO") return "ACTIVO";
  if (s === "INACTIVO") return "INACTIVO";
  // compat por si en frontend llega "Activo"
  if (s === "ACTIVO" || s === "ACTIVO ") return "ACTIVO";
  if (s === "ACTIVO".toUpperCase()) return "ACTIVO";
  return s || "ACTIVO";
}

const ROLES_RESP = new Set([
  "ENCARGADO_CURSO",
  "PERSONAL_APOYO",
  "FACILITADOR",
  "DOCENTE",
  "JEFE_CURSO", // este rol se manejará actualizando cursos.jefe_curso_id
]);

const ROLES_SINGLE = new Set([
  "ENCARGADO_CURSO",
  "JEFE_CURSO", // único (columna en cursos)
]);

const isEncargadoCurso = (r) => String(r || "").trim() === "Encargado de Curso";


function normRol(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

async function assertCursoExists(connOrPool, cursoId) {
  const [rows] = await connOrPool.execute(
    `SELECT id, jefe_curso_id FROM cursos WHERE id = ? LIMIT 1`,
    [cursoId]
  );
  if (!rows.length) return null;
  return rows[0];
}

async function assertNoCursanteActivo(connOrPool, usuarioId) {
  const [uRows] = await connOrPool.execute(
    `SELECT id, estado, tipo_usuario FROM usuarios WHERE id = ? LIMIT 1`,
    [usuarioId]
  );
  if (!uRows.length) return { ok: false, code: 404, msg: "Usuario no existe" };

  const u = uRows[0];
  if (String(u.estado).toUpperCase() !== "ACTIVO") {
    return { ok: false, code: 400, msg: "El usuario debe estar ACTIVO" };
  }
  if (String(u.tipo_usuario || "").trim() === "Cursante") {
    return { ok: false, code: 400, msg: "El usuario no puede ser Cursante" };
  }
  return { ok: true };
}


async function assertUsuarioActivo(connOrPool, usuarioId) {
  const [rows] = await connOrPool.execute(
    `SELECT id, estado, tipo_usuario FROM usuarios WHERE id = ? LIMIT 1`,
    [usuarioId]
  );
  if (!rows.length) return { ok: false, code: 404, msg: "Usuario no existe" };

  const u = rows[0];
  if (String(u.estado).toUpperCase() !== "ACTIVO") {
    return { ok: false, code: 400, msg: "El usuario debe estar ACTIVO" };
  }
  return { ok: true, user: u };
}

async function assertCursanteInscritoEnCurso(connOrPool, cursoId, usuarioId) {
  // 1) usuario ACTIVO y cursante
  const uok = await assertUsuarioActivo(connOrPool, usuarioId);
  if (!uok.ok) return uok;

  if (String(uok.user.tipo_usuario || "").trim() !== "Cursante") {
    return { ok: false, code: 400, msg: "El encargado debe ser un Cursante" };
  }

  // 2) debe estar inscrito en el curso
  const [rows] = await connOrPool.execute(
    `SELECT 1 AS ok FROM curso_participantes WHERE curso_id = ? AND usuario_id = ? LIMIT 1`,
    [cursoId, usuarioId]
  );

  if (!rows.length) {
    return { ok: false, code: 400, msg: "El encargado debe ser un cursante inscrito en este curso" };
  }

  return { ok: true };
}




// Health
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * =========================
 * USUARIOS (SIN PASSWORD)
 * =========================
 */

/**
 * GET /api/usuarios
 * Lista usuarios con todos los campos NO sensibles (SIN password)
 */
app.get("/api/usuarios", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        nombre,
        apellido,
        grado,
        ap_paterno,
        ap_materno,
        ci,
        ex,
        filial,
        fuerza,
        turno,
        telefono,
        fecha_inscripcion,
        lugar_trabajo,
        correo,
        email,
        rol,
        estado,
        tipo_usuario,
        fecha_nacimiento,
        creado_en
      FROM usuarios
      ORDER BY creado_en DESC, id DESC
    `;
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * GET /api/usuarios/cursantes-activos
 * Lista SOLO usuarios ACTIVO + tipo_usuario = Cursante
 */
app.get("/api/usuarios/cursantes-activos", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        nombre,
        apellido,
        ap_paterno,
        ap_materno,
        ci,
        ex,
        correo,
        email,
        tipo_usuario,
        estado
      FROM usuarios
      WHERE estado = 'ACTIVO'
        AND tipo_usuario = 'Cursante'
      ORDER BY ap_paterno ASC, ap_materno ASC, nombre ASC
    `;
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * GET /api/usuarios/jefes-curso
 * Lista usuarios ACTIVO + tipo_usuario <> Cursante
 */
app.get("/api/usuarios/jefes-curso", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        nombre,
        apellido,
        ap_paterno,
        ap_materno,
        ci,
        ex,
        correo,
        email,
        tipo_usuario,
        estado
      FROM usuarios
      WHERE estado = 'ACTIVO'
        AND (tipo_usuario IS NULL OR tipo_usuario <> 'Cursante')
      ORDER BY ap_paterno ASC, ap_materno ASC, nombre ASC
    `;
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * POST /api/usuarios
 * Crea usuario con los campos del formulario.
 */
app.post("/api/usuarios", async (req, res) => {
  try {
    const {
      grado,
      ap_paterno,
      ap_materno,
      nombre,
      ci,
      ex,
      filial,
      fuerza,
      turno,
      telefono,
      fecha_inscripcion,
      lugar_trabajo,
      correo,
      fecha_nacimiento,
      // opcionales:
      rol,
      estado,
      password,
      email,
      tipo_usuario,
    } = req.body;

    const required = {
      grado,
      ap_paterno,
      ap_materno,
      nombre,
      ci,
      ex,
      filial,
      fuerza,
      turno,
      telefono,
      fecha_inscripcion,
      lugar_trabajo,
      correo,
      fecha_nacimiento,
    };

    for (const [k, v] of Object.entries(required)) {
      if (String(v ?? "").trim().length === 0) {
        return res.status(400).json({ message: `Campo requerido: ${k}` });
      }
    }

    const apellido = `${ap_paterno} ${ap_materno}`.trim();

    const plainPass = String(password ?? ci);
    const passwordHash = await bcrypt.hash(plainPass, 10);

    const finalEmail = String(email ?? correo).trim();

    const sql = `
      INSERT INTO usuarios
      (nombre, apellido, grado, ap_paterno, ap_materno, ci, ex, filial, fuerza, turno, telefono, fecha_inscripcion, lugar_trabajo, correo, email, password, rol, estado, tipo_usuario, fecha_nacimiento)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nombre,
      apellido,
      grado,
      ap_paterno,
      ap_materno,
      ci,
      ex,
      filial,
      fuerza,
      turno,
      telefono,
      fecha_inscripcion,
      lugar_trabajo,
      correo,
      finalEmail,
      passwordHash,
      rol ?? "ADMIN",
      estado ?? "ACTIVO",
      tipo_usuario ?? null,
      fecha_nacimiento,
    ];

    const [result] = await pool.execute(sql, params);

    return res.status(201).json({
      message: "Usuario creado",
      id: result.insertId,
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ya existe un usuario con ese CI o correo/email." });
    }
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * GET /api/usuarios/ci/:ci
 * Devuelve campos válidos de la tabla para edición (exact match).
 */
app.get("/api/usuarios/ci/:ci", async (req, res) => {
  try {
    const ci = String(req.params.ci || "").trim();
    if (!ci) return res.status(400).json({ message: "CI requerido" });

    const sql = `
      SELECT
        id,
        nombre,
        apellido,
        grado,
        ap_paterno,
        ap_materno,
        ci,
        ex,
        filial,
        fuerza,
        turno,
        telefono,
        fecha_inscripcion,
        lugar_trabajo,
        correo,
        email,
        rol,
        estado,
        tipo_usuario,
        fecha_nacimiento,
        creado_en
      FROM usuarios
      WHERE ci = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [ci]);

    if (!rows.length) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * PUT /api/usuarios/ci/:ci
 * Actualiza datos por CI (exact match). NO toca password.
 */
app.put("/api/usuarios/ci/:ci", async (req, res) => {
  try {
    const ci = String(req.params.ci || "").trim();
    if (!ci) return res.status(400).json({ message: "CI requerido" });

    const {
      tipo_usuario,
      grado,
      ap_paterno,
      ap_materno,
      nombre,
      ex,
      filial,
      fuerza,
      turno,
      telefono,
      fecha_inscripcion,
      lugar_trabajo,
      correo,
      fecha_nacimiento,
      email,
      rol,
      estado,
    } = req.body;

    const required = {
      tipo_usuario,
      grado,
      ap_paterno,
      ap_materno,
      nombre,
      ex,
      filial,
      fuerza,
      turno,
      telefono,
      fecha_inscripcion,
      lugar_trabajo,
      correo,
      fecha_nacimiento,
    };

    for (const [k, v] of Object.entries(required)) {
      if (String(v ?? "").trim().length === 0) {
        return res.status(400).json({ message: `Campo requerido: ${k}` });
      }
    }

    const apellido = `${ap_paterno} ${ap_materno}`.trim();

    const sql = `
      UPDATE usuarios
      SET
        tipo_usuario = ?,
        grado = ?,
        ap_paterno = ?,
        ap_materno = ?,
        nombre = ?,
        apellido = ?,
        ex = ?,
        filial = ?,
        fuerza = ?,
        turno = ?,
        telefono = ?,
        fecha_inscripcion = ?,
        lugar_trabajo = ?,
        correo = ?,
        fecha_nacimiento = ?,
        email = COALESCE(?, email),
        rol = COALESCE(?, rol),
        estado = COALESCE(?, estado)
      WHERE ci = ?
      LIMIT 1
    `;

    const params = [
      tipo_usuario,
      grado,
      ap_paterno,
      ap_materno,
      nombre,
      apellido,
      ex,
      filial,
      fuerza,
      turno,
      telefono,
      fecha_inscripcion,
      lugar_trabajo,
      correo,
      fecha_nacimiento,
      email ?? null,
      rol ?? null,
      estado ?? null,
      ci,
    ];

    const [result] = await pool.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({ message: "Usuario actualizado" });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Correo o email ya existe en otro usuario." });
    }
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * =========================
 * CURSOS
 * =========================
 */

/**
 * POST /api/cursos
 * Crea un curso + asigna participantes (solo cursantes activos).
 *
 * body:
 * {
 *   programa_id: 1 (opcional),
 *   nombre: "Curso X",
 *   descripcion: "...",
 *   jefe_curso_id: 10,
 *   fecha_inicio: "2026-02-01",
 *   fecha_fin: "2026-02-10",
 *   modalidad: "Presencial",
 *   horas_academicas: 120,
 *   participantes_ids: [5,6,7]
 * }
 */
app.post("/api/cursos", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      programa_id,
      nombre,
      descripcion,
      jefe_curso_id,
      fecha_inicio,
      fecha_fin,
      modalidad,
      horas_academicas,
      participantes_ids,
    } = req.body;

    // Validación mínima
    if (!String(nombre ?? "").trim()) {
      return res.status(400).json({ message: "Campo requerido: nombre" });
    }
    if (!jefe_curso_id) {
      return res.status(400).json({ message: "Campo requerido: jefe_curso_id" });
    }
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: "Campos requeridos: fecha_inicio, fecha_fin" });
    }
    if (fecha_fin < fecha_inicio) {
      return res.status(400).json({ message: "fecha_fin no puede ser menor a fecha_inicio" });
    }
    if (!Array.isArray(participantes_ids) || participantes_ids.length === 0) {
      return res.status(400).json({ message: "Debe enviar participantes_ids (mínimo 1)" });
    }

    await conn.beginTransaction();

    // 1) Validar jefe: ACTIVO y no cursante
    {
      const [jefeRows] = await conn.execute(
        `
        SELECT id, tipo_usuario, estado
        FROM usuarios
        WHERE id = ?
        LIMIT 1
        `,
        [jefe_curso_id]
      );

      if (!jefeRows.length) {
        await conn.rollback();
        return res.status(404).json({ message: "Jefe de curso no existe" });
      }

      const jefe = jefeRows[0];
      if (String(jefe.estado).toUpperCase() !== "ACTIVO") {
        await conn.rollback();
        return res.status(400).json({ message: "El jefe de curso debe estar ACTIVO" });
      }
      if (String(jefe.tipo_usuario || "").trim() === "Cursante") {
        await conn.rollback();
        return res.status(400).json({ message: "El jefe de curso no puede ser Cursante" });
      }
    }

    // 2) Validar participantes: deben existir, ACTIVO y tipo_usuario=Cursante
    //    y que el set sea exacto (sin ids inválidos)
    const ids = [...new Set(participantes_ids.map((x) => Number(x)).filter(Boolean))];
    if (ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "participantes_ids inválido" });
    }

    const placeholders = ids.map(() => "?").join(",");
    const [partRows] = await conn.execute(
      `
      SELECT id, estado, tipo_usuario
      FROM usuarios
      WHERE id IN (${placeholders})
      `,
      ids
    );

    if (partRows.length !== ids.length) {
      await conn.rollback();
      return res.status(400).json({ message: "Uno o más participantes no existen" });
    }

    const invalid = partRows.find(
      (u) => String(u.estado).toUpperCase() !== "ACTIVO" || String(u.tipo_usuario) !== "Cursante"
    );
    if (invalid) {
      await conn.rollback();
      return res.status(400).json({
        message: "Todos los participantes deben ser ACTIVO y tipo_usuario = Cursante",
      });
    }

    // 3) Insert curso
    const insertCursoSql = `
      INSERT INTO cursos
        (programa_id, nombre, descripcion, docente_id, jefe_curso_id, fecha_inicio, fecha_fin, modalidad, horas_academicas, estado)
      VALUES
        (?, ?, ?, NULL, ?, ?, ?, ?, ?, 'ACTIVO')
    `;

    const [cursoResult] = await conn.execute(insertCursoSql, [
      programa_id ?? null,
      String(nombre).trim(),
      String(descripcion ?? "").trim() || null,
      jefe_curso_id,
      fecha_inicio,
      fecha_fin,
      String(modalidad ?? "").trim() || null,
      Number.isFinite(Number(horas_academicas)) ? Number(horas_academicas) : null,
    ]);

    const cursoId = cursoResult.insertId;

    // 4) Insert tabla puente
    const values = ids.map(() => "(?, ?)").join(",");
    const params = ids.flatMap((uid) => [cursoId, uid]);

    await conn.execute(
      `
      INSERT INTO curso_participantes (curso_id, usuario_id)
      VALUES ${values}
      `,
      params
    );

    await conn.commit();

    return res.status(201).json({
      message: "Curso creado",
      id: cursoId,
      participantes: ids.length,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    // duplicado uq_curso_usuario puede aparecer si reintentas
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Participante duplicado en el curso (uq_curso_usuario)." });
    }
    return res.status(500).json({ message: "Error interno", detail: err.message });
  } finally {
    conn.release();
  }
});

/**
 * GET /api/cursos
 * Lista cursos (sin campos sensibles) + jefe + cantidad participantes
 */
app.get("/api/cursos", async (req, res) => {
  try {
    const sql = `
  SELECT
    c.id,
    c.programa_id,
    c.nombre,
    c.descripcion,
    c.jefe_curso_id,
    c.fecha_inicio,
    c.fecha_fin,
    c.modalidad,
    c.horas_academicas,
    c.estado,
    c.creado_en,

    -- JEFE DE CURSO (desde cursos.jefe_curso_id)
    uj.nombre AS jefe_nombre,
    uj.ap_paterno AS jefe_ap_paterno,
    uj.ap_materno AS jefe_ap_materno,
    uj.ci AS jefe_ci,
    uj.ex AS jefe_ex,
    uj.tipo_usuario AS jefe_tipo_usuario,

    -- ENCARGADO DE CURSO (desde curso_responsabilidades rol=ENCARGADO_CURSO)
    ue.id AS encargado_id,
    ue.nombre AS encargado_nombre,
    ue.ap_paterno AS encargado_ap_paterno,
    ue.ap_materno AS encargado_ap_materno,
    ue.ci AS encargado_ci,
    ue.ex AS encargado_ex,
    ue.tipo_usuario AS encargado_tipo_usuario,

    -- CANTIDAD DE REGISTROS (participantes inscritos)
    (
      SELECT COUNT(*)
      FROM curso_participantes cp
      WHERE cp.curso_id = c.id
    ) AS participantes_total

  FROM cursos c

  -- Join jefe
  LEFT JOIN usuarios uj ON uj.id = c.jefe_curso_id

  -- Traer encargado: como es SINGLE por curso, tomamos 1 registro
  LEFT JOIN curso_responsabilidades cr_enc
    ON cr_enc.curso_id = c.id
   AND cr_enc.rol = 'ENCARGADO_CURSO'

  LEFT JOIN usuarios ue ON ue.id = cr_enc.usuario_id

  ORDER BY c.creado_en DESC, c.id DESC
`;
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * GET /api/cursos/:id
 * Detalle del curso + lista participantes (sin password)
 */
app.get("/api/cursos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "ID inválido" });

    const [cursoRows] = await pool.execute(
      `
      SELECT
        c.id,
        c.programa_id,
        c.nombre,
        c.descripcion,
        c.jefe_curso_id,
        c.fecha_inicio,
        c.fecha_fin,
        c.modalidad,
        c.horas_academicas,
        c.estado,
        c.creado_en,
        u.nombre AS jefe_nombre,
        u.ap_paterno AS jefe_ap_paterno,
        u.ap_materno AS jefe_ap_materno,
        u.ci AS jefe_ci,
        u.ex AS jefe_ex,
        u.tipo_usuario AS jefe_tipo_usuario
      FROM cursos c
      LEFT JOIN usuarios u ON u.id = c.jefe_curso_id
      WHERE c.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!cursoRows.length) return res.status(404).json({ message: "Curso no encontrado" });

    const [partRows] = await pool.execute(
      `
      SELECT
        u.id,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.ci,
        u.ex,
        u.correo,
        u.email,
        u.tipo_usuario,
        u.estado
      FROM curso_participantes cp
      INNER JOIN usuarios u ON u.id = cp.usuario_id
      WHERE cp.curso_id = ?
      ORDER BY u.ap_paterno ASC, u.ap_materno ASC, u.nombre ASC
      `,
      [id]
    );

    return res.json({
      ...cursoRows[0],
      participantes: partRows,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

app.post("/api/cursos/:id/participantes", async (req, res) => {
  try {
    const cursoId = Number(req.params.id);
    const { participantes_ids } = req.body;

    if (!cursoId) return res.status(400).json({ message: "ID de curso inválido" });
    if (!Array.isArray(participantes_ids) || participantes_ids.length === 0) {
      return res.status(400).json({ message: "Debe enviar participantes_ids (mínimo 1)" });
    }

    // validar curso
    const [cRows] = await pool.execute(`SELECT id FROM cursos WHERE id = ? LIMIT 1`, [cursoId]);
    if (!cRows.length) return res.status(404).json({ message: "Curso no encontrado" });

    // normalizar ids
    const ids = [...new Set(participantes_ids.map((x) => Number(x)).filter(Boolean))];
    if (!ids.length) return res.status(400).json({ message: "participantes_ids inválido" });

    // validar que existan y sean cursante activo
    const placeholders = ids.map(() => "?").join(",");
    const [uRows] = await pool.execute(
      `
      SELECT id, estado, tipo_usuario
      FROM usuarios
      WHERE id IN (${placeholders})
      `,
      ids
    );

    if (uRows.length !== ids.length) {
      return res.status(400).json({ message: "Uno o más participantes no existen" });
    }

    const invalid = uRows.find(
      (u) => String(u.estado).toUpperCase() !== "ACTIVO" || String(u.tipo_usuario) !== "Cursante"
    );
    if (invalid) {
      return res.status(400).json({
        message: "Todos los participantes deben ser ACTIVO y tipo_usuario = Cursante",
      });
    }

    // insertar en tabla puente (usa UNIQUE uq_curso_usuario si la agregaste)
    // si NO tienes el unique, esto igual inserta pero permitiría duplicados.
    const values = ids.map(() => "(?, ?)").join(",");
    const params = ids.flatMap((uid) => [cursoId, uid]);

    // si tienes uq_curso_usuario, evita error usando ON DUPLICATE:
    const sql = `
      INSERT INTO curso_participantes (curso_id, usuario_id)
      VALUES ${values}
      ON DUPLICATE KEY UPDATE curso_id = curso_id
    `;

    const [result] = await pool.execute(sql, params);

    return res.json({
      message: "Participantes añadidos",
      curso_id: cursoId,
      recibidos: ids.length,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Participante duplicado en el curso." });
    }
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * DELETE /api/cursos/:id/participantes
 * Quita participantes de un curso existente.
 * body: { participantes_ids: [1,2,3] }
 */
app.delete("/api/cursos/:id/participantes", async (req, res) => {
  try {
    const cursoId = Number(req.params.id);
    const { participantes_ids } = req.body;

    if (!cursoId) return res.status(400).json({ message: "ID de curso inválido" });
    if (!Array.isArray(participantes_ids) || participantes_ids.length === 0) {
      return res.status(400).json({ message: "Debe enviar participantes_ids (mínimo 1)" });
    }

    const ids = [...new Set(participantes_ids.map((x) => Number(x)).filter(Boolean))];
    if (!ids.length) return res.status(400).json({ message: "participantes_ids inválido" });

    const placeholders = ids.map(() => "?").join(",");
    const sql = `DELETE FROM curso_participantes WHERE curso_id = ? AND usuario_id IN (${placeholders})`;

    const [result] = await pool.execute(sql, [cursoId, ...ids]);

    return res.json({
      message: "Participantes eliminados",
      curso_id: cursoId,
      removed: result.affectedRows,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * GET /api/cursos/:id/responsabilidades
 * Devuelve:
 * - jefe_curso (desde cursos.jefe_curso_id)
 * - otras responsabilidades (desde curso_responsabilidades)
 */
app.get("/api/cursos/:id/responsabilidades", async (req, res) => {
  try {
    const cursoId = Number(req.params.id);
    if (!cursoId) return res.status(400).json({ message: "ID de curso inválido" });

    const curso = await assertCursoExists(pool, cursoId);
    if (!curso) return res.status(404).json({ message: "Curso no encontrado" });

    // jefe de curso (columna cursos.jefe_curso_id)
    const [jefeRows] = await pool.execute(
      `
      SELECT
        u.id, u.nombre, u.ap_paterno, u.ap_materno, u.ci, u.ex, u.correo, u.email, u.tipo_usuario, u.estado
      FROM usuarios u
      WHERE u.id = ?
      LIMIT 1
      `,
      [curso.jefe_curso_id]
    );

    // otras responsabilidades (tabla nueva)
    const [rows] = await pool.execute(
      `
      SELECT
        cr.id,
        cr.rol,
        cr.usuario_id,
        cr.creado_en,
        u.nombre, u.ap_paterno, u.ap_materno, u.ci, u.ex, u.correo, u.email, u.tipo_usuario, u.estado
      FROM curso_responsabilidades cr
      INNER JOIN usuarios u ON u.id = cr.usuario_id
      WHERE cr.curso_id = ?
      ORDER BY cr.rol ASC, u.ap_paterno ASC, u.ap_materno ASC, u.nombre ASC
      `,
      [cursoId]
    );

    return res.json({
      curso_id: cursoId,
      jefe_curso: jefeRows.length ? { rol: "JEFE_CURSO", ...jefeRows[0] } : null,
      responsabilidades: rows,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

/**
 * POST /api/cursos/:id/responsabilidades
 *
 * body ejemplo (multi):
 * { rol: "DOCENTE", usuarios_ids: [10,11] }
 *
 * body ejemplo (single):
 * { rol: "ENCARGADO_CURSO", usuario_id: 12 }
 *
 * body ejemplo (jefe):
 * { rol: "JEFE_CURSO", usuario_id: 9 }
 */
app.post("/api/cursos/:id/responsabilidades", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const cursoId = Number(req.params.id);
    if (!cursoId) return res.status(400).json({ message: "ID de curso inválido" });

    let { rol, usuario_id, usuarios_ids } = req.body;
    rol = normRol(rol);

    if (!ROLES_RESP.has(rol)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    await conn.beginTransaction();

    const curso = await assertCursoExists(conn, cursoId);
    if (!curso) {
      await conn.rollback();
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    // ===== JEFE_CURSO (se guarda en cursos.jefe_curso_id) =====
    if (rol === "JEFE_CURSO") {
      const uid = Number(usuario_id);
      if (!uid) {
        await conn.rollback();
        return res.status(400).json({ message: "Campo requerido: usuario_id" });
      }

      const ok = await assertNoCursanteActivo(conn, uid);
      if (!ok.ok) {
        await conn.rollback();
        return res.status(ok.code).json({ message: ok.msg });
      }

      await conn.execute(
        `UPDATE cursos SET jefe_curso_id = ? WHERE id = ? LIMIT 1`,
        [uid, cursoId]
      );

      await conn.commit();
      return res.json({ message: "Jefe de curso asignado", curso_id: cursoId, rol });
    }

    // ===== ENCARGADO_CURSO (single en tabla curso_responsabilidades) =====
    // ===== ROLES_SINGLE (ENCARGADO_CURSO) =====
if (ROLES_SINGLE.has(rol)) {
  const uid = Number(usuario_id);
  if (!uid) {
    await conn.rollback();
    return res.status(400).json({ message: "Campo requerido: usuario_id" });
  }

  // ✅ CAMBIO: si es ENCARGADO_CURSO, permitir cursante INSCRITO en el curso
  if (rol === "ENCARGADO_CURSO") {
    const ok = await assertCursanteInscritoEnCurso(conn, cursoId, uid);
    if (!ok.ok) {
      await conn.rollback();
      return res.status(ok.code).json({ message: ok.msg });
    }
  } else {
    // (por si luego agregas otro single)
    const ok = await assertNoCursanteActivo(conn, uid);
    if (!ok.ok) {
      await conn.rollback();
      return res.status(ok.code).json({ message: ok.msg });
    }
  }

  // Garantizar 1 encargado por curso: borramos el anterior del mismo rol
  await conn.execute(
    `DELETE FROM curso_responsabilidades WHERE curso_id = ? AND rol = ?`,
    [cursoId, rol]
  );

  await conn.execute(
    `INSERT INTO curso_responsabilidades (curso_id, usuario_id, rol) VALUES (?, ?, ?)`,
    [cursoId, uid, rol]
  );

  await conn.commit();
  return res.json({
    message: "Responsabilidad asignada",
    curso_id: cursoId,
    rol,
    usuario_id: uid,
  });
}


    // ===== ROLES MULTI (DOCENTE/FACILITADOR/PERSONAL_APOYO) =====
    if (!Array.isArray(usuarios_ids) || usuarios_ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Debe enviar usuarios_ids (mínimo 1)" });
    }

    const ids = [...new Set(usuarios_ids.map((x) => Number(x)).filter(Boolean))];
    if (!ids.length) {
      await conn.rollback();
      return res.status(400).json({ message: "usuarios_ids inválido" });
    }

    // Validar todos: activo + no cursante
    for (const uid of ids) {
      const ok = await assertNoCursanteActivo(conn, uid);
      if (!ok.ok) {
        await conn.rollback();
        return res.status(ok.code).json({ message: ok.msg, usuario_id: uid });
      }
    }

    // Insert masivo evitando duplicados por UNIQUE uq_curso_usuario_rol
    const values = ids.map(() => "(?, ?, ?)").join(",");
    const params = ids.flatMap((uid) => [cursoId, uid, rol]);

    const sql = `
      INSERT INTO curso_responsabilidades (curso_id, usuario_id, rol)
      VALUES ${values}
      ON DUPLICATE KEY UPDATE rol = rol
    `;

    const [result] = await conn.execute(sql, params);

    await conn.commit();
    return res.json({
      message: "Responsabilidades asignadas",
      curso_id: cursoId,
      rol,
      recibidos: ids.length,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    return res.status(500).json({ message: "Error interno", detail: err.message });
  } finally {
    conn.release();
  }
});

/**
 * DELETE /api/cursos/:id/responsabilidades
 *
 * body ejemplo (multi):
 * { rol: "DOCENTE", usuarios_ids: [10,11] }
 *
 * body ejemplo (single):
 * { rol: "ENCARGADO_CURSO", usuario_id: 12 }
 *
 * body ejemplo (quitar jefe):
 * { rol: "JEFE_CURSO" }
 */
app.delete("/api/cursos/:id/responsabilidades", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const cursoId = Number(req.params.id);
    if (!cursoId) return res.status(400).json({ message: "ID de curso inválido" });

    let { rol, usuario_id, usuarios_ids } = req.body;
    rol = normRol(rol);

    if (!ROLES_RESP.has(rol)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    await conn.beginTransaction();

    const curso = await assertCursoExists(conn, cursoId);
    if (!curso) {
      await conn.rollback();
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    // JEFE_CURSO (columna)
    if (rol === "JEFE_CURSO") {
      await conn.execute(`UPDATE cursos SET jefe_curso_id = NULL WHERE id = ? LIMIT 1`, [cursoId]);
      await conn.commit();
      return res.json({ message: "Jefe de curso removido", curso_id: cursoId, rol });
    }

    // normalizar ids
    let ids = [];
    if (usuario_id) ids = [Number(usuario_id)];
    else if (Array.isArray(usuarios_ids)) ids = usuarios_ids.map((x) => Number(x)).filter(Boolean);

    ids = [...new Set(ids)].filter(Boolean);

    if (!ids.length) {
      await conn.rollback();
      return res.status(400).json({ message: "Debe enviar usuario_id o usuarios_ids" });
    }

    const placeholders = ids.map(() => "?").join(",");
    const sql = `
      DELETE FROM curso_responsabilidades
      WHERE curso_id = ? AND rol = ? AND usuario_id IN (${placeholders})
    `;

    const [result] = await conn.execute(sql, [cursoId, rol, ...ids]);

    await conn.commit();
    return res.json({
      message: "Responsabilidades eliminadas",
      curso_id: cursoId,
      rol,
      removed: result.affectedRows,
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    return res.status(500).json({ message: "Error interno", detail: err.message });
  } finally {
    conn.release();
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
