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
        u.nombre AS jefe_nombre,
        u.ap_paterno AS jefe_ap_paterno,
        u.ap_materno AS jefe_ap_materno,
        u.ci AS jefe_ci,
        u.ex AS jefe_ex,
        u.tipo_usuario AS jefe_tipo_usuario,
        (
          SELECT COUNT(*)
          FROM curso_participantes cp
          WHERE cp.curso_id = c.id
        ) AS participantes_total
      FROM cursos c
      LEFT JOIN usuarios u ON u.id = c.jefe_curso_id
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
