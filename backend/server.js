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
      email, // por si envías email además de correo
      tipo_usuario, // opcional si ya lo incluyes en Addusers luego
    } = req.body;

    // Validación mínima (ajustada a tu formulario actual)
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

    // apellido "legacy"
    const apellido = `${ap_paterno} ${ap_materno}`.trim();

    // password (si no mandas, por defecto CI)
    const plainPass = String(password ?? ci);
    const passwordHash = await bcrypt.hash(plainPass, 10);

    // email: usamos correo como base si no mandan email
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
 * Devuelve SOLO campos válidos de la tabla para edición.
 * Coincidencia exacta con ci.
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
 * Actualiza datos por CI (coincidencia exacta).
 * NO toca password.
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
      // opcionales:
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
