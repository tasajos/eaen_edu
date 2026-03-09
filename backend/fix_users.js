/**
 * fix_users.js — Ejecutar UNA VEZ en la carpeta del backend
 * Comando: node fix_users.js
 *
 * Lo que hace:
 * 1. Lee todos los usuarios de la BD
 * 2. Para cada usuario, si el password NO es bcrypt ($2b$),
 *    lo hashea y actualiza
 * 3. Fija roles correctos según tipo_usuario y CI
 */

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "eaen_educacion",
  port:     Number(process.env.DB_PORT || 3306),
});

// ─── Configuración de roles por CI ───────────────────────
// Edita esta lista según tu institución.
// Los que no están aquí se dejan como ADMIN o se auto-detectan.
const ROLES_POR_CI = {
  // "CI":  { rol, tipo_usuario }
  "4947021": { rol: "JEFE_ESTUDIOS", tipo_usuario: null },   // Carlos Azcarraga
  "4947022": { rol: "DOCENTE",       tipo_usuario: null },   // Pablo Azcarraga
  "4314966": { rol: "DOCENTE",       tipo_usuario: null },   // Edgar Diaz
  "3450202": { rol: "JEFE_CURSO",    tipo_usuario: null },   // Nielsen Fernandez
  "4283060": { rol: "CURSANTE",      tipo_usuario: "Cursante" }, // Tommy Buezo
  "3808543": { rol: "CURSANTE",      tipo_usuario: "Cursante" }, // Jose Quiroz
  "4794001": { rol: "CURSANTE",      tipo_usuario: "Cursante" }, // Pedro Galvez
  "71733969":{ rol: "CURSANTE",      tipo_usuario: "Cursante" }, // Pedro Galvez 2
};

async function main() {
  console.log("🔧 Iniciando corrección de usuarios...\n");

  // Primero, actualizar el ENUM del campo rol para soportar todos los roles
  try {
    await pool.execute(`
      ALTER TABLE usuarios
      MODIFY COLUMN rol ENUM('ADMIN','JEFE_ESTUDIOS','DOCENTE','JEFE_CURSO','CURSANTE')
      NOT NULL DEFAULT 'ADMIN'
    `);
    console.log("✅ ENUM de roles actualizado");
  } catch (e) {
    console.log("ℹ️  ENUM ya estaba actualizado o no necesita cambio:", e.message);
  }

  // Leer todos los usuarios
  const [usuarios] = await pool.query(
    "SELECT id, nombre, ap_paterno, ci, password, rol, tipo_usuario, estado FROM usuarios"
  );

  console.log(`📋 ${usuarios.length} usuarios encontrados\n`);

  let actualizados = 0;

  for (const u of usuarios) {
    const cambios = {};
    const logs = [];

    // ── 1. Arreglar password si no es bcrypt ──────────────
    const pwd = String(u.password || "");
    if (!pwd.startsWith("$2b$") && !pwd.startsWith("$2a$")) {
      // Es texto plano → hashear. Usamos el CI como contraseña por defecto
      // Si el password actual es válido (no vacío), lo usamos; sino usamos el CI
      const claveOriginal = pwd.trim().length > 0 ? pwd.trim() : String(u.ci || u.id);
      const hash = await bcrypt.hash(claveOriginal, 10);
      cambios.password = hash;
      logs.push(`password "${claveOriginal}" → bcrypt`);
    }

    // ── 2. Arreglar rol y tipo_usuario ────────────────────
    const ciStr = String(u.ci || "").trim();
    if (ciStr && ROLES_POR_CI[ciStr]) {
      const cfg = ROLES_POR_CI[ciStr];
      if (u.rol !== cfg.rol) {
        cambios.rol = cfg.rol;
        logs.push(`rol: ${u.rol} → ${cfg.rol}`);
      }
      if (u.tipo_usuario !== cfg.tipo_usuario) {
        cambios.tipo_usuario = cfg.tipo_usuario;
        logs.push(`tipo_usuario: "${u.tipo_usuario}" → "${cfg.tipo_usuario}"`);
      }
    } else {
      // Auto-detectar por tipo_usuario existente
      if (String(u.tipo_usuario || "").trim() === "Cursante" && u.rol !== "CURSANTE") {
        cambios.rol = "CURSANTE";
        logs.push(`rol auto: ${u.rol} → CURSANTE (por tipo_usuario)`);
      }
    }

    // ── 3. Asegurar estado ACTIVO ─────────────────────────
    if (!u.estado || String(u.estado).toUpperCase() !== "ACTIVO") {
      cambios.estado = "ACTIVO";
      logs.push(`estado → ACTIVO`);
    }

    // ── 4. Aplicar cambios ────────────────────────────────
    if (Object.keys(cambios).length > 0) {
      const sets  = Object.keys(cambios).map(k => `${k}=?`).join(",");
      const vals  = [...Object.values(cambios), u.id];
      await pool.execute(`UPDATE usuarios SET ${sets} WHERE id=? LIMIT 1`, vals);
      console.log(`✏️  [ID ${u.id}] ${u.ap_paterno || ""} ${u.nombre} (CI: ${u.ci})`);
      logs.forEach(l => console.log(`     • ${l}`));
      actualizados++;
    } else {
      console.log(`✓  [ID ${u.id}] ${u.ap_paterno || ""} ${u.nombre} — sin cambios`);
    }
  }

  console.log(`\n✅ Proceso terminado. ${actualizados} usuarios actualizados.`);
  console.log("\n📝 CREDENCIALES DE ACCESO:");
  console.log("   El password de cada usuario es SU PROPIO CI");
  console.log("   (excepto los que ya tenían password diferente)\n");

  // Mostrar resumen
  const [resumen] = await pool.query(
    "SELECT id, nombre, ap_paterno, ci, rol, tipo_usuario, estado FROM usuarios ORDER BY id"
  );
  console.log("ID | Nombre               | CI        | Rol            | Tipo");
  console.log("---|----------------------|-----------|----------------|----------");
  resumen.forEach(u => {
    console.log(
      `${String(u.id).padEnd(3)}| ${(u.ap_paterno+" "+u.nombre).substring(0,20).padEnd(21)}| ${String(u.ci||"").padEnd(10)}| ${String(u.rol||"").padEnd(15)}| ${u.tipo_usuario||""}`
    );
  });

  await pool.end();
}

main().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });