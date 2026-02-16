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
      email, // por si en algún punto envías email además de correo
    } = req.body;

    // Validación mínima (la misma idea que tu frontend)
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

    // apellido "legacy" (si tu tabla lo sigue teniendo)
    const apellido = `${ap_paterno} ${ap_materno}`.trim();

    // password: si no mandas, generamos uno temporal (luego lo cambias con módulo de auth)
    const plainPass = String(password ?? ci); // ejemplo: por defecto el CI
    const passwordHash = await bcrypt.hash(plainPass, 10);

    // email: usamos correo como principal
    const finalEmail = String(email ?? correo).trim();

    const sql = `
      INSERT INTO usuarios
      (nombre, apellido, email, password, rol, estado, grado, ap_paterno, ap_materno, ci, ex, filial, fuerza, turno, telefono, fecha_inscripcion, lugar_trabajo, correo, fecha_nacimiento)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nombre,
      apellido,
      finalEmail,
      passwordHash,
      rol ?? "ADMIN",      // ajusta a tu ENUM real si corresponde
      estado ?? "ACTIVO",
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
      fecha_nacimiento,
    ];

    const [result] = await pool.execute(sql, params);

    return res.status(201).json({
      message: "Usuario creado",
      id: result.insertId,
      // NO devolvemos password
    });
  } catch (err) {
    // Duplicados (uq_ci / uq_email / uq_correo)
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ya existe un usuario con ese CI o correo/email." });
    }
    return res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
