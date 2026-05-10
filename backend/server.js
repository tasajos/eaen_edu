import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuración de uploads ─────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads", "tareas");
try { if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (_) {}

const WORD_MIMETYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const uploadTarea = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (WORD_MIMETYPES.has(file.mimetype) || ext === ".docx" || ext === ".doc") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos Word (.doc / .docx)"));
    }
  },
});

app.use("/api/uploads/tareas", express.static(UPLOADS_DIR));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eaen_educacion",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── Helpers ────────────────────────────────────────────────
const ROLES_RESP   = new Set(["ENCARGADO_CURSO","PERSONAL_APOYO","FACILITADOR","DOCENTE","JEFE_CURSO"]);
const ROLES_SINGLE = new Set(["ENCARGADO_CURSO","JEFE_CURSO"]);

function normRol(v) { return String(v||"").trim().toUpperCase().replace(/\s+/g,"_"); }
function isMissingTableError(e) { return e?.code === "ER_NO_SUCH_TABLE"; }
function isTareaEval(nombre) {
  const value = String(nombre || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /^(tarea|trabajo|practica)$/.test(value);
}

async function assertCursoExists(c, id) {
  const [r] = await c.execute(`SELECT id, jefe_curso_id FROM cursos WHERE id=? LIMIT 1`,[id]);
  return r.length ? r[0] : null;
}
async function assertMateriaExists(c, id) {
  const [r] = await c.execute(`SELECT id, curso_id, nombre, docente_id FROM curso_materias WHERE id=? LIMIT 1`,[id]);
  return r.length ? r[0] : null;
}
async function assertNoCursanteActivo(c, uid) {
  const [r] = await c.execute(`SELECT id,estado,tipo_usuario FROM usuarios WHERE id=? LIMIT 1`,[uid]);
  if (!r.length) return {ok:false,code:404,msg:"Usuario no existe"};
  if (String(r[0].estado).toUpperCase()!=="ACTIVO") return {ok:false,code:400,msg:"El usuario debe estar ACTIVO"};
  if (String(r[0].tipo_usuario||"").trim()==="Cursante") return {ok:false,code:400,msg:"El usuario no puede ser Cursante"};
  return {ok:true};
}
async function assertUsuarioActivo(c, uid) {
  const [r] = await c.execute(`SELECT id,estado,tipo_usuario FROM usuarios WHERE id=? LIMIT 1`,[uid]);
  if (!r.length) return {ok:false,code:404,msg:"Usuario no existe"};
  if (String(r[0].estado).toUpperCase()!=="ACTIVO") return {ok:false,code:400,msg:"El usuario debe estar ACTIVO"};
  return {ok:true,user:r[0]};
}
async function assertCursanteInscrito(c, cursoId, uid) {
  const uok = await assertUsuarioActivo(c, uid);
  if (!uok.ok) return uok;
  if (String(uok.user.tipo_usuario||"").trim()!=="Cursante") return {ok:false,code:400,msg:"El encargado debe ser Cursante"};
  const [r] = await c.execute(`SELECT 1 FROM curso_participantes WHERE curso_id=? AND usuario_id=? LIMIT 1`,[cursoId,uid]);
  if (!r.length) return {ok:false,code:400,msg:"El encargado debe ser cursante inscrito en el curso"};
  return {ok:true};
}

// ════════════════════════════════════════════════════════════
// HEALTH
// ════════════════════════════════════════════════════════════
app.get("/api/health", async (req,res) => {
  try { const [r] = await pool.query("SELECT 1 AS ok"); res.json({status:"ok",db:r[0]}); }
  catch(e) { res.status(500).json({status:"error",message:e.message}); }
});

// ════════════════════════════════════════════════════════════
// USUARIOS
// ════════════════════════════════════════════════════════════
app.get("/api/usuarios", async (req,res) => {
  try {
    const [r] = await pool.query(`SELECT id,nombre,apellido,grado,ap_paterno,ap_materno,ci,ex,filial,fuerza,turno,
      telefono,fecha_inscripcion,lugar_trabajo,correo,email,rol,estado,tipo_usuario,fecha_nacimiento,creado_en
      FROM usuarios ORDER BY creado_en DESC,id DESC`);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.get("/api/usuarios/cursantes-activos", async (req,res) => {
  try {
    const [r] = await pool.query(`SELECT id,nombre,apellido,ap_paterno,ap_materno,ci,ex,correo,email,tipo_usuario,estado
      FROM usuarios WHERE estado='ACTIVO' AND tipo_usuario='Cursante'
      ORDER BY ap_paterno ASC,ap_materno ASC,nombre ASC`);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.get("/api/usuarios/jefes-curso", async (req,res) => {
  try {
    const [r] = await pool.query(`SELECT id,nombre,apellido,ap_paterno,ap_materno,ci,ex,correo,email,tipo_usuario,estado
      FROM usuarios WHERE estado='ACTIVO' AND (tipo_usuario IS NULL OR tipo_usuario<>'Cursante')
      ORDER BY ap_paterno ASC,ap_materno ASC,nombre ASC`);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// Docentes disponibles para asignar a materias (no cursantes, activos)
app.get("/api/usuarios/docentes", async (req,res) => {
  try {
    const [r] = await pool.query(`SELECT id,nombre,ap_paterno,ap_materno,ci,ex,correo,email,tipo_usuario,estado
      FROM usuarios WHERE estado='ACTIVO' AND (tipo_usuario IS NULL OR tipo_usuario<>'Cursante')
      ORDER BY ap_paterno ASC,ap_materno ASC,nombre ASC`);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.post("/api/usuarios", async (req,res) => {
  try {
    const {grado,ap_paterno,ap_materno,nombre,ci,ex,filial,fuerza,turno,telefono,
           fecha_inscripcion,lugar_trabajo,correo,fecha_nacimiento,rol,estado,password,email,tipo_usuario} = req.body;
    const required = {grado,ap_paterno,ap_materno,nombre,ci,ex,filial,fuerza,turno,telefono,fecha_inscripcion,lugar_trabajo,correo,fecha_nacimiento};
    for(const [k,v] of Object.entries(required)){
      if(String(v??"").trim().length===0) return res.status(400).json({message:`Campo requerido: ${k}`});
    }
    const apellido = `${ap_paterno} ${ap_materno}`.trim();
    const passwordHash = await bcrypt.hash(String(password??ci),10);
    const finalEmail = String(email??correo).trim();
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre,apellido,grado,ap_paterno,ap_materno,ci,ex,filial,fuerza,turno,telefono,
       fecha_inscripcion,lugar_trabajo,correo,email,password,rol,estado,tipo_usuario,fecha_nacimiento)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [nombre,apellido,grado,ap_paterno,ap_materno,ci,ex,filial,fuerza,turno,telefono,
       fecha_inscripcion,lugar_trabajo,correo,finalEmail,passwordHash,rol??"ADMIN",estado??"ACTIVO",tipo_usuario??null,fecha_nacimiento]
    );
    res.status(201).json({message:"Usuario creado",id:result.insertId});
  } catch(e){
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Ya existe un usuario con ese CI o correo."});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

app.get("/api/usuarios/ci/:ci", async (req,res) => {
  try {
    const ci = String(req.params.ci||"").trim();
    if(!ci) return res.status(400).json({message:"CI requerido"});
    const [r] = await pool.execute(`SELECT id,nombre,apellido,grado,ap_paterno,ap_materno,ci,ex,filial,fuerza,turno,
      telefono,fecha_inscripcion,lugar_trabajo,correo,email,rol,estado,tipo_usuario,fecha_nacimiento,creado_en
      FROM usuarios WHERE ci=? LIMIT 1`,[ci]);
    if(!r.length) return res.status(404).json({message:"Usuario no encontrado"});
    res.json(r[0]);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.put("/api/usuarios/ci/:ci", async (req,res) => {
  try {
    const ci = String(req.params.ci||"").trim();
    if(!ci) return res.status(400).json({message:"CI requerido"});
    const {tipo_usuario,grado,ap_paterno,ap_materno,nombre,ex,filial,fuerza,turno,telefono,
           fecha_inscripcion,lugar_trabajo,correo,fecha_nacimiento,email,rol,estado} = req.body;
    const required = {tipo_usuario,grado,ap_paterno,ap_materno,nombre,ex,filial,fuerza,turno,telefono,fecha_inscripcion,lugar_trabajo,correo,fecha_nacimiento};
    for(const [k,v] of Object.entries(required)){
      if(String(v??"").trim().length===0) return res.status(400).json({message:`Campo requerido: ${k}`});
    }
    const apellido = `${ap_paterno} ${ap_materno}`.trim();
    const [result] = await pool.execute(
      `UPDATE usuarios SET tipo_usuario=?,grado=?,ap_paterno=?,ap_materno=?,nombre=?,apellido=?,ex=?,filial=?,fuerza=?,
       turno=?,telefono=?,fecha_inscripcion=?,lugar_trabajo=?,correo=?,fecha_nacimiento=?,
       email=COALESCE(?,email),rol=COALESCE(?,rol),estado=COALESCE(?,estado) WHERE ci=? LIMIT 1`,
      [tipo_usuario,grado,ap_paterno,ap_materno,nombre,apellido,ex,filial,fuerza,turno,telefono,
       fecha_inscripcion,lugar_trabajo,correo,fecha_nacimiento,email??null,rol??null,estado??null,ci]
    );
    if(result.affectedRows===0) return res.status(404).json({message:"Usuario no encontrado"});
    res.json({message:"Usuario actualizado"});
  } catch(e){
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Correo o email ya existe en otro usuario."});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

// ════════════════════════════════════════════════════════════
// CURSOS
// ════════════════════════════════════════════════════════════
app.post("/api/cursos", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const {programa_id,nombre,descripcion,jefe_curso_id,fecha_inicio,fecha_fin,modalidad,horas_academicas,participantes_ids} = req.body;
    if(!String(nombre??"").trim())                          return res.status(400).json({message:"Campo requerido: nombre"});
    if(!jefe_curso_id)                                      return res.status(400).json({message:"Campo requerido: jefe_curso_id"});
    if(!fecha_inicio||!fecha_fin)                           return res.status(400).json({message:"Campos requeridos: fecha_inicio, fecha_fin"});
    if(fecha_fin<fecha_inicio)                              return res.status(400).json({message:"fecha_fin no puede ser menor a fecha_inicio"});
    if(!Array.isArray(participantes_ids)||!participantes_ids.length) return res.status(400).json({message:"Debe enviar participantes_ids (mínimo 1)"});

    await conn.beginTransaction();

    const [jefeR] = await conn.execute(`SELECT id,tipo_usuario,estado FROM usuarios WHERE id=? LIMIT 1`,[jefe_curso_id]);
    if(!jefeR.length){await conn.rollback();return res.status(404).json({message:"Jefe de curso no existe"});}
    if(String(jefeR[0].estado).toUpperCase()!=="ACTIVO"){await conn.rollback();return res.status(400).json({message:"El jefe de curso debe estar ACTIVO"});}
    if(String(jefeR[0].tipo_usuario||"").trim()==="Cursante"){await conn.rollback();return res.status(400).json({message:"El jefe de curso no puede ser Cursante"});}

    const ids = [...new Set(participantes_ids.map(x=>Number(x)).filter(Boolean))];
    if(!ids.length){await conn.rollback();return res.status(400).json({message:"participantes_ids inválido"});}
    const ph = ids.map(()=>"?").join(",");
    const [pR] = await conn.execute(`SELECT id,estado,tipo_usuario FROM usuarios WHERE id IN (${ph})`,ids);
    if(pR.length!==ids.length){await conn.rollback();return res.status(400).json({message:"Uno o más participantes no existen"});}
    const inv = pR.find(u=>String(u.estado).toUpperCase()!=="ACTIVO"||String(u.tipo_usuario)!=="Cursante");
    if(inv){await conn.rollback();return res.status(400).json({message:"Todos los participantes deben ser ACTIVO y Cursante"});}

    const [cR] = await conn.execute(
      `INSERT INTO cursos (programa_id,nombre,descripcion,docente_id,jefe_curso_id,fecha_inicio,fecha_fin,modalidad,horas_academicas,estado)
       VALUES (?,?,?,NULL,?,?,?,?,?,'ACTIVO')`,
      [programa_id??null,String(nombre).trim(),String(descripcion??"")||null,jefe_curso_id,fecha_inicio,fecha_fin,String(modalidad??"")||null,Number.isFinite(Number(horas_academicas))?Number(horas_academicas):null]
    );
    const cursoId = cR.insertId;
    const vals = ids.map(()=>"(?,?)").join(",");
    await conn.execute(`INSERT INTO curso_participantes (curso_id,usuario_id) VALUES ${vals}`,ids.flatMap(uid=>[cursoId,uid]));
    await conn.commit();
    res.status(201).json({message:"Curso creado",id:cursoId,participantes:ids.length});
  } catch(e){
    try{await conn.rollback();}catch{}
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Participante duplicado."});
    res.status(500).json({message:"Error interno",detail:e.message});
  } finally{conn.release();}
});


/** GET /api/cursos/jefe/:usuarioId
 *  Devuelve cursos donde el usuario es jefe_curso_id O tiene rol JEFE_CURSO en responsabilidades
 */
app.get("/api/cursos/jefe/:usuarioId", async (req,res) => {
  try {
    const uid = Number(req.params.usuarioId);
    if(!uid) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(`
      SELECT DISTINCT c.id, c.nombre, c.descripcion, c.jefe_curso_id,
             c.fecha_inicio, c.fecha_fin, c.modalidad, c.horas_academicas,
             c.estado, c.creado_en,
             (SELECT COUNT(*) FROM curso_participantes cp WHERE cp.curso_id=c.id) AS participantes_total,
             (SELECT COUNT(*) FROM curso_materias cm WHERE cm.curso_id=c.id) AS materias_total
      FROM cursos c
      WHERE c.jefe_curso_id = ?
         OR c.id IN (
              SELECT curso_id FROM curso_responsabilidades
              WHERE usuario_id = ? AND rol = 'JEFE_CURSO'
            )
      ORDER BY c.creado_en DESC`, [uid, uid]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.get("/api/cursos", async (req,res) => {
  try {
    const [r] = await pool.query(`
      SELECT c.id,c.programa_id,c.nombre,c.descripcion,c.jefe_curso_id,c.fecha_inicio,c.fecha_fin,
             c.modalidad,c.horas_academicas,c.estado,c.creado_en,
             uj.nombre AS jefe_nombre,uj.ap_paterno AS jefe_ap_paterno,uj.ap_materno AS jefe_ap_materno,
             uj.ci AS jefe_ci,uj.tipo_usuario AS jefe_tipo_usuario,
             ue.id AS encargado_id,ue.nombre AS encargado_nombre,ue.ap_paterno AS encargado_ap_paterno,
             ue.ap_materno AS encargado_ap_materno,ue.ci AS encargado_ci,
             (SELECT COUNT(*) FROM curso_participantes cp WHERE cp.curso_id=c.id) AS participantes_total,
             (SELECT COUNT(*) FROM curso_materias cm WHERE cm.curso_id=c.id) AS materias_total
      FROM cursos c
      LEFT JOIN usuarios uj ON uj.id=c.jefe_curso_id
      LEFT JOIN curso_responsabilidades cr_enc ON cr_enc.curso_id=c.id AND cr_enc.rol='ENCARGADO_CURSO'
      LEFT JOIN usuarios ue ON ue.id=cr_enc.usuario_id
      ORDER BY c.creado_en DESC,c.id DESC`);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.get("/api/cursos/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [cR] = await pool.execute(
      `SELECT c.id,c.programa_id,c.nombre,c.descripcion,c.jefe_curso_id,c.fecha_inicio,c.fecha_fin,
              c.modalidad,c.horas_academicas,c.estado,c.creado_en,
              u.nombre AS jefe_nombre,u.ap_paterno AS jefe_ap_paterno,u.ap_materno AS jefe_ap_materno,
              u.ci AS jefe_ci,u.tipo_usuario AS jefe_tipo_usuario
       FROM cursos c LEFT JOIN usuarios u ON u.id=c.jefe_curso_id WHERE c.id=? LIMIT 1`,[id]);
    if(!cR.length) return res.status(404).json({message:"Curso no encontrado"});
    const [pR] = await pool.execute(
      `SELECT u.id,u.nombre,u.ap_paterno,u.ap_materno,u.ci,u.ex,u.correo,u.email,u.tipo_usuario,u.estado
       FROM curso_participantes cp INNER JOIN usuarios u ON u.id=cp.usuario_id
       WHERE cp.curso_id=? ORDER BY u.ap_paterno ASC,u.ap_materno ASC,u.nombre ASC`,[id]);
    const [mR] = await pool.execute(
      `SELECT cm.id,cm.nombre,cm.codigo,cm.descripcion,cm.horas,cm.docente_id,cm.creado_en,
              u.nombre AS docente_nombre,u.ap_paterno AS docente_ap_paterno,u.ap_materno AS docente_ap_materno,u.ci AS docente_ci
       FROM curso_materias cm LEFT JOIN usuarios u ON u.id=cm.docente_id
       WHERE cm.curso_id=? ORDER BY cm.nombre ASC`,[id]);
    res.json({...cR[0],participantes:pR,materias:mR});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.post("/api/cursos/:id/participantes", async (req,res) => {
  try {
    const cursoId = Number(req.params.id);
    const {participantes_ids} = req.body;
    if(!cursoId) return res.status(400).json({message:"ID de curso inválido"});
    if(!Array.isArray(participantes_ids)||!participantes_ids.length) return res.status(400).json({message:"Debe enviar participantes_ids"});
    const [cR] = await pool.execute(`SELECT id FROM cursos WHERE id=? LIMIT 1`,[cursoId]);
    if(!cR.length) return res.status(404).json({message:"Curso no encontrado"});
    const ids = [...new Set(participantes_ids.map(x=>Number(x)).filter(Boolean))];
    const ph = ids.map(()=>"?").join(",");
    const [uR] = await pool.execute(`SELECT id,estado,tipo_usuario FROM usuarios WHERE id IN (${ph})`,ids);
    if(uR.length!==ids.length) return res.status(400).json({message:"Uno o más participantes no existen"});
    const inv = uR.find(u=>String(u.estado).toUpperCase()!=="ACTIVO"||String(u.tipo_usuario)!=="Cursante");
    if(inv) return res.status(400).json({message:"Todos deben ser ACTIVO y Cursante"});
    const vals = ids.map(()=>"(?,?)").join(",");
    const [result] = await pool.execute(
      `INSERT INTO curso_participantes (curso_id,usuario_id) VALUES ${vals} ON DUPLICATE KEY UPDATE curso_id=curso_id`,
      ids.flatMap(uid=>[cursoId,uid])
    );
    res.json({message:"Participantes añadidos",curso_id:cursoId,recibidos:ids.length,affectedRows:result.affectedRows});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.delete("/api/cursos/:id/participantes", async (req,res) => {
  try {
    const cursoId = Number(req.params.id);
    const {participantes_ids} = req.body;
    if(!cursoId||!Array.isArray(participantes_ids)||!participantes_ids.length) return res.status(400).json({message:"Datos inválidos"});
    const ids = [...new Set(participantes_ids.map(x=>Number(x)).filter(Boolean))];
    const ph = ids.map(()=>"?").join(",");
    const [result] = await pool.execute(`DELETE FROM curso_participantes WHERE curso_id=? AND usuario_id IN (${ph})`,[cursoId,...ids]);
    res.json({message:"Participantes eliminados",removed:result.affectedRows});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// FIX #1: GET responsabilidades — excluir JEFE_CURSO de curso_responsabilidades
// ya que el jefe se devuelve por separado desde cursos.jefe_curso_id
// ════════════════════════════════════════════════════════════
app.get("/api/cursos/:id/responsabilidades", async (req,res) => {
  try {
    const cursoId = Number(req.params.id);
    if(!cursoId) return res.status(400).json({message:"ID inválido"});
    const curso = await assertCursoExists(pool,cursoId);
    if(!curso) return res.status(404).json({message:"Curso no encontrado"});
    const [jR] = await pool.execute(
      `SELECT u.id,u.nombre,u.ap_paterno,u.ap_materno,u.ci,u.tipo_usuario,u.estado
       FROM usuarios u WHERE u.id=? LIMIT 1`,
      [curso.jefe_curso_id]);
    // CAMBIO: AND cr.rol != 'JEFE_CURSO' evita que aparezca duplicado
    const [rR] = await pool.execute(
      `SELECT cr.id,cr.rol,cr.usuario_id,cr.creado_en,
              u.nombre,u.ap_paterno,u.ap_materno,u.ci,u.tipo_usuario,u.estado
       FROM curso_responsabilidades cr
       INNER JOIN usuarios u ON u.id=cr.usuario_id
       WHERE cr.curso_id=? AND cr.rol != 'JEFE_CURSO'
       ORDER BY cr.rol ASC`,
      [cursoId]);
    res.json({curso_id:cursoId, jefe_curso:jR.length?{rol:"JEFE_CURSO",...jR[0]}:null, responsabilidades:rR});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.post("/api/cursos/:id/responsabilidades", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const cursoId = Number(req.params.id);
    let {rol,usuario_id,usuarios_ids} = req.body;
    rol = normRol(rol);
    if(!ROLES_RESP.has(rol)) return res.status(400).json({message:"Rol inválido"});
    await conn.beginTransaction();
    const curso = await assertCursoExists(conn,cursoId);
    if(!curso){await conn.rollback();return res.status(404).json({message:"Curso no encontrado"});}

    if(rol==="JEFE_CURSO"){
      const uid = Number(usuario_id);
      const ok = await assertNoCursanteActivo(conn,uid);
      if(!ok.ok){await conn.rollback();return res.status(ok.code).json({message:ok.msg});}
      // Actualizar jefe_curso_id en cursos
      await conn.execute(`UPDATE cursos SET jefe_curso_id=? WHERE id=? LIMIT 1`,[uid,cursoId]);
      // También registrar en curso_responsabilidades para que el dashboard lo encuentre
      await conn.execute(`DELETE FROM curso_responsabilidades WHERE curso_id=? AND rol='JEFE_CURSO'`,[cursoId]);
      await conn.execute(`INSERT INTO curso_responsabilidades (curso_id,usuario_id,rol) VALUES (?,?,'JEFE_CURSO')`,[cursoId,uid]);
      await conn.commit();return res.json({message:"Jefe asignado",curso_id:cursoId,rol});
    }
    if(ROLES_SINGLE.has(rol)){
      const uid = Number(usuario_id);
      const ok = rol==="ENCARGADO_CURSO"?await assertCursanteInscrito(conn,cursoId,uid):await assertNoCursanteActivo(conn,uid);
      if(!ok.ok){await conn.rollback();return res.status(ok.code).json({message:ok.msg});}
      await conn.execute(`DELETE FROM curso_responsabilidades WHERE curso_id=? AND rol=?`,[cursoId,rol]);
      await conn.execute(`INSERT INTO curso_responsabilidades (curso_id,usuario_id,rol) VALUES (?,?,?)`,[cursoId,uid,rol]);
      await conn.commit();return res.json({message:"Responsabilidad asignada",curso_id:cursoId,rol,usuario_id:uid});
    }
    if(!Array.isArray(usuarios_ids)||!usuarios_ids.length){await conn.rollback();return res.status(400).json({message:"Debe enviar usuarios_ids"});}
    const ids = [...new Set(usuarios_ids.map(x=>Number(x)).filter(Boolean))];
    for(const uid of ids){const ok=await assertNoCursanteActivo(conn,uid);if(!ok.ok){await conn.rollback();return res.status(ok.code).json({message:ok.msg,usuario_id:uid});}}
    const vals = ids.map(()=>"(?,?,?)").join(",");
    const [result] = await conn.execute(
      `INSERT INTO curso_responsabilidades (curso_id,usuario_id,rol) VALUES ${vals} ON DUPLICATE KEY UPDATE rol=rol`,
      ids.flatMap(uid=>[cursoId,uid,rol])
    );
    await conn.commit();
    res.json({message:"Responsabilidades asignadas",curso_id:cursoId,rol,affectedRows:result.affectedRows});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});

// ════════════════════════════════════════════════════════════
// FIX #2: DELETE responsabilidades JEFE_CURSO — limpiar ambas tablas
// ════════════════════════════════════════════════════════════
app.delete("/api/cursos/:id/responsabilidades", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const cursoId = Number(req.params.id);
    let {rol,usuario_id,usuarios_ids} = req.body;
    rol = normRol(rol);
    if(!ROLES_RESP.has(rol)) return res.status(400).json({message:"Rol inválido"});
    await conn.beginTransaction();
    const curso = await assertCursoExists(conn,cursoId);
    if(!curso){await conn.rollback();return res.status(404).json({message:"Curso no encontrado"});}
    if(rol==="JEFE_CURSO"){
      // CAMBIO: limpiar también curso_responsabilidades al remover jefe
      await conn.execute(`UPDATE cursos SET jefe_curso_id=NULL WHERE id=? LIMIT 1`,[cursoId]);
      await conn.execute(`DELETE FROM curso_responsabilidades WHERE curso_id=? AND rol='JEFE_CURSO'`,[cursoId]);
      await conn.commit();return res.json({message:"Jefe removido"});
    }
    let ids = usuario_id?[Number(usuario_id)]:Array.isArray(usuarios_ids)?usuarios_ids.map(x=>Number(x)).filter(Boolean):[];
    ids = [...new Set(ids)].filter(Boolean);
    if(!ids.length){await conn.rollback();return res.status(400).json({message:"Debe enviar usuario_id o usuarios_ids"});}
    const ph = ids.map(()=>"?").join(",");
    const [result] = await conn.execute(`DELETE FROM curso_responsabilidades WHERE curso_id=? AND rol=? AND usuario_id IN (${ph})`,[cursoId,rol,...ids]);
    await conn.commit();
    res.json({message:"Responsabilidades eliminadas",removed:result.affectedRows});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});

// ════════════════════════════════════════════════════════════
// MATERIAS DEL CURSO
// ════════════════════════════════════════════════════════════

/** GET /api/cursos/:cursoId/materias — Lista materias del curso con docente */
app.get("/api/cursos/:cursoId/materias", async (req,res) => {
  try {
    const cursoId = Number(req.params.cursoId);
    if(!cursoId) return res.status(400).json({message:"ID de curso inválido"});
    const [r] = await pool.execute(
      `SELECT cm.id,cm.curso_id,cm.nombre,cm.codigo,cm.descripcion,cm.horas,cm.docente_id,cm.creado_en,
              u.nombre AS docente_nombre,u.ap_paterno AS docente_ap_paterno,
              u.ap_materno AS docente_ap_materno,u.ci AS docente_ci, u.tipo_usuario AS docente_tipo
       FROM curso_materias cm
       LEFT JOIN usuarios u ON u.id=cm.docente_id
       WHERE cm.curso_id=? ORDER BY cm.nombre ASC`,[cursoId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** POST /api/cursos/:cursoId/materias — Crear materia en un curso */
app.post("/api/cursos/:cursoId/materias", async (req,res) => {
  try {
    const cursoId = Number(req.params.cursoId);
    if(!cursoId) return res.status(400).json({message:"ID de curso inválido"});
    const {nombre,codigo,descripcion,horas,docente_id} = req.body;
    if(!String(nombre??"").trim()) return res.status(400).json({message:"Campo requerido: nombre"});

    const [cR] = await pool.execute(`SELECT id FROM cursos WHERE id=? LIMIT 1`,[cursoId]);
    if(!cR.length) return res.status(404).json({message:"Curso no encontrado"});

    if(docente_id){
      const ok = await assertNoCursanteActivo(pool,Number(docente_id));
      if(!ok.ok) return res.status(ok.code).json({message:ok.msg});
    }

    const [result] = await pool.execute(
      `INSERT INTO curso_materias (curso_id,nombre,codigo,descripcion,horas,docente_id)
       VALUES (?,?,?,?,?,?)`,
      [cursoId,String(nombre).trim(),codigo??null,descripcion??null,horas?Number(horas):null,docente_id??null]
    );
    res.status(201).json({message:"Materia creada",id:result.insertId,curso_id:cursoId});
  } catch(e){
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Ya existe una materia con ese nombre en este curso."});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

/** PUT /api/materias/:id — Actualizar nombre/docente/datos de una materia */
app.put("/api/materias/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const {nombre,codigo,descripcion,horas,docente_id} = req.body;
    if(!String(nombre??"").trim()) return res.status(400).json({message:"Campo requerido: nombre"});

    const [mR] = await pool.execute(`SELECT id FROM curso_materias WHERE id=? LIMIT 1`,[id]);
    if(!mR.length) return res.status(404).json({message:"Materia no encontrada"});

    if(docente_id){
      const ok = await assertNoCursanteActivo(pool,Number(docente_id));
      if(!ok.ok) return res.status(ok.code).json({message:ok.msg});
    }

    await pool.execute(
      `UPDATE curso_materias SET nombre=?,codigo=?,descripcion=?,horas=?,docente_id=? WHERE id=? LIMIT 1`,
      [String(nombre).trim(),codigo??null,descripcion??null,horas?Number(horas):null,docente_id??null,id]
    );
    res.json({message:"Materia actualizada"});
  } catch(e){
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Ya existe una materia con ese nombre en el curso."});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

/** DELETE /api/materias/:id — Eliminar materia (cascade: asistencia, calificaciones, tareas) */
app.delete("/api/materias/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [result] = await pool.execute(`DELETE FROM curso_materias WHERE id=? LIMIT 1`,[id]);
    if(result.affectedRows===0) return res.status(404).json({message:"Materia no encontrada"});
    res.json({message:"Materia eliminada"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** PATCH /api/materias/:id/docente — Asignar o cambiar docente de una materia */
app.patch("/api/materias/:id/docente", async (req,res) => {
  try {
    const id = Number(req.params.id);
    const {docente_id} = req.body;
    if(!id) return res.status(400).json({message:"ID inválido"});

    const [mR] = await pool.execute(`SELECT id FROM curso_materias WHERE id=? LIMIT 1`,[id]);
    if(!mR.length) return res.status(404).json({message:"Materia no encontrada"});

    if(docente_id){
      const ok = await assertNoCursanteActivo(pool,Number(docente_id));
      if(!ok.ok) return res.status(ok.code).json({message:ok.msg});
    }

    await pool.execute(`UPDATE curso_materias SET docente_id=? WHERE id=? LIMIT 1`,[docente_id??null,id]);
    res.json({message: docente_id?"Docente asignado a la materia":"Docente removido de la materia"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// ASISTENCIA (por materia)
// ════════════════════════════════════════════════════════════

/**
 * POST /api/asistencia
 * body: { curso_id, materia_id, fecha, registros:[{usuario_id,estado,observacion}], registrado_por }
 */
app.post("/api/asistencia", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const {curso_id,materia_id,fecha,registros,registrado_por} = req.body;
    if(!curso_id)                                       return res.status(400).json({message:"Campo requerido: curso_id"});
    if(!materia_id)                                     return res.status(400).json({message:"Campo requerido: materia_id"});
    if(!fecha)                                          return res.status(400).json({message:"Campo requerido: fecha"});
    if(!Array.isArray(registros)||!registros.length)    return res.status(400).json({message:"Campo requerido: registros"});

    const materia = await assertMateriaExists(conn,materia_id);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});
    if(materia.curso_id!==curso_id) return res.status(400).json({message:"La materia no pertenece al curso indicado"});

    const estadosValidos = new Set(["P","A","T","J"]);
    for(const r of registros){
      if(!r.usuario_id) return res.status(400).json({message:"Cada registro debe tener usuario_id"});
      if(!estadosValidos.has(String(r.estado||"").toUpperCase())) return res.status(400).json({message:`Estado inválido: ${r.estado}. Use P,A,T,J`});
    }

    await conn.beginTransaction();
    for(const r of registros){
      await conn.execute(
        `INSERT INTO asistencia (curso_id,materia_id,usuario_id,fecha,estado,observacion,registrado_por)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE estado=VALUES(estado),observacion=VALUES(observacion),registrado_por=VALUES(registrado_por)`,
        [curso_id,materia_id,r.usuario_id,fecha,String(r.estado).toUpperCase(),r.observacion??null,registrado_por??null]
      );
    }
    await conn.commit();
    res.status(201).json({message:"Asistencia registrada",materia_id,fecha,total:registros.length});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});

/** GET /api/asistencia/materia/:materiaId — Historial de asistencia por materia */
app.get("/api/asistencia/materia/:materiaId", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const {fecha,usuario_id} = req.query;
    let sql = `SELECT a.id,a.curso_id,a.materia_id,a.usuario_id,a.fecha,a.estado,a.observacion,a.creado_en,
                      u.nombre,u.ap_paterno,u.ap_materno,u.ci
               FROM asistencia a INNER JOIN usuarios u ON u.id=a.usuario_id
               WHERE a.materia_id=?`;
    const params = [materiaId];
    if(fecha){sql+=` AND a.fecha=?`;params.push(fecha);}
    if(usuario_id){sql+=` AND a.usuario_id=?`;params.push(Number(usuario_id));}
    sql+=` ORDER BY a.fecha DESC,u.ap_paterno ASC,u.nombre ASC`;
    const [r] = await pool.execute(sql,params);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** GET /api/asistencia/materia/:materiaId/resumen — Resumen P/A/T/J por fecha */
app.get("/api/asistencia/materia/:materiaId/resumen", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT fecha,SUM(estado='P') AS P,SUM(estado='A') AS A,SUM(estado='T') AS T,SUM(estado='J') AS J,COUNT(*) AS total
       FROM asistencia WHERE materia_id=? GROUP BY fecha ORDER BY fecha DESC`,[materiaId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE EVALUACIONES (por materia)
// ════════════════════════════════════════════════════════════

/** GET /api/eval-config/materia/:materiaId */
app.get("/api/eval-config/materia/:materiaId", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT id,nombre,peso,orden,nota_min_apro,nota_max FROM eval_config WHERE materia_id=? ORDER BY orden ASC`,[materiaId]);
    if(!r.length){
      return res.json([
        {id:null,nombre:"Examen",peso:70,orden:1,nota_min_apro:70,nota_max:100},
        {id:null,nombre:"Tarea", peso:30,orden:2,nota_min_apro:70,nota_max:100},
      ]);
    }
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** POST /api/eval-config/materia/:materiaId — Reemplaza config de una materia */
app.post("/api/eval-config/materia/:materiaId", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const {evaluaciones} = req.body;
    if(!Array.isArray(evaluaciones)||!evaluaciones.length) return res.status(400).json({message:"Se requiere array evaluaciones"});
    const suma = evaluaciones.reduce((s,e)=>s+Number(e.peso||0),0);
    if(Math.abs(suma-100)>0.01) return res.status(400).json({message:`La suma de pesos debe ser 100. Actual: ${suma}`});

    const materia = await assertMateriaExists(conn,materiaId);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});

    await conn.beginTransaction();
    await conn.execute(`DELETE FROM eval_config WHERE materia_id=?`,[materiaId]);
    for(const [i,ev] of evaluaciones.entries()){
      await conn.execute(
        `INSERT INTO eval_config (curso_id,materia_id,nombre,peso,orden,nota_min_apro,nota_max) VALUES (?,?,?,?,?,?,?)`,
        [materia.curso_id,materiaId,String(ev.nombre).trim(),Number(ev.peso),Number(ev.orden??i+1),Number(ev.nota_min_apro??70),Number(ev.nota_max??100)]
      );
    }
    await conn.commit();
    res.json({message:"Configuración guardada",materia_id:materiaId});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});

// ════════════════════════════════════════════════════════════
// CALIFICACIONES (por materia)
// ════════════════════════════════════════════════════════════

/**
 * POST /api/calificaciones
 * body: { curso_id, materia_id, calificaciones:[{usuario_id, notas:{}}], registrado_por }
 */
app.post("/api/calificaciones", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const {curso_id,materia_id,calificaciones,registrado_por} = req.body;
    if(!curso_id)    return res.status(400).json({message:"Campo requerido: curso_id"});
    if(!materia_id)  return res.status(400).json({message:"Campo requerido: materia_id"});
    if(!Array.isArray(calificaciones)||!calificaciones.length) return res.status(400).json({message:"Campo requerido: calificaciones"});

    const materia = await assertMateriaExists(conn,materia_id);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});

    await conn.beginTransaction();

    let [evalRows] = await conn.execute(`SELECT id,nombre FROM eval_config WHERE materia_id=? ORDER BY orden ASC`,[materia_id]);
    if(!evalRows.length){
      const nombresEval = Object.keys(calificaciones[0]?.notas||{});
      if(!nombresEval.length){await conn.rollback();return res.status(400).json({message:"No hay configuración de evaluaciones para esta materia"});}
      const PESOS_FIJOS = { 'Examen': 70, 'Tarea': 20 };
      for(const [i,nombre] of nombresEval.entries()){
        const peso = PESOS_FIJOS[nombre] ?? (90/nombresEval.length).toFixed(2);
        await conn.execute(`INSERT IGNORE INTO eval_config (curso_id,materia_id,nombre,peso,orden) VALUES (?,?,?,?,?)`,[curso_id,materia_id,nombre,peso,i+1]);
      }
      [evalRows] = await conn.execute(`SELECT id,nombre FROM eval_config WHERE materia_id=? ORDER BY orden ASC`,[materia_id]);
    }

    const evalMap = Object.fromEntries(evalRows.map(e=>[e.nombre,e.id]));
    let total = 0;
    for(const reg of calificaciones){
      const {usuario_id,notas} = reg;
      if(!usuario_id||!notas) continue;
      for(const [evalNombre,nota] of Object.entries(notas)){
        const evalId = evalMap[evalNombre];
        if(!evalId) continue;
        const notaNum = Math.min(100,Math.max(0,Number(nota)||0));
        await conn.execute(
          `INSERT INTO calificaciones (curso_id,materia_id,usuario_id,eval_config_id,nota,registrado_por)
           VALUES (?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE nota=VALUES(nota),registrado_por=VALUES(registrado_por),actualizado_en=NOW()`,
          [curso_id,materia_id,usuario_id,evalId,notaNum,registrado_por??null]
        );
        total++;
      }
    }
    await conn.commit();
    res.status(201).json({message:"Calificaciones guardadas",materia_id,estudiantes:calificaciones.length,notas_guardadas:total});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});


/**
 * POST /api/calificaciones/usuario — Guardar y bloquear notas de UN cursante
 * body: { curso_id, materia_id, usuario_id, notas:{evalNombre:nota}, bloquear:true }
 */
app.post("/api/calificaciones/usuario", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const {curso_id,materia_id,usuario_id,notas,bloquear} = req.body;
    if(!curso_id)    return res.status(400).json({message:"Campo requerido: curso_id"});
    if(!materia_id)  return res.status(400).json({message:"Campo requerido: materia_id"});
    if(!usuario_id)  return res.status(400).json({message:"Campo requerido: usuario_id"});
    if(!notas)       return res.status(400).json({message:"Campo requerido: notas"});

    const materia = await assertMateriaExists(conn, materia_id);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});

    const [chk] = await conn.execute(
      `SELECT bloqueado FROM calificaciones WHERE materia_id=? AND usuario_id=? LIMIT 1`,
      [materia_id, usuario_id]);
    if(chk.length && chk[0].bloqueado)
      return res.status(409).json({message:"Las calificaciones de este cursante ya están bloqueadas."});

    await conn.beginTransaction();

    let [evalRows] = await conn.execute(
      `SELECT id,nombre FROM eval_config WHERE materia_id=? ORDER BY orden ASC`,[materia_id]);
    if(!evalRows.length){
      const nombresEval = Object.keys(notas);
      const peso = (100/nombresEval.length).toFixed(2);
      for(const [i,nombre] of nombresEval.entries()){
        await conn.execute(
          `INSERT IGNORE INTO eval_config (curso_id,materia_id,nombre,peso,orden) VALUES (?,?,?,?,?)`,
          [curso_id,materia_id,nombre,peso,i+1]);
      }
      [evalRows] = await conn.execute(
        `SELECT id,nombre FROM eval_config WHERE materia_id=? ORDER BY orden ASC`,[materia_id]);
    }

    const evalMap = Object.fromEntries(evalRows.map(e=>[e.nombre,e.id]));
    const bloqueadoVal = bloquear ? 1 : 0;

    for(const [evalNombre,nota] of Object.entries(notas)){
      const evalId = evalMap[evalNombre];
      if(!evalId) continue;
      const notaNum = Math.min(100,Math.max(0,Number(nota)||0));
      await conn.execute(
        `INSERT INTO calificaciones (curso_id,materia_id,usuario_id,eval_config_id,nota,bloqueado)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE nota=VALUES(nota),bloqueado=VALUES(bloqueado),actualizado_en=NOW()`,
        [curso_id,materia_id,usuario_id,evalId,notaNum,bloqueadoVal]);
    }

    await conn.commit();
    res.json({message:"Calificaciones guardadas", usuario_id, bloqueado:bloqueadoVal===1});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});

/** GET /api/calificaciones/materia/:materiaId — Libro de calificaciones por materia */
app.get("/api/calificaciones/materia/:materiaId", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});

    const [evalRows] = await pool.execute(
      `SELECT id,nombre,peso,orden,nota_min_apro,nota_max FROM eval_config WHERE materia_id=? ORDER BY orden ASC`,[materiaId]);
    const materia = await assertMateriaExists(pool,materiaId);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});

    const [partRows] = await pool.execute(
      `SELECT u.id,u.nombre,u.ap_paterno,u.ap_materno,u.ci
       FROM curso_participantes cp INNER JOIN usuarios u ON u.id=cp.usuario_id
       WHERE cp.curso_id=? ORDER BY u.ap_paterno ASC,u.ap_materno ASC,u.nombre ASC`,[materia.curso_id]);

    const [notaRows] = await pool.execute(
      `SELECT c.usuario_id,ec.nombre AS eval_nombre,c.nota,c.bloqueado
       FROM calificaciones c INNER JOIN eval_config ec ON ec.id=c.eval_config_id
       WHERE c.materia_id=? OR (c.materia_id IS NULL AND ec.materia_id=?)`,[materiaId,materiaId]);

    const notasMap = {};
    const bloqueadoMap = {};
    for(const n of notaRows){
      if(!notasMap[n.usuario_id]) notasMap[n.usuario_id]={};
      notasMap[n.usuario_id][n.eval_nombre]=Number(n.nota);
      if(n.bloqueado) bloqueadoMap[n.usuario_id] = true;
    }

    const tareaEvalNames = evalRows.filter(ev => isTareaEval(ev.nombre)).map(ev => ev.nombre);
    if (tareaEvalNames.length) {
      try {
        const [tareaRows] = await pool.execute(
          `SELECT te.usuario_id, ROUND(AVG(te.nota),2) AS promedio_tarea
           FROM tareas t
           JOIN tarea_entregas te ON te.tarea_id=t.id
           WHERE t.materia_id=? AND te.nota IS NOT NULL
           GROUP BY te.usuario_id`, [materiaId]);
        for (const row of tareaRows) {
          if(!notasMap[row.usuario_id]) notasMap[row.usuario_id]={};
          for (const evalName of tareaEvalNames) {
            notasMap[row.usuario_id][evalName] = Number(row.promedio_tarea);
          }
        }
      } catch(e) {
        if (!isMissingTableError(e)) throw e;
      }
    }

    const notaMinApro = evalRows.length?Number(evalRows[0].nota_min_apro):70;

    const libro = partRows.map(p=>{
      const notas = notasMap[p.id]||{};
      let promedio = 0;
      if(evalRows.length){
        // Promedio = contribución directa al 90% (suma nota*peso / 100), escala 0-90
        let sumaNota=0;
        for(const ev of evalRows){sumaNota+=(notas[ev.nombre]??0)*Number(ev.peso);}
        promedio = sumaNota/100;
      } else {
        const v=Object.values(notas);promedio=v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
      }
      return {usuario_id:p.id,nombre:p.nombre,ap_paterno:p.ap_paterno,ap_materno:p.ap_materno,ci:p.ci,
              notas,promedio:Number(promedio.toFixed(2)),estado:promedio>=notaMinApro?"aprobado":"reprobado",
              bloqueado: bloqueadoMap[p.id] || false};
    });

    res.json({materia_id:materiaId,materia_nombre:materia.nombre,evaluaciones:evalRows,libro});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// PLANIFICACIÓN DOCENTE (por materia)
// ════════════════════════════════════════════════════════════

/** GET /api/planificacion/materia/:materiaId */
app.get("/api/planificacion/materia/:materiaId", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT p.id,p.curso_id,p.materia_id,p.docente_id,p.titulo,p.objetivos,p.archivo_url,
              p.estado,p.observacion,p.creado_en,p.aprobado_en,
              u.nombre AS docente_nombre,u.ap_paterno AS docente_ap_paterno,u.ci AS docente_ci,
              ua.nombre AS aprobado_por_nombre,ua.ap_paterno AS aprobado_por_ap
       FROM planificacion_docente p
       LEFT JOIN usuarios u  ON u.id=p.docente_id
       LEFT JOIN usuarios ua ON ua.id=p.aprobado_por
       WHERE p.materia_id=? ORDER BY p.creado_en DESC`,[materiaId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** POST /api/planificacion — Crear planificación */
app.post("/api/planificacion", async (req,res) => {
  try {
    const {curso_id,materia_id,docente_id,titulo,objetivos,archivo_url} = req.body;
    if(!curso_id)   return res.status(400).json({message:"Campo requerido: curso_id"});
    if(!materia_id) return res.status(400).json({message:"Campo requerido: materia_id"});
    if(!String(titulo??"").trim()) return res.status(400).json({message:"Campo requerido: titulo"});
    const materia = await assertMateriaExists(pool,materia_id);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});
    const [result] = await pool.execute(
      `INSERT INTO planificacion_docente (curso_id,materia_id,docente_id,titulo,objetivos,archivo_url)
       VALUES (?,?,?,?,?,?)`,
      [curso_id,materia_id,docente_id??null,String(titulo).trim(),objetivos??null,archivo_url??null]
    );
    res.status(201).json({message:"Planificación creada",id:result.insertId});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** PATCH /api/planificacion/:id/estado — Aprobar o rechazar */
app.patch("/api/planificacion/:id/estado", async (req,res) => {
  try {
    const id = Number(req.params.id);
    const {estado,observacion,aprobado_por} = req.body;
    if(!id) return res.status(400).json({message:"ID inválido"});
    const estadosValidos = ["PENDIENTE","APROBADO","RECHAZADO"];
    if(!estadosValidos.includes(String(estado||"").toUpperCase())) return res.status(400).json({message:"Estado inválido"});
    const estadoFinal = String(estado).toUpperCase();
    const aprobado_en = estadoFinal==="APROBADO"?new Date():null;
    const [result] = await pool.execute(
      `UPDATE planificacion_docente SET estado=?,observacion=?,aprobado_por=?,aprobado_en=? WHERE id=? LIMIT 1`,
      [estadoFinal,observacion??null,aprobado_por??null,aprobado_en,id]
    );
    if(result.affectedRows===0) return res.status(404).json({message:"Planificación no encontrada"});
    res.json({message:`Planificación ${estadoFinal.toLowerCase()}`});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** DELETE /api/planificacion/:id */
app.delete("/api/planificacion/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [result] = await pool.execute(`DELETE FROM planificacion_docente WHERE id=? LIMIT 1`,[id]);
    if(result.affectedRows===0) return res.status(404).json({message:"Planificación no encontrada"});
    res.json({message:"Planificación eliminada"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// TAREAS (por materia)
// ════════════════════════════════════════════════════════════

/** GET /api/tareas/materia/:materiaId */
app.get("/api/tareas/materia/:materiaId", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT t.id,t.curso_id,t.materia_id,t.titulo,t.descripcion,t.fecha_limite,t.creado_en,
              (SELECT COUNT(*) FROM tarea_entregas te WHERE te.tarea_id=t.id) AS total_entregas,
              (SELECT COUNT(*) FROM tarea_entregas te WHERE te.tarea_id=t.id AND te.estado='ENTREGADO') AS entregadas,
              u.nombre AS creado_por_nombre,u.ap_paterno AS creado_por_ap
       FROM tareas t LEFT JOIN usuarios u ON u.id=t.creado_por
       WHERE t.materia_id=? ORDER BY t.creado_en DESC`,[materiaId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/**
 * POST /api/tareas — Crear tarea y generar entregas pendientes para todos los participantes
 * body: { curso_id, materia_id, titulo, descripcion, fecha_limite, creado_por }
 */
app.post("/api/tareas", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const {curso_id,materia_id,titulo,descripcion,fecha_limite,creado_por} = req.body;
    if(!curso_id)   return res.status(400).json({message:"Campo requerido: curso_id"});
    if(!materia_id) return res.status(400).json({message:"Campo requerido: materia_id"});
    if(!String(titulo??"").trim()) return res.status(400).json({message:"Campo requerido: titulo"});

    const materia = await assertMateriaExists(conn,materia_id);
    if(!materia) return res.status(404).json({message:"Materia no encontrada"});

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO tareas (curso_id,materia_id,titulo,descripcion,fecha_limite,creado_por) VALUES (?,?,?,?,?,?)`,
      [curso_id,materia_id,String(titulo).trim(),descripcion??null,fecha_limite??null,creado_por??null]
    );
    const tareaId = result.insertId;

    const [partRows] = await conn.execute(
      `SELECT usuario_id FROM curso_participantes WHERE curso_id=?`,[curso_id]);

    if(partRows.length){
      const vals = partRows.map(()=>"(?,?)").join(",");
      await conn.execute(
        `INSERT IGNORE INTO tarea_entregas (tarea_id,usuario_id) VALUES ${vals}`,
        partRows.flatMap(p=>[tareaId,p.usuario_id])
      );
    }

    await conn.commit();
    res.status(201).json({message:"Tarea creada",id:tareaId,entregas_generadas:partRows.length});
  } catch(e){try{await conn.rollback();}catch{}res.status(500).json({message:"Error interno",detail:e.message});}
  finally{conn.release();}
});

/** GET /api/tareas/:tareaId/entregas — Entregas de una tarea con datos de alumno */
app.get("/api/tareas/:tareaId/entregas", async (req,res) => {
  try {
    const tareaId = Number(req.params.tareaId);
    if(!tareaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT te.id,te.tarea_id,te.usuario_id,te.estado,te.nota,te.feedback,te.entregado_en,te.actualizado_en,
              u.nombre,u.ap_paterno,u.ap_materno,u.ci
       FROM tarea_entregas te INNER JOIN usuarios u ON u.id=te.usuario_id
       WHERE te.tarea_id=? ORDER BY u.ap_paterno ASC,u.nombre ASC`,[tareaId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/**
 * PATCH /api/tareas/:tareaId/entregas/:usuarioId — Actualizar entrega (estado, nota, feedback)
 * body: { estado, nota, feedback, calificado_por }
 */
app.patch("/api/tareas/:tareaId/entregas/:usuarioId", async (req,res) => {
  try {
    const tareaId   = Number(req.params.tareaId);
    const usuarioId = Number(req.params.usuarioId);
    const {estado,nota,feedback,calificado_por} = req.body;
    if(!tareaId||!usuarioId) return res.status(400).json({message:"IDs inválidos"});

    const estadosValidos = new Set(["PENDIENTE","ENTREGADO"]);
    if(estado && !estadosValidos.has(String(estado).toUpperCase())) return res.status(400).json({message:"Estado inválido"});

    const estadoFinal  = estado?String(estado).toUpperCase():undefined;

    const sets = [];
    const params = [];
    if(estadoFinal){sets.push("estado=?");params.push(estadoFinal);}
    if(estadoFinal==="ENTREGADO"){sets.push("entregado_en=NOW()");}
    if(nota!==undefined){sets.push("nota=?");params.push(Math.min(100,Math.max(0,Number(nota)||0)));}
    if(feedback!==undefined){sets.push("feedback=?");params.push(feedback);}
    if(calificado_por!==undefined){sets.push("calificado_por=?");params.push(calificado_por??null);}
    if(!sets.length) return res.status(400).json({message:"Nada que actualizar"});

    params.push(tareaId,usuarioId);
    const [result] = await pool.execute(
      `UPDATE tarea_entregas SET ${sets.join(",")} WHERE tarea_id=? AND usuario_id=? LIMIT 1`,params);
    if(result.affectedRows===0) return res.status(404).json({message:"Entrega no encontrada"});
    res.json({message:"Entrega actualizada"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** DELETE /api/tareas/:id */
app.delete("/api/tareas/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [result] = await pool.execute(`DELETE FROM tareas WHERE id=? LIMIT 1`,[id]);
    if(result.affectedRows===0) return res.status(404).json({message:"Tarea no encontrada"});
    res.json({message:"Tarea eliminada"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// EVALUACIONES INSTITUCIONALES
// ════════════════════════════════════════════════════════════

async function seedDisciplina() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS disciplina_catalogo (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        tipo        ENUM('MERITO','DEMERITO') NOT NULL,
        codigo      VARCHAR(20) DEFAULT NULL,
        nombre      VARCHAR(200) NOT NULL,
        descripcion TEXT DEFAULT NULL,
        puntos      DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        activo      TINYINT(1) NOT NULL DEFAULT 1,
        creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS disciplina_registros (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        curso_id       INT NOT NULL,
        materia_id     INT NULL,
        usuario_id     INT NOT NULL,
        catalogo_id    INT DEFAULT NULL,
        tipo           ENUM('MERITO','DEMERITO') NOT NULL,
        descripcion    VARCHAR(500) NOT NULL,
        puntos         DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        fecha          DATE NOT NULL,
        registrado_por INT NOT NULL,
        observacion    VARCHAR(500) DEFAULT NULL,
        creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_disc_reg_usuario (usuario_id, curso_id),
        KEY idx_disc_reg_curso   (curso_id),
        KEY idx_disc_reg_materia (materia_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS disciplina_config (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        curso_id      INT NOT NULL,
        materia_id    INT NOT NULL,
        porcentaje    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        activo        TINYINT(1) NOT NULL DEFAULT 1,
        creado_por    INT DEFAULT NULL,
        creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_disc_config (curso_id, materia_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      INSERT IGNORE INTO disciplina_catalogo (id,tipo,codigo,nombre,puntos,activo) VALUES
      (1,'MERITO',  'M-01','Participación destacada en clase',          1.00, 1),
      (2,'MERITO',  'M-02','Trabajo sobresaliente',                     2.00, 1),
      (3,'MERITO',  'M-03','Puntualidad ejemplar (mes completo)',        1.00, 1),
      (4,'MERITO',  'M-04','Apoyo a compañeros',                        1.00, 1),
      (5,'MERITO',  'M-05','Iniciativa y liderazgo',                    2.00, 1),
      (6,'DEMERITO','D-01','Tardanza injustificada',                     1.00, 1),
      (7,'DEMERITO','D-02','Falta de respeto',                          3.00, 1),
      (8,'DEMERITO','D-03','Incumplimiento de tareas reiterativo',       2.00, 1),
      (9,'DEMERITO','D-04','Uso indebido de dispositivos en clase',      1.00, 1),
      (10,'DEMERITO','D-05','Conducta inapropiada',                     3.00, 1)`);

    console.log("✅ disciplina: tablas y catálogo listos");
  } catch(e) {
    console.warn("⚠️  seedDisciplina:", e.message);
  }
}

async function seedEvalInstPlantillas() {
  try {
    // 1. Crear tablas si no existen
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS eval_inst_plantillas (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        tipo       ENUM('CURSANTE_A_CURSANTE','CURSANTE_A_DOCENTE') NOT NULL,
        titulo     VARCHAR(200) NOT NULL,
        descripcion TEXT,
        activa     TINYINT(1) DEFAULT 1,
        creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS eval_inst_indicadores (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        plantilla_id INT NOT NULL,
        orden        INT DEFAULT 0,
        texto        TEXT NOT NULL,
        KEY (plantilla_id),
        CONSTRAINT fk_eii_plantilla FOREIGN KEY (plantilla_id)
          REFERENCES eval_inst_plantillas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS eval_inst_periodos (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        plantilla_id INT NOT NULL,
        curso_id     INT NOT NULL,
        materia_id   INT DEFAULT NULL,
        titulo       VARCHAR(200) DEFAULT NULL,
        habilitado   TINYINT(1) DEFAULT 1,
        fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_fin    DATETIME DEFAULT NULL,
        creado_por   INT DEFAULT NULL,
        creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY (plantilla_id), KEY (curso_id),
        CONSTRAINT fk_eip_plantilla FOREIGN KEY (plantilla_id) REFERENCES eval_inst_plantillas(id),
        CONSTRAINT fk_eip_curso     FOREIGN KEY (curso_id)     REFERENCES cursos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS eval_inst_respuestas (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        periodo_id   INT NOT NULL,
        evaluador_id INT NOT NULL,
        evaluado_id  INT DEFAULT NULL,
        completada   TINYINT(1) DEFAULT 0,
        enviado_en   DATETIME DEFAULT NULL,
        UNIQUE KEY uq_resp (periodo_id, evaluador_id, evaluado_id),
        CONSTRAINT fk_eir_periodo FOREIGN KEY (periodo_id) REFERENCES eval_inst_periodos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS eval_inst_valoraciones (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        respuesta_id INT NOT NULL,
        indicador_id INT NOT NULL,
        valor        TINYINT(4) NOT NULL DEFAULT 100,
        UNIQUE KEY uq_val (respuesta_id, indicador_id),
        KEY (indicador_id),
        CONSTRAINT fk_eiv_respuesta  FOREIGN KEY (respuesta_id) REFERENCES eval_inst_respuestas(id)  ON DELETE CASCADE,
        CONSTRAINT fk_eiv_indicador  FOREIGN KEY (indicador_id) REFERENCES eval_inst_indicadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // 2. Insertar datos semilla (INSERT IGNORE: seguro de correr múltiples veces)
    await pool.execute(`
      INSERT IGNORE INTO eval_inst_plantillas (id,tipo,titulo,descripcion,activa) VALUES
      (1,'CURSANTE_A_CURSANTE','Evaluación de Conducta entre Cursantes','Evaluación del comportamiento y actitudes de los cursantes por sus pares.',1),
      (2,'CURSANTE_A_DOCENTE','Evaluación Docente por Cursantes','Evaluación del desempeño docente realizada por los cursantes de cada materia.',1)`);

    await pool.execute(`
      INSERT IGNORE INTO eval_inst_indicadores (id,plantilla_id,orden,texto) VALUES
      (1,1,1,'Procede con las normas institucionales'),
      (2,1,2,'Asume sus decisiones y/o responde por sus acciones'),
      (3,1,3,'Trata a las personas con dignidad y controla sus emociones'),
      (4,1,4,'Participa, contribuye y comparte en la investigación y la difusión del conocimiento'),
      (5,2,1,'El Docente elabora y presenta el programa de la asignatura al inicio del módulo'),
      (6,2,2,'Cumple con el programa de la asignatura de acuerdo a lo planificado'),
      (7,2,3,'Desarrolla con claridad los temas y relaciona la teoría con la práctica'),
      (8,2,4,'Promueve la participación activa del cursante en el desarrollo de la clase'),
      (9,2,5,'Utiliza un tono adecuado de voz y lenguaje claro y técnico'),
      (10,2,6,'El trato al cursante es respetuoso dentro y fuera del aula'),
      (11,2,7,'Absuelve las dudas de los cursantes de manera oportuna y clara'),
      (12,2,8,'Desarrolla sus clases de manera amena y estimulante'),
      (13,2,9,'Transmite confianza al cursante para que participe y realice preguntas'),
      (14,2,10,'Evalúa las tareas asignadas de manera oportuna y dentro del plazo establecido'),
      (15,2,11,'Existe relación entre las preguntas de los exámenes y los temas avanzados'),
      (16,2,12,'Cumple con los horarios establecidos con puntualidad'),
      (17,2,13,'Demuestra compromiso con su labor y formación del cursante')`);

    console.log("✅ eval_inst: tablas y datos semilla listos");
  } catch(e) {
    console.warn("⚠️  seedEvalInstPlantillas:", e.message);
  }
}

/** GET /api/eval-inst/plantillas */
app.get("/api/eval-inst/plantillas", async (req,res) => {
  try {
    await seedEvalInstPlantillas();
    const [rows] = await pool.execute(
      `SELECT p.*, COUNT(i.id) AS total_indicadores
       FROM eval_inst_plantillas p
       LEFT JOIN eval_inst_indicadores i ON i.plantilla_id=p.id
       WHERE p.activa=1 GROUP BY p.id ORDER BY p.id`);
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
});

/** GET /api/eval-inst/plantillas/:id/indicadores */
app.get("/api/eval-inst/plantillas/:id/indicadores", async (req,res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM eval_inst_indicadores WHERE plantilla_id=? ORDER BY orden`, [req.params.id]);
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
});

/** POST /api/eval-inst/periodos — Jefe habilita una evaluación */
app.post("/api/eval-inst/periodos", async (req,res) => {
  try {
    const {plantilla_id,curso_id,materia_id,titulo,fecha_fin,creado_por} = req.body;
    if(!plantilla_id||!curso_id) return res.status(400).json({message:"plantilla_id y curso_id requeridos"});
    const [r] = await pool.execute(
      `INSERT INTO eval_inst_periodos (plantilla_id,curso_id,materia_id,titulo,fecha_fin,creado_por)
       VALUES (?,?,?,?,?,?)`,
      [plantilla_id,curso_id,materia_id||null,titulo||null,fecha_fin||null,creado_por||null]);
    res.status(201).json({message:"Evaluación habilitada",id:r.insertId});
  } catch(e){ res.status(500).json({message:e.message}); }
});

/** GET /api/eval-inst/periodos — lista todos los periodos */
app.get("/api/eval-inst/periodos", async (req,res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, pl.titulo AS plantilla_titulo, pl.tipo,
              c.nombre AS curso_nombre,
              m.nombre AS materia_nombre,
              (SELECT COUNT(*) FROM eval_inst_respuestas r WHERE r.periodo_id=p.id AND r.completada=1) AS completadas,
              (SELECT COUNT(*) FROM eval_inst_respuestas r WHERE r.periodo_id=p.id) AS total_asignadas
       FROM eval_inst_periodos p
       JOIN eval_inst_plantillas pl ON pl.id=p.plantilla_id
       JOIN cursos c ON c.id=p.curso_id
       LEFT JOIN curso_materias m ON m.id=p.materia_id
       ORDER BY p.creado_en DESC`);
    res.json(rows);
  } catch(e){ res.status(500).json({message:e.message}); }
});

/** PATCH /api/eval-inst/periodos/:id/toggle — habilitar/deshabilitar */
app.patch("/api/eval-inst/periodos/:id/toggle", async (req,res) => {
  try {
    const [r] = await pool.execute(
      `UPDATE eval_inst_periodos SET habilitado = NOT habilitado WHERE id=? LIMIT 1`,[req.params.id]);
    if(!r.affectedRows) return res.status(404).json({message:"No encontrado"});
    res.json({message:"Estado actualizado"});
  } catch(e){ res.status(500).json({message:e.message}); }
});

/**
 * GET /api/eval-inst/pendientes/:usuarioId
 */
app.get("/api/eval-inst/pendientes/:usuarioId", async (req,res) => {
  try {
    const uid = Number(req.params.usuarioId);
    const [periodos] = await pool.execute(
      `SELECT p.*, pl.titulo AS plantilla_titulo, pl.tipo,
              c.nombre AS curso_nombre, m.nombre AS materia_nombre
       FROM eval_inst_periodos p
       JOIN eval_inst_plantillas pl ON pl.id=p.plantilla_id
       JOIN cursos c ON c.id=p.curso_id
       LEFT JOIN curso_materias m ON m.id=p.materia_id
       JOIN curso_participantes cp ON cp.curso_id=p.curso_id AND cp.usuario_id=?
       WHERE p.habilitado=1
       ORDER BY p.creado_en DESC`, [uid]);
    const result = [];
    for(const per of periodos){
      if(per.tipo === 'CURSANTE_A_CURSANTE'){
        const [pares] = await pool.execute(
          `SELECT u.id,u.nombre,u.ap_paterno,u.ap_materno,u.grado,u.ci
           FROM curso_participantes cp
           JOIN usuarios u ON u.id=cp.usuario_id
           WHERE cp.curso_id=? AND cp.usuario_id!=?
           ORDER BY u.ap_paterno`, [per.curso_id, uid]);
        const pendientes = [];
        for(const par of pares){
          const [ex] = await pool.execute(
            `SELECT id,completada FROM eval_inst_respuestas WHERE periodo_id=? AND evaluador_id=? AND evaluado_id=? LIMIT 1`,
            [per.id, uid, par.id]);
          if(!ex.length || !ex[0].completada) pendientes.push(par);
        }
        if(pendientes.length) result.push({...per, pendientes, total_pares:pares.length});
      } else {
        const [ex] = await pool.execute(
          `SELECT id,completada FROM eval_inst_respuestas WHERE periodo_id=? AND evaluador_id=? LIMIT 1`,
          [per.id, uid]);
        if(!ex.length || !ex[0].completada) result.push({...per, pendientes:[], total_pares:1});
      }
    }
    res.json(result);
  } catch(e){
    if (isMissingTableError(e)) return res.json([]);
    res.status(500).json({message:e.message});
  }
});

/**
 * POST /api/eval-inst/responder
 */
app.post("/api/eval-inst/responder", async (req,res) => {
  const conn = await pool.getConnection();
  try {
    const {periodo_id,evaluador_id,evaluado_id,valoraciones,observaciones} = req.body;
    if(!periodo_id||!evaluador_id||!Array.isArray(valoraciones)||!valoraciones.length)
      return res.status(400).json({message:"Datos incompletos"});
    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO eval_inst_respuestas (periodo_id,evaluador_id,evaluado_id,completada,enviado_en)
       VALUES (?,?,?,1,NOW())
       ON DUPLICATE KEY UPDATE completada=1,enviado_en=NOW()`,
      [periodo_id,evaluador_id,evaluado_id||null]);
    let resp;
    if(evaluado_id){
      const [[r2]] = await conn.execute(
        `SELECT id FROM eval_inst_respuestas WHERE periodo_id=? AND evaluador_id=? AND evaluado_id=? LIMIT 1`,
        [periodo_id, evaluador_id, evaluado_id]);
      resp = r2;
    } else {
      const [[r2]] = await conn.execute(
        `SELECT id FROM eval_inst_respuestas WHERE periodo_id=? AND evaluador_id=? AND evaluado_id IS NULL LIMIT 1`,
        [periodo_id, evaluador_id]);
      resp = r2;
    }
    for(const v of valoraciones){
      await conn.execute(
        `INSERT INTO eval_inst_valoraciones (respuesta_id,indicador_id,valor)
         VALUES (?,?,?) ON DUPLICATE KEY UPDATE valor=?`,
        [resp.id,v.indicador_id,v.valor,v.valor]);
    }
    await conn.commit();
    res.json({message:"Evaluación enviada exitosamente"});
  } catch(e){
    try{await conn.rollback();}catch{}
    res.status(500).json({message:e.message});
  } finally { conn.release(); }
});

/** GET /api/eval-inst/periodos/:id/resultados-cursantes */
app.get("/api/eval-inst/periodos/:id/resultados-cursantes", async (req,res) => {
  try {
    const pid = Number(req.params.id);
    const [[periodo]] = await pool.execute(
      `SELECT p.*,pl.tipo FROM eval_inst_periodos p
       JOIN eval_inst_plantillas pl ON pl.id=p.plantilla_id WHERE p.id=? LIMIT 1`,[pid]);
    if(!periodo) return res.status(404).json({message:"Periodo no encontrado"});
    const [cursantes] = await pool.execute(
      `SELECT u.id,u.nombre,u.ap_paterno,u.ap_materno,u.grado,u.ci
       FROM curso_participantes cp
       JOIN usuarios u ON u.id=cp.usuario_id
       WHERE cp.curso_id=? ORDER BY u.ap_paterno,u.ap_materno`, [periodo.curso_id]);
    const resultados = [];
    for(const cur of cursantes){
      const [vals] = await pool.execute(
        `SELECT i.texto, i.orden, ROUND(AVG(v.valor),1) AS promedio, COUNT(v.id) AS total
         FROM eval_inst_respuestas r
         JOIN eval_inst_valoraciones v ON v.respuesta_id=r.id
         JOIN eval_inst_indicadores i ON i.id=v.indicador_id
         WHERE r.periodo_id=? AND r.evaluado_id=? AND r.completada=1
         GROUP BY i.id ORDER BY i.orden`,
        [pid, cur.id]);
      const promGeneral = vals.length
        ? Math.round(vals.reduce((a,v)=>a+Number(v.promedio),0)/vals.length) : null;
      const [evCount] = await pool.execute(
        `SELECT COUNT(*) AS total FROM eval_inst_respuestas
         WHERE periodo_id=? AND evaluado_id=? AND completada=1`,[pid,cur.id]);
      resultados.push({...cur, promedio_general:promGeneral, evaluadores:evCount[0].total, indicadores:vals});
    }
    res.json({ periodo, resultados });
  } catch(e){ res.status(500).json({message:e.message}); }
});

/** GET /api/eval-inst/periodos/:id/resultados */
app.get("/api/eval-inst/periodos/:id/resultados", async (req,res) => {
  try {
    const pid = Number(req.params.id);
    const [[periodo]] = await pool.execute(
      `SELECT p.*,pl.tipo,pl.titulo AS plantilla_titulo FROM eval_inst_periodos p
       JOIN eval_inst_plantillas pl ON pl.id=p.plantilla_id WHERE p.id=? LIMIT 1`,[pid]);
    if(!periodo) return res.status(404).json({message:"Periodo no encontrado"});
    const [indicadores] = await pool.execute(
      `SELECT i.* FROM eval_inst_indicadores i
       JOIN eval_inst_plantillas pl ON pl.id=i.plantilla_id
       JOIN eval_inst_periodos p ON p.plantilla_id=pl.id
       WHERE p.id=? ORDER BY i.orden`,[pid]);
    const [stats] = await pool.execute(
      `SELECT i.id AS indicador_id, i.texto,
              ROUND(AVG(v.valor),1) AS promedio,
              COUNT(v.id) AS total_respuestas
       FROM eval_inst_indicadores i
       JOIN eval_inst_valoraciones v ON v.indicador_id=i.id
       JOIN eval_inst_respuestas r ON r.id=v.respuesta_id
       WHERE r.periodo_id=?
       GROUP BY i.id ORDER BY i.id`,[pid]);
    const [participacion] = await pool.execute(
      `SELECT COUNT(DISTINCT evaluador_id) AS completaron,
              (SELECT COUNT(*) FROM curso_participantes WHERE curso_id=?) AS total
       FROM eval_inst_respuestas WHERE periodo_id=? AND completada=1`,[periodo.curso_id,pid]);
    res.json({periodo,indicadores,stats,participacion:participacion[0]});
  } catch(e){ res.status(500).json({message:e.message}); }
});

// ════════════════════════════════════════════════════════════
// TAREAS — ENDPOINTS EXTENDIDOS
// ════════════════════════════════════════════════════════════

/** POST /api/tareas/:tareaId/entregar — multipart/form-data: archivo (Word) + usuario_id */
app.post("/api/tareas/:tareaId/entregar", uploadTarea.single("archivo"), async (req,res) => {
  try {
    const tareaId = Number(req.params.tareaId);
    const usuario_id = Number(req.body?.usuario_id);
    if(!tareaId)    return res.status(400).json({message:"ID de tarea inválido"});
    if(!usuario_id) return res.status(400).json({message:"Campo requerido: usuario_id"});
    if(!req.file)   return res.status(400).json({message:"Se requiere un archivo Word (.doc / .docx)"});

    const archivoNombre = req.file.originalname;
    const archivoRuta   = req.file.filename;

    await pool.execute(
      `INSERT INTO tarea_entregas (tarea_id,usuario_id,estado,respuesta,archivo_nombre,archivo_ruta,entregado_en)
       VALUES (?,?,'ENTREGADO',NULL,?,?,NOW())
       ON DUPLICATE KEY UPDATE
         estado='ENTREGADO',
         respuesta=NULL,
         archivo_nombre=VALUES(archivo_nombre),
         archivo_ruta=VALUES(archivo_ruta),
         entregado_en=NOW(),
         actualizado_en=NOW()`,
      [tareaId, usuario_id, archivoNombre, archivoRuta]);
    res.json({message:"Tarea entregada exitosamente", archivo_nombre: archivoNombre});
  } catch(e){
    if(req.file) fs.unlink(path.join(UPLOADS_DIR, req.file.filename), ()=>{});
    if(e.message?.includes("Solo se permiten")) return res.status(400).json({message:e.message});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

/** GET /api/tareas/:tareaId/mi-entrega/:usuarioId */
app.get("/api/tareas/:tareaId/mi-entrega/:usuarioId", async (req,res) => {
  try {
    const tareaId   = Number(req.params.tareaId);
    const usuarioId = Number(req.params.usuarioId);
    if(!tareaId||!usuarioId) return res.status(400).json({message:"IDs inválidos"});
    const [r] = await pool.execute(
      `SELECT te.id, te.estado, te.respuesta, te.archivo_nombre, te.archivo_ruta,
              te.nota, te.feedback, te.entregado_en,
              t.titulo, t.descripcion, t.fecha_limite
       FROM tarea_entregas te INNER JOIN tareas t ON t.id=te.tarea_id
       WHERE te.tarea_id=? AND te.usuario_id=? LIMIT 1`,
      [tareaId, usuarioId]);
    if(!r.length) return res.status(404).json({message:"Entrega no encontrada"});
    res.json(r[0]);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** GET /api/tareas/materia/:materiaId/resumen */
app.get("/api/tareas/materia/:materiaId/resumen", async (req,res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if(!materiaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT t.id, t.titulo, t.descripcion, t.fecha_limite, t.creado_en,
              COUNT(te.id) AS total,
              SUM(te.estado='ENTREGADO') AS entregadas,
              SUM(te.estado='PENDIENTE') AS pendientes,
              SUM(te.estado='ENTREGADO' AND te.nota IS NOT NULL) AS calificadas,
              SUM(te.estado='ENTREGADO' AND te.nota IS NULL) AS sin_calificar,
              ROUND(AVG(CASE WHEN te.nota IS NOT NULL THEN te.nota END),1) AS promedio_nota
       FROM tareas t LEFT JOIN tarea_entregas te ON te.tarea_id=t.id
       WHERE t.materia_id=?
       GROUP BY t.id ORDER BY t.creado_en DESC`,[materiaId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** GET /api/tareas/:tareaId/entregas/detalle */
app.get("/api/tareas/:tareaId/entregas/detalle", async (req,res) => {
  try {
    const tareaId = Number(req.params.tareaId);
    if(!tareaId) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `SELECT te.id, te.usuario_id, te.estado, te.respuesta, te.archivo_nombre, te.archivo_ruta,
              te.nota, te.feedback, te.entregado_en, te.actualizado_en,
              u.nombre, u.ap_paterno, u.ap_materno, u.ci,
              t.titulo AS tarea_titulo, t.fecha_limite, t.descripcion AS tarea_desc
       FROM tarea_entregas te
       INNER JOIN usuarios u ON u.id=te.usuario_id
       INNER JOIN tareas t ON t.id=te.tarea_id
       WHERE te.tarea_id=?
       ORDER BY te.estado DESC, te.entregado_en DESC, u.ap_paterno ASC`,[tareaId]);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** POST /api/tareas/:tareaId/entregas/:usuarioId/calificar */
app.post("/api/tareas/:tareaId/entregas/:usuarioId/calificar", async (req,res) => {
  try {
    const tareaId   = Number(req.params.tareaId);
    const usuarioId = Number(req.params.usuarioId);
    const { nota, feedback, calificado_por } = req.body;
    if(!tareaId||!usuarioId) return res.status(400).json({message:"IDs inválidos"});
    if(nota===undefined||nota===null) return res.status(400).json({message:"Campo requerido: nota"});
    const notaNum = Math.min(100, Math.max(0, Number(nota)||0));
    const [result] = await pool.execute(
      `UPDATE tarea_entregas SET nota=?, feedback=?, calificado_por=?, actualizado_en=NOW()
       WHERE tarea_id=? AND usuario_id=? LIMIT 1`,
      [notaNum, feedback??null, calificado_por??null, tareaId, usuarioId]);
    if(result.affectedRows===0) return res.status(404).json({message:"Entrega no encontrada"});
    res.json({message:"Tarea calificada", nota:notaNum});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// HORARIOS
// ════════════════════════════════════════════════════════════

/** GET /api/horarios?curso_id=X&fecha_inicio=Y&fecha_fin=Z */
app.get("/api/horarios", async (req,res) => {
  try {
    const {curso_id, fecha_inicio, fecha_fin} = req.query;
    if(!curso_id) return res.status(400).json({message:"curso_id requerido"});
    let sql = `SELECT h.id,h.curso_id,h.materia_id,h.fecha,h.hora_inicio,h.hora_fin,
                      h.aula,h.observacion,h.creado_en,
                      m.nombre AS materia_nombre,
                      u.nombre AS docente_nombre,u.ap_paterno AS docente_ap
               FROM horarios h
               JOIN curso_materias m ON m.id=h.materia_id
               LEFT JOIN usuarios u ON u.id=m.docente_id
               WHERE h.curso_id=?`;
    const params = [Number(curso_id)];
    if(fecha_inicio){sql+=` AND h.fecha>=?`; params.push(fecha_inicio);}
    if(fecha_fin)   {sql+=` AND h.fecha<=?`; params.push(fecha_fin);}
    sql += ` ORDER BY h.fecha ASC, h.hora_inicio ASC`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** POST /api/horarios — Crear horario */
app.post("/api/horarios", async (req,res) => {
  try {
    const {curso_id,materia_id,fecha,hora_inicio,hora_fin,aula,observacion,creado_por} = req.body;
    if(!curso_id)    return res.status(400).json({message:"Campo requerido: curso_id"});
    if(!materia_id)  return res.status(400).json({message:"Campo requerido: materia_id"});
    if(!fecha)       return res.status(400).json({message:"Campo requerido: fecha"});
    if(!hora_inicio) return res.status(400).json({message:"Campo requerido: hora_inicio"});
    if(!hora_fin)    return res.status(400).json({message:"Campo requerido: hora_fin"});
    if(hora_fin<=hora_inicio) return res.status(400).json({message:"hora_fin debe ser mayor a hora_inicio"});

    const [r] = await pool.execute(
      `INSERT INTO horarios (curso_id,materia_id,fecha,hora_inicio,hora_fin,aula,observacion,creado_por)
       VALUES (?,?,?,?,?,?,?,?)`,
      [curso_id,materia_id,fecha,hora_inicio,hora_fin,aula||null,observacion||null,creado_por||null]);
    res.status(201).json({message:"Horario creado",id:r.insertId});
  } catch(e){
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Ya existe un horario en ese slot (mismo curso, fecha, hora y aula)."});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

/** DELETE /api/horarios/:id */
app.delete("/api/horarios/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(`DELETE FROM horarios WHERE id=? LIMIT 1`,[id]);
    if(!r.affectedRows) return res.status(404).json({message:"Horario no encontrado"});
    res.json({message:"Horario eliminado"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** PUT /api/horarios/:id — Editar horario */
app.put("/api/horarios/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    const {materia_id,fecha,hora_inicio,hora_fin,aula,observacion} = req.body;
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [r] = await pool.execute(
      `UPDATE horarios SET materia_id=?,fecha=?,hora_inicio=?,hora_fin=?,aula=?,observacion=?
       WHERE id=? LIMIT 1`,
      [materia_id,fecha,hora_inicio,hora_fin,aula||null,observacion||null,id]);
    if(!r.affectedRows) return res.status(404).json({message:"Horario no encontrado"});
    res.json({message:"Horario actualizado"});
  } catch(e){
    if(e?.code==="ER_DUP_ENTRY") return res.status(409).json({message:"Conflicto: ya existe un horario en ese slot."});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});


// ════════════════════════════════════════════════════════════
// FINANZAS
// ════════════════════════════════════════════════════════════

/** GET /api/finanzas/conceptos?curso_id=X */
app.get("/api/finanzas/conceptos", async (req,res) => {
  try {
    const {curso_id} = req.query;
    if(!curso_id) return res.status(400).json({message:"curso_id requerido"});
    const [rows] = await pool.execute(
      `SELECT * FROM finanzas_conceptos WHERE curso_id=? AND activo=1
       ORDER BY FIELD(tipo,'MATRICULA','GUIA','MENSUALIDAD'), mes ASC, anio ASC`,
      [Number(curso_id)]);
    res.json(rows);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** POST /api/finanzas/conceptos — Crear concepto */
app.post("/api/finanzas/conceptos", async (req,res) => {
  try {
    const {curso_id,tipo,descripcion,monto,fecha_venc,mes,anio,creado_por} = req.body;
    if(!curso_id) return res.status(400).json({message:"curso_id requerido"});
    if(!["MATRICULA","GUIA","MENSUALIDAD","OTRO"].includes(tipo))
      return res.status(400).json({message:"tipo inválido"});
    if(!monto || Number(monto)<=0) return res.status(400).json({message:"monto debe ser mayor a 0"});

    const [r] = await pool.execute(
      `INSERT INTO finanzas_conceptos (curso_id,tipo,descripcion,monto,fecha_venc,mes,anio,creado_por)
       VALUES (?,?,?,?,?,?,?,?)`,
      [curso_id,tipo,descripcion||null,Number(monto),fecha_venc||null,
       mes?Number(mes):null, anio?Number(anio):null, creado_por||null]);

    const [parts] = await pool.execute(
      `SELECT usuario_id FROM curso_participantes WHERE curso_id=?`,[curso_id]);
    if(parts.length){
      const vals = parts.map(()=>"(?,?,?,'PENDIENTE')").join(",");
      await pool.execute(
        `INSERT IGNORE INTO finanzas_pagos (concepto_id,usuario_id,curso_id,estado) VALUES ${vals}`,
        parts.flatMap(p=>[r.insertId, p.usuario_id, curso_id]));
    }
    res.status(201).json({message:"Concepto creado",id:r.insertId,pagos_generados:parts.length});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/** DELETE /api/finanzas/conceptos/:id */
app.delete("/api/finanzas/conceptos/:id", async (req,res) => {
  try {
    const [r] = await pool.execute(
      `UPDATE finanzas_conceptos SET activo=0 WHERE id=? LIMIT 1`,[req.params.id]);
    if(!r.affectedRows) return res.status(404).json({message:"No encontrado"});
    res.json({message:"Concepto eliminado"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/**
 * GET /api/finanzas/pagos?curso_id=X
 * Retorna resumen de pagos de todos los participantes del curso
 */
app.get("/api/finanzas/pagos", async (req,res) => {
  try {
    const {curso_id} = req.query;
    if(!curso_id) return res.status(400).json({message:"curso_id requerido"});

    const [participantes] = await pool.execute(
      `SELECT u.id,u.nombre,u.ap_paterno,u.ap_materno,u.ci,u.grado
       FROM curso_participantes cp
       JOIN usuarios u ON u.id=cp.usuario_id
       WHERE cp.curso_id=? ORDER BY u.ap_paterno,u.ap_materno`,
      [Number(curso_id)]);

    const [conceptos] = await pool.execute(
      `SELECT * FROM finanzas_conceptos WHERE curso_id=? AND activo=1
       ORDER BY FIELD(tipo,'MATRICULA','GUIA','MENSUALIDAD','OTRO'),mes,anio`,
      [Number(curso_id)]);

    const [pagos] = await pool.execute(
      `SELECT fp.*,fc.tipo,fc.descripcion,fc.monto AS monto_concepto,fc.mes,fc.anio,fc.fecha_venc
       FROM finanzas_pagos fp
       JOIN finanzas_conceptos fc ON fc.id=fp.concepto_id
       WHERE fp.curso_id=?`, [Number(curso_id)]);

    const pagoMap = {};
    for(const p of pagos){
      if(!pagoMap[p.usuario_id]) pagoMap[p.usuario_id] = {};
      pagoMap[p.usuario_id][p.concepto_id] = p;
    }

    const resultado = participantes.map(u => ({
      ...u,
      pagos: conceptos.map(c => ({
        concepto_id: c.id,
        tipo: c.tipo,
        descripcion: c.descripcion,
        monto: c.monto,
        mes: c.mes,
        anio: c.anio,
        fecha_venc: c.fecha_venc,
        ...(pagoMap[u.id]?.[c.id] || {estado:"PENDIENTE",monto_pagado:null,fecha_pago:null,comprobante:null})
      }))
    }));

    res.json({conceptos, participantes: resultado});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/**
 * PATCH /api/finanzas/pagos/:conceptoId/:usuarioId
 * Registrar pago o cambiar estado
 */
app.patch("/api/finanzas/pagos/:conceptoId/:usuarioId", async (req,res) => {
  try {
    const {conceptoId, usuarioId} = req.params;
    const {estado,monto_pagado,fecha_pago,comprobante,observacion,registrado_por} = req.body;

    if(!["PENDIENTE","PAGADO","EXONERADO","MORA"].includes(estado))
      return res.status(400).json({message:"estado inválido"});

    const [[concepto]] = await pool.execute(
      `SELECT curso_id FROM finanzas_conceptos WHERE id=? LIMIT 1`,[conceptoId]);
    if(!concepto) return res.status(404).json({message:"Concepto no encontrado"});

    await pool.execute(
      `INSERT INTO finanzas_pagos (concepto_id,usuario_id,curso_id,estado,monto_pagado,fecha_pago,comprobante,observacion,registrado_por)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE estado=VALUES(estado),monto_pagado=VALUES(monto_pagado),
         fecha_pago=VALUES(fecha_pago),comprobante=VALUES(comprobante),
         observacion=VALUES(observacion),registrado_por=VALUES(registrado_por)`,
      [conceptoId,usuarioId,concepto.curso_id,estado,
       monto_pagado?Number(monto_pagado):null, fecha_pago||null,
       comprobante||null, observacion||null, registrado_por||null]);

    res.json({message:"Pago actualizado"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

/**
 * GET /api/finanzas/estado/:usuarioId
 * Verifica si el cursante tiene pagos en MORA que bloqueen su acceso
 */
app.get("/api/finanzas/estado/:usuarioId", async (req,res) => {
  try {
    const uid = Number(req.params.usuarioId);
    const hoy = new Date().toISOString().slice(0,10);

    const [mora] = await pool.execute(
      `SELECT fp.id, fc.descripcion, fc.tipo, fc.mes, fc.anio, fc.fecha_venc, fc.monto,
              fp.estado, c.nombre AS curso_nombre
       FROM finanzas_pagos fp
       JOIN finanzas_conceptos fc ON fc.id=fp.concepto_id
       JOIN cursos c ON c.id=fp.curso_id
       WHERE fp.usuario_id=? AND fp.estado='MORA' AND fc.activo=1`,
      [uid]);

    const [vencidas] = await pool.execute(
      `SELECT fp.id, fc.descripcion, fc.tipo, fc.mes, fc.anio, fc.fecha_venc, fc.monto,
              fp.estado, c.nombre AS curso_nombre
       FROM finanzas_pagos fp
       JOIN finanzas_conceptos fc ON fc.id=fp.concepto_id
       JOIN cursos c ON c.id=fp.curso_id
       WHERE fp.usuario_id=? AND fp.estado='PENDIENTE'
         AND fc.tipo='MENSUALIDAD' AND fc.activo=1
         AND fc.fecha_venc IS NOT NULL
         AND DATEDIFF(?, fc.fecha_venc) > 30`,
      [uid, hoy]);

    const bloqueado = mora.length > 0 || vencidas.length > 0;
    const deudas = [...mora, ...vencidas];

    res.json({bloqueado, deudas, total_deuda: deudas.reduce((s,d)=>s+Number(d.monto),0)});
  } catch(e){
    if (isMissingTableError(e)) return res.json({bloqueado:false,deudas:[],total_deuda:0});
    res.status(500).json({message:"Error interno",detail:e.message});
  }
});

/**
 * GET /api/finanzas/resumen/:usuarioId
 * Resumen financiero del cursante
 */
app.get("/api/finanzas/resumen/:usuarioId", async (req,res) => {
  try {
    const uid = Number(req.params.usuarioId);
    const [rows] = await pool.execute(
      `SELECT fp.estado, fc.tipo, fc.descripcion, fc.monto, fc.mes, fc.anio,
              fc.fecha_venc, fp.monto_pagado, fp.fecha_pago, fp.comprobante,
              c.nombre AS curso_nombre
       FROM finanzas_pagos fp
       JOIN finanzas_conceptos fc ON fc.id=fp.concepto_id
       JOIN cursos c ON c.id=fp.curso_id
       WHERE fp.usuario_id=? AND fc.activo=1
       ORDER BY FIELD(fc.tipo,'MATRICULA','GUIA','MENSUALIDAD'),fc.anio,fc.mes`,
      [uid]);
    res.json(rows);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// DISCIPLINA — 
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// DISCIPLINA // ════════════════════════════════════════════════════════════

// GET /api/disciplina/catalogo
app.get("/api/disciplina/catalogo", async (req, res) => {
  try {
    await seedDisciplina();
    const [rows] = await pool.query(
      `SELECT * FROM disciplina_catalogo WHERE activo=1 ORDER BY tipo, puntos DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

// GET /api/disciplina/resumen/:cursoId?materia_id=  — solo cursantes (tipo_usuario = 'Cursante')
app.get("/api/disciplina/resumen/:cursoId", async (req, res) => {
  const { cursoId } = req.params;
  const materiaId = req.query.materia_id ? Number(req.query.materia_id) : null;

  // 1. Siempre obtenemos los cursantes del curso (query simple, nunca falla)
  let cursantes = [];
  try {
    const [rows] = await pool.query(
      `SELECT u.id AS usuario_id, u.nombre, u.ap_paterno, u.ap_materno, u.ci, u.grado
       FROM usuarios u
       JOIN curso_participantes cp ON cp.usuario_id = u.id AND cp.curso_id = ?
       WHERE u.tipo_usuario = 'Cursante'
       ORDER BY u.ap_paterno, u.ap_materno`,
      [cursoId]
    );
    cursantes = rows;
  } catch (e) {
    return res.status(500).json({ message: "Error al obtener cursantes", detail: e.message });
  }

  if (!cursantes.length) return res.json([]);

  // 2. Datos de disciplina: primero intenta filtrar por materia_id,
  //    si la columna no existe (migración pendiente) cae al query solo por curso_id.
  const DISC_AGG = `
    SELECT usuario_id,
      COALESCE(SUM(CASE WHEN tipo='MERITO'   THEN puntos ELSE 0 END), 0) AS meritos,
      COALESCE(SUM(CASE WHEN tipo='DEMERITO' THEN puntos ELSE 0 END), 0) AS demeritos,
      COALESCE(SUM(CASE WHEN tipo='MERITO'   THEN puntos ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN tipo='DEMERITO' THEN puntos ELSE 0 END), 0) AS saldo,
      COUNT(CASE WHEN tipo='MERITO'   THEN 1 END) AS cant_meritos,
      COUNT(CASE WHEN tipo='DEMERITO' THEN 1 END) AS cant_demeritos
    FROM disciplina_registros
    WHERE curso_id = ?`;
  let discMap = {};
  try {
    // Con materia_id (requiere migración)
    const [discRows] = await pool.query(
      `${DISC_AGG} AND materia_id = ? GROUP BY usuario_id`,
      [cursoId, materiaId || 0]
    );
    for (const r of discRows) discMap[r.usuario_id] = r;
  } catch (_) {
    // Migración pendiente: muestra registros del curso sin filtro de materia
    try {
      const [discRows] = await pool.query(
        `${DISC_AGG} GROUP BY usuario_id`, [cursoId]
      );
      for (const r of discRows) discMap[r.usuario_id] = r;
    } catch (_2) { /* tabla no existe */ }
  }

  const resultado = cursantes.map(u => ({
    ...u,
    meritos:       Number(discMap[u.usuario_id]?.meritos      ?? 0),
    demeritos:     Number(discMap[u.usuario_id]?.demeritos     ?? 0),
    saldo:         Number(discMap[u.usuario_id]?.saldo         ?? 0),
    cant_meritos:  Number(discMap[u.usuario_id]?.cant_meritos  ?? 0),
    cant_demeritos:Number(discMap[u.usuario_id]?.cant_demeritos ?? 0),
  }));

  res.json(resultado);
});

// GET /api/disciplina/historial/:cursoId/:usuarioId?materia_id=
app.get("/api/disciplina/historial/:cursoId/:usuarioId", async (req, res) => {
  try {
    const { cursoId, usuarioId } = req.params;
    const materiaId = req.query.materia_id ? Number(req.query.materia_id) : null;
    try {
      const [rows] = await pool.query(
        `SELECT dr.id, dr.tipo, dr.descripcion, dr.puntos, dr.fecha, dr.observacion, dr.creado_en,
                dr.materia_id, cm.nombre AS materia_nombre,
                dc.codigo, dc.nombre AS catalogo_nombre,
                CONCAT(u.ap_paterno,' ',u.ap_materno,' ',u.nombre) AS registrado_por_nombre
         FROM disciplina_registros dr
         LEFT JOIN disciplina_catalogo dc ON dc.id = dr.catalogo_id
         LEFT JOIN curso_materias cm ON cm.id = dr.materia_id
         JOIN usuarios u ON u.id = dr.registrado_por
         WHERE dr.curso_id = ? AND dr.usuario_id = ?
           AND dr.materia_id = ?
         ORDER BY dr.fecha DESC, dr.creado_en DESC`,
        [cursoId, usuarioId, materiaId || 0]
      );
      res.json(rows);
    } catch (_) {
      // columna materia_id no existe aún — fallback sin filtro de materia
      const [rows] = await pool.query(
        `SELECT dr.id, dr.tipo, dr.descripcion, dr.puntos, dr.fecha, dr.observacion, dr.creado_en,
                dc.codigo, dc.nombre AS catalogo_nombre,
                CONCAT(u.ap_paterno,' ',u.ap_materno,' ',u.nombre) AS registrado_por_nombre
         FROM disciplina_registros dr
         LEFT JOIN disciplina_catalogo dc ON dc.id = dr.catalogo_id
         JOIN usuarios u ON u.id = dr.registrado_por
         WHERE dr.curso_id = ? AND dr.usuario_id = ?
         ORDER BY dr.fecha DESC, dr.creado_en DESC`,
        [cursoId, usuarioId]
      );
      res.json(rows);
    }
  } catch (e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

// POST /api/disciplina/registrar
app.post("/api/disciplina/registrar", async (req, res) => {
  try {
    const { curso_id, materia_id, usuario_id, catalogo_id, tipo, descripcion, puntos, fecha, registrado_por, observacion } = req.body;
    if (!curso_id || !usuario_id || !tipo || !descripcion || !puntos || !fecha || !registrado_por) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }
    try {
      // Intenta insertar con materia_id (requiere migración aplicada)
      const [result] = await pool.query(
        `INSERT INTO disciplina_registros
           (curso_id, materia_id, usuario_id, catalogo_id, tipo, descripcion, puntos, fecha, registrado_por, observacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [curso_id, materia_id || null, usuario_id, catalogo_id || null, tipo, descripcion, puntos, fecha, registrado_por, observacion || null]
      );
      res.json({ id: result.insertId, message: "Registro guardado" });
    } catch (_) {
      // Fallback sin materia_id si la columna no existe aún
      const [result] = await pool.query(
        `INSERT INTO disciplina_registros
           (curso_id, usuario_id, catalogo_id, tipo, descripcion, puntos, fecha, registrado_por, observacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [curso_id, usuario_id, catalogo_id || null, tipo, descripcion, puntos, fecha, registrado_por, observacion || null]
      );
      res.json({ id: result.insertId, message: "Registro guardado (sin materia — migración pendiente)" });
    }
  } catch (e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

// DELETE /api/disciplina/registro/:id
app.delete("/api/disciplina/registro/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM disciplina_registros WHERE id = ?`, [id]);
    res.json({ message: "Registro eliminado" });
  } catch (e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

// ════════════════════════════════════════════════════════════
// NOTIFICACIONES
// ════════════════════════════════════════════════════════════
app.get("/api/notificaciones/stats", async (req,res) => {
  try {
    const [[{total}]]          = await pool.query(`SELECT COUNT(*) AS total FROM notificaciones WHERE activa=1`);
    const [[{urgentes}]]       = await pool.query(`SELECT COUNT(*) AS urgentes FROM notificaciones WHERE activa=1 AND tipo='URGENTE'`);
    const [[{total_usuarios}]] = await pool.query(`SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE estado='ACTIVO'`);
    res.json({total,urgentes,total_usuarios});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.get("/api/notificaciones", async (req,res) => {
  try {
    const uid = req.query.usuario_id?Number(req.query.usuario_id):null;
    let sql,params=[];
    if(uid){
      sql=`SELECT n.id,n.titulo,n.mensaje,n.tipo,n.creado_por,n.creado_en,n.activa,
                  u.nombre AS emisor_nombre,u.ap_paterno AS emisor_ap_paterno,
                  IF(nl.notificacion_id IS NOT NULL,1,0) AS leida
           FROM notificaciones n LEFT JOIN usuarios u ON u.id=n.creado_por
           LEFT JOIN notificaciones_leidas nl ON nl.notificacion_id=n.id AND nl.usuario_id=?
           WHERE n.activa=1 ORDER BY n.creado_en DESC`;
      params=[uid];
    } else {
      sql=`SELECT n.id,n.titulo,n.mensaje,n.tipo,n.creado_por,n.creado_en,n.activa,
                  u.nombre AS emisor_nombre,u.ap_paterno AS emisor_ap_paterno,
                  (SELECT COUNT(*) FROM notificaciones_leidas nl WHERE nl.notificacion_id=n.id) AS total_leidas
           FROM notificaciones n LEFT JOIN usuarios u ON u.id=n.creado_por
           ORDER BY n.creado_en DESC`;
    }
    const [r] = await pool.execute(sql,params);
    res.json(r);
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.post("/api/notificaciones", async (req,res) => {
  try {
    const {titulo,mensaje,tipo,creado_por} = req.body;
    if(!String(titulo??"").trim()) return res.status(400).json({message:"Campo requerido: titulo"});
    if(!String(mensaje??"").trim()) return res.status(400).json({message:"Campo requerido: mensaje"});
    const tipoFinal = String(tipo??"INFO").toUpperCase();
    if(!["INFO","ALERTA","URGENTE"].includes(tipoFinal)) return res.status(400).json({message:"tipo debe ser INFO, ALERTA o URGENTE"});
    const [result] = await pool.execute(`INSERT INTO notificaciones (titulo,mensaje,tipo,creado_por) VALUES (?,?,?,?)`,[titulo.trim(),mensaje.trim(),tipoFinal,creado_por??null]);
    res.status(201).json({message:"Notificación creada",id:result.insertId});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.delete("/api/notificaciones/:id", async (req,res) => {
  try {
    const id = Number(req.params.id);
    if(!id) return res.status(400).json({message:"ID inválido"});
    const [result] = await pool.execute(`UPDATE notificaciones SET activa=0 WHERE id=? LIMIT 1`,[id]);
    if(result.affectedRows===0) return res.status(404).json({message:"Notificación no encontrada"});
    res.json({message:"Notificación desactivada"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

app.post("/api/notificaciones/:id/leer", async (req,res) => {
  try {
    const notifId=Number(req.params.id), usuarioId=Number(req.body.usuario_id);
    if(!notifId||!usuarioId) return res.status(400).json({message:"Campos requeridos: id y usuario_id"});
    await pool.execute(`INSERT IGNORE INTO notificaciones_leidas (notificacion_id,usuario_id) VALUES (?,?)`,[notifId,usuarioId]);
    res.json({message:"Notificación marcada como leída"});
  } catch(e){ res.status(500).json({message:"Error interno",detail:e.message}); }
});

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * body: { ci, password }
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { ci, password } = req.body;
    if (!String(ci    ?? "").trim()) return res.status(400).json({ message: "Campo requerido: ci" });
    if (!String(password ?? "").trim()) return res.status(400).json({ message: "Campo requerido: password" });

    const [rows] = await pool.execute(
      `SELECT id, nombre, ap_paterno, ap_materno, ci, correo, email,
              grado, tipo_usuario, rol, estado, password AS password_hash
       FROM usuarios WHERE ci = ? LIMIT 1`,
      [String(ci).trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Carnet de identidad o contraseña incorrectos." });
    }

    const usuario = rows[0];

    if (String(usuario.estado ?? "").toUpperCase() !== "ACTIVO") {
      return res.status(403).json({ message: "Su cuenta está inactiva. Contacte al administrador." });
    }

    const hash = String(usuario.password_hash ?? "");

    let valid = false;
    if (hash.startsWith("$2b$") || hash.startsWith("$2a$")) {
      valid = await bcrypt.compare(String(password), hash);
    } else {
      valid = hash === String(password);
      if (valid) {
        const nuevoHash = await bcrypt.hash(String(password), 10);
        await pool.execute(`UPDATE usuarios SET password=? WHERE id=? LIMIT 1`, [nuevoHash, usuario.id]);
        console.log(`[auth] Password migrado a bcrypt para usuario id=${usuario.id}`);
      }
    }

    if (!valid) {
      return res.status(401).json({ message: "Carnet de identidad o contraseña incorrectos." });
    }

    const { password_hash, ...sesion } = usuario;
    return res.json({ message: "Login exitoso", usuario: sesion });

  } catch (e) {
    console.error("[auth/login]", e);
    return res.status(500).json({ message: "Error interno del servidor.", detail: e.message });
  }
});

// ── Manejador de errores de multer ───────────────────────────
// Sirve el frontend construido y reenvia rutas internas a React Router.
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message: "El archivo supera el límite de 5 MB" });
  if (err?.message)
    return res.status(400).json({ message: err.message });
  res.status(500).json({ message: "Error interno" });
});

// ════════════════════════════════════════════════════════════
// EVAL FACILITADOR  —  El docente evalúa al cursante en 4 criterios fijos
// Pesos fijos del sistema: Catedrático 90% | Facilitador 2.5% | Cursantes 5% | Disciplina 2.5%
// ════════════════════════════════════════════════════════════

// Auto-crear tabla si no existe
pool.execute(`
  CREATE TABLE IF NOT EXISTS eval_facilitador (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    curso_id     INT NOT NULL,
    materia_id   INT NOT NULL,
    cursante_id  INT NOT NULL,
    registrado_por INT NOT NULL,
    c1 DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'Aporte de información',
    c2 DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'Aprecia los hechos objetivamente',
    c3 DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'Decide con Acierto',
    c4 DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'Sostiene criterios con seguridad',
    bloqueado TINYINT(1) NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_fac (materia_id, cursante_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`).catch(e => console.warn("[eval_facilitador] tabla ya existe o error:", e.message));
pool.execute(`
  ALTER TABLE eval_facilitador
    ADD COLUMN IF NOT EXISTS bloqueado TINYINT(1) NOT NULL DEFAULT 0 AFTER c4
`).catch(e => console.warn("[eval_facilitador] columna bloqueado ya existe o error:", e.message));

/** GET /api/eval-facilitador/materia/:materiaId
 *  Devuelve los valores en escala 1-10 tal como fueron ingresados por el docente.
 */
app.get("/api/eval-facilitador/materia/:materiaId", async (req, res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if (!materiaId) return res.status(400).json({ message: "ID inválido" });
    const [rows] = await pool.execute(
      `SELECT cursante_id, c1, c2, c3, c4, bloqueado,
              ROUND((c1+c2+c3+c4)/4, 2) AS promedio,
              ROUND((c1+c2+c3+c4)/4/10*2.5, 3) AS ponderaje,
              actualizado_en
       FROM eval_facilitador WHERE materia_id = ?`, [materiaId]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

/** POST /api/eval-facilitador
 *  body: { curso_id, materia_id, evaluaciones:[{cursante_id, c1, c2, c3, c4}], registrado_por }
 */
app.post("/api/eval-facilitador", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { curso_id, materia_id, evaluaciones, registrado_por, bloquear } = req.body;
    if (!curso_id || !materia_id || !registrado_por || !Array.isArray(evaluaciones))
      return res.status(400).json({ message: "Faltan campos requeridos" });

    await conn.beginTransaction();
    let guardadas = 0;
    let omitidas = 0;
    for (const ev of evaluaciones) {
      const { cursante_id, c1, c2, c3, c4 } = ev;
      if (!cursante_id) continue;
      const [[actual]] = await conn.execute(
        `SELECT bloqueado FROM eval_facilitador WHERE materia_id=? AND cursante_id=? LIMIT 1`,
        [materia_id, cursante_id]
      );
      if (actual?.bloqueado) {
        omitidas++;
        continue;
      }
      const norm = [c1,c2,c3,c4].map(v => Math.min(10, Math.max(0, Number(v) || 0)));
      await conn.execute(
        `INSERT INTO eval_facilitador (curso_id, materia_id, cursante_id, registrado_por, c1, c2, c3, c4, bloqueado)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE c1=VALUES(c1),c2=VALUES(c2),c3=VALUES(c3),c4=VALUES(c4),
           bloqueado=GREATEST(bloqueado, VALUES(bloqueado)),
           registrado_por=VALUES(registrado_por), actualizado_en=NOW()`,
        [curso_id, materia_id, cursante_id, registrado_por, ...norm, bloquear ? 1 : 0]
      );
      guardadas++;
    }
    await conn.commit();
    res.json({ message: "Evaluaciones guardadas", guardadas, omitidas, bloqueado: !!bloquear });
  } catch(e) { try{await conn.rollback();}catch{}res.status(500).json({ message: "Error interno", detail: e.message }); }
  finally { conn.release(); }
});

const SHD_PESOS = { SABER: 0.30, HACER: 0.40, DECIDIR: 0.20 }; // suman 0.90

/** GET /api/nota-final/materia/:materiaId
 *  Fórmula: nota_final = prom_catedratico(0-90) + facilitador(0-2.5) + cursantes(0-5) + disciplina(0-2.5)
 *  Catedrático: usa SHD si hay datos; fallback a eval_config legacy.
 */
app.get("/api/nota-final/materia/:materiaId", async (req, res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if (!materiaId) return res.status(400).json({ message: "ID inválido" });

    const materia = await assertMateriaExists(pool, materiaId);
    if (!materia) return res.status(404).json({ message: "Materia no encontrada" });
    const cursoId = materia.curso_id;

    // ── 1. Catedrático (90%) — SHD si hay datos, eval_config como fallback ──────
    let usaSHD = false;
    let promCatedraticoMap = {};    // { usuario_id → 0-90 }
    let shdDimMap = {};             // { usuario_id → { SABER, HACER, DECIDIR } 0-100 }
    let notaMinApro = 70;

    try {
      const [shdIndicadores] = await pool.execute(
        `SELECT id, dimension FROM shd_indicadores ORDER BY orden ASC`);
      const [shdNotaRows] = await pool.execute(
        `SELECT usuario_id, indicador_id, nota FROM shd_notas WHERE materia_id=?`, [materiaId]);

      if (shdNotaRows.length) {
        usaSHD = true;
        const indDim = Object.fromEntries(shdIndicadores.map(i => [i.id, i.dimension]));
        const userDimNotas = {};
        for (const n of shdNotaRows) {
          const dim = indDim[n.indicador_id];
          if (!dim) continue;
          if (!userDimNotas[n.usuario_id]) userDimNotas[n.usuario_id] = { SABER: [], HACER: [], DECIDIR: [] };
          if (n.nota !== null && n.nota !== undefined) userDimNotas[n.usuario_id][dim].push(Number(n.nota));
        }
        for (const [uid, dimNotas] of Object.entries(userDimNotas)) {
          const dimAvg = {};
          let total = 0;
          for (const [dim, peso] of Object.entries(SHD_PESOS)) {
            const arr = dimNotas[dim] || [];
            const avg = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
            dimAvg[dim] = Number(avg.toFixed(2));
            total += avg * peso;
          }
          promCatedraticoMap[Number(uid)] = Number(total.toFixed(2));
          shdDimMap[Number(uid)] = dimAvg;
        }
      }
    } catch(e) {
      if (!isMissingTableError(e)) throw e;
    }

    // Fallback eval_config cuando no hay SHD
    const evalRows = [];
    if (!usaSHD) {
      const [er] = await pool.execute(
        `SELECT id, nombre, peso, nota_min_apro FROM eval_config WHERE materia_id=? ORDER BY orden ASC`, [materiaId]);
      evalRows.push(...er);

      const [notaRows] = await pool.execute(
        `SELECT c.usuario_id, ec.nombre AS eval_nombre, c.nota
         FROM calificaciones c INNER JOIN eval_config ec ON ec.id=c.eval_config_id
         WHERE c.materia_id=? OR (c.materia_id IS NULL AND ec.materia_id=?)`, [materiaId, materiaId]);
      const notasMap = {};
      for (const n of notaRows) {
        if (!notasMap[n.usuario_id]) notasMap[n.usuario_id] = {};
        notasMap[n.usuario_id][n.eval_nombre] = Number(n.nota);
      }

      const tareaEvalNames = evalRows.filter(ev => isTareaEval(ev.nombre)).map(ev => ev.nombre);
      if (tareaEvalNames.length) {
        try {
          const [tareaRows] = await pool.execute(
            `SELECT te.usuario_id, ROUND(AVG(te.nota),2) AS promedio_tarea
             FROM tareas t JOIN tarea_entregas te ON te.tarea_id=t.id
             WHERE t.materia_id=? AND te.nota IS NOT NULL
             GROUP BY te.usuario_id`, [materiaId]);
          for (const row of tareaRows) {
            if (!notasMap[row.usuario_id]) notasMap[row.usuario_id] = {};
            for (const evalName of tareaEvalNames)
              notasMap[row.usuario_id][evalName] = Number(row.promedio_tarea);
          }
        } catch(e) { if (!isMissingTableError(e)) throw e; }
      }

      // Calcular prom_catedratico desde eval_config
      for (const [uid, notas] of Object.entries(notasMap)) {
        let sn = 0;
        for (const ev of evalRows) sn += (notas[ev.nombre] ?? 0) * Number(ev.peso);
        promCatedraticoMap[Number(uid)] = Number((sn / 100).toFixed(2));
      }
    }

    if (evalRows.length) notaMinApro = Number(evalRows[0].nota_min_apro);

    // ── 2. Facilitador (2.5%) — escala 1-10, se convierte a 0-100 multiplicando ×10 ──
    const [facRows] = await pool.execute(
      `SELECT cursante_id, ROUND((c1+c2+c3+c4)/4,2) AS promedio_10
       FROM eval_facilitador WHERE materia_id=?`, [materiaId]);
    // promedio_10 está en escala 1-10 → convertir a 0-100
    const facMap = Object.fromEntries(facRows.map(r => [r.cursante_id, Number(r.promedio_10) * 10]));

    // ── 3. Cursantes (5%) — período CURSANTE_A_CURSANTE más reciente (materia o curso) ──
    const peerMap = {};
    try {
      // Busca primero por materia_id exacto, luego por curso sin materia (NULL)
      const [periodoRows] = await pool.execute(
        `SELECT ep.id FROM eval_inst_periodos ep
         JOIN eval_inst_plantillas pl ON pl.id = ep.plantilla_id
         WHERE pl.tipo = 'CURSANTE_A_CURSANTE'
           AND ep.habilitado = 1
           AND ep.curso_id = ?
           AND (ep.materia_id = ? OR ep.materia_id IS NULL)
         ORDER BY (ep.materia_id = ?) DESC, ep.creado_en DESC
         LIMIT 1`,
        [cursoId, materiaId, materiaId]);
      if (periodoRows.length) {
        const [peerRows] = await pool.execute(
          `SELECT er.evaluado_id,
                  ROUND(AVG(ev.valor), 2) AS promedio
           FROM eval_inst_respuestas er
           JOIN eval_inst_valoraciones ev ON ev.respuesta_id = er.id
           WHERE er.periodo_id = ? AND er.completada = 1 AND er.evaluado_id IS NOT NULL
           GROUP BY er.evaluado_id`, [periodoRows[0].id]);
        for (const r of peerRows) peerMap[r.evaluado_id] = Number(r.promedio);
      }
    } catch(e) {
      if (!isMissingTableError(e)) throw e;
    }

    // ── 4. Disciplina (2.5%) — ponderaje = clamp(0, 2.5, meritos − deméritos) ──
    let discMap = {};
    try {
      const [discRows] = await pool.execute(
        `SELECT usuario_id,
           COALESCE(SUM(CASE WHEN tipo='MERITO'   THEN puntos ELSE 0 END),0) AS total_meritos,
           COALESCE(SUM(CASE WHEN tipo='DEMERITO' THEN puntos ELSE 0 END),0) AS total_demeritos,
           COALESCE(SUM(CASE WHEN tipo='MERITO'   THEN puntos ELSE 0 END),0) -
           COALESCE(SUM(CASE WHEN tipo='DEMERITO' THEN puntos ELSE 0 END),0) AS saldo
         FROM disciplina_registros
         WHERE curso_id=? AND materia_id=?
         GROUP BY usuario_id`, [cursoId, materiaId]);
      // ponderaje directo: cada pt de mérito suma 1, cada pt de demérito resta 1, límite [0, 2.5]
      discMap = Object.fromEntries(
        discRows.map(r => ({
          key: r.usuario_id,
          saldo: Number(r.saldo),
          ponderaje: Math.max(0, Math.min(2.5, Number(r.saldo))),
        })).map(({ key, saldo, ponderaje }) => [key, { saldo, ponderaje }])
      );
    } catch(e) {
      if (!isMissingTableError(e)) throw e;
    }

    // ── Participantes ─────────────────────────────────────────
    const [partRows] = await pool.execute(
      `SELECT u.id, u.nombre, u.ap_paterno, u.ap_materno, u.ci
       FROM curso_participantes cp INNER JOIN usuarios u ON u.id=cp.usuario_id
       WHERE cp.curso_id=? AND u.tipo_usuario='Cursante'
       ORDER BY u.ap_paterno, u.ap_materno, u.nombre`, [cursoId]);

    const resultado = partRows.map(p => {
      const promCatedratico = promCatedraticoMap[p.id] ?? 0;
      const promFacilitador = facMap[p.id] ?? null;
      const promCursantes   = peerMap[p.id] ?? null;
      const tieneDisciplina      = Object.prototype.hasOwnProperty.call(discMap, p.id);
      const saldoDisciplina      = tieneDisciplina ? discMap[p.id].saldo     : null;
      const ponderajeFacilitador = promFacilitador !== null ? promFacilitador * 0.025 : null;
      const ponderajeDisciplina  = tieneDisciplina ? discMap[p.id].ponderaje : null;
      const dimShd               = shdDimMap[p.id] ?? null;

      const notaFinal =
        promCatedratico +
        (ponderajeFacilitador ?? 0) +
        (promCursantes ?? 0) * 0.05 +
        (ponderajeDisciplina ?? 0);

      return {
        usuario_id:   p.id,
        nombre:       p.nombre,
        ap_paterno:   p.ap_paterno,
        ap_materno:   p.ap_materno,
        ci:           p.ci,
        prom_catedratico:      Number(promCatedratico.toFixed(2)),
        ...(usaSHD && dimShd ? {
          prom_saber:   dimShd.SABER,
          prom_hacer:   dimShd.HACER,
          prom_decidir: dimShd.DECIDIR,
        } : {}),
        prom_facilitador:      promFacilitador !== null ? Number(promFacilitador.toFixed(2)) : null,
        ponderaje_facilitador: ponderajeFacilitador !== null ? Number(ponderajeFacilitador.toFixed(2)) : null,
        prom_cursantes:        promCursantes !== null ? Number(promCursantes.toFixed(2)) : null,
        nota_disciplina:       saldoDisciplina !== null ? Number(saldoDisciplina.toFixed(2)) : null,
        ponderaje_disciplina:  ponderajeDisciplina !== null ? Number(ponderajeDisciplina.toFixed(2)) : null,
        disciplina_registrada: tieneDisciplina,
        nota_final:            Number(notaFinal.toFixed(2)),
        estado:                notaFinal >= notaMinApro ? "aprobado" : "reprobado",
        facilitador_pendiente: promFacilitador === null,
        cursantes_pendiente:   promCursantes   === null,
      };
    });

    res.json({
      materia_id:     materiaId,
      materia_nombre: materia.nombre,
      usa_shd:        usaSHD,
      pesos: { catedratico: 90, facilitador: 2.5, cursantes: 5, disciplina: 2.5 },
      shd_pesos: { saber: 30, hacer: 40, decidir: 20 },
      nota_min_apro:  notaMinApro,
      resultado,
    });
  } catch(e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

// ════════════════════════════════════════════════════════════
// SABER / HACER / DECIDIR (SHD) — Sistema de calificación por dimensiones
// ════════════════════════════════════════════════════════════

/** GET /api/shd/indicadores — Catálogo de indicadores SHD */
app.get("/api/shd/indicadores", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, dimension, seccion, codigo, nombre, orden
       FROM shd_indicadores ORDER BY orden ASC`);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

/** GET /api/shd/notas/materia/:materiaId — Libro SHD por materia */
app.get("/api/shd/notas/materia/:materiaId", async (req, res) => {
  try {
    const materiaId = Number(req.params.materiaId);
    if (!materiaId) return res.status(400).json({ message: "ID inválido" });
    const materia = await assertMateriaExists(pool, materiaId);
    if (!materia) return res.status(404).json({ message: "Materia no encontrada" });

    const [indicadores] = await pool.execute(
      `SELECT id, dimension, seccion, codigo, nombre, orden FROM shd_indicadores ORDER BY orden ASC`);

    const [participantes] = await pool.execute(
      `SELECT u.id, u.nombre, u.ap_paterno, u.ap_materno, u.ci
       FROM curso_participantes cp INNER JOIN usuarios u ON u.id=cp.usuario_id
       WHERE cp.curso_id=? ORDER BY u.ap_paterno, u.ap_materno, u.nombre`, [materia.curso_id]);

    const [notaRows] = await pool.execute(
      `SELECT usuario_id, indicador_id, nota, bloqueado FROM shd_notas WHERE materia_id=?`, [materiaId]);

    const notasMap = {}, bloqueadoMap = {};
    for (const n of notaRows) {
      if (!notasMap[n.usuario_id]) notasMap[n.usuario_id] = {};
      notasMap[n.usuario_id][n.indicador_id] = Number(n.nota);
      if (n.bloqueado) bloqueadoMap[n.usuario_id] = true;
    }

    res.json({
      materia_id: materiaId,
      indicadores,
      libro: participantes.map(p => ({
        usuario_id: p.id, nombre: p.nombre, ap_paterno: p.ap_paterno,
        ap_materno: p.ap_materno, ci: p.ci,
        notas: notasMap[p.id] || {}, bloqueado: !!bloqueadoMap[p.id],
      })),
    });
  } catch(e) { res.status(500).json({ message: "Error interno", detail: e.message }); }
});

/**
 * POST /api/shd/notas/usuario — Guardar (y opcionalmente bloquear) notas SHD de UN cursante
 * body: { curso_id, materia_id, usuario_id, notas:{indicador_id:nota,...}, bloquear, registrado_por }
 */
app.post("/api/shd/notas/usuario", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { curso_id, materia_id, usuario_id, notas, bloquear, registrado_por } = req.body;
    if (!curso_id)   return res.status(400).json({ message: "Campo requerido: curso_id" });
    if (!materia_id) return res.status(400).json({ message: "Campo requerido: materia_id" });
    if (!usuario_id) return res.status(400).json({ message: "Campo requerido: usuario_id" });
    if (!notas)      return res.status(400).json({ message: "Campo requerido: notas" });

    const materia = await assertMateriaExists(conn, materia_id);
    if (!materia) return res.status(404).json({ message: "Materia no encontrada" });

    const [chk] = await conn.execute(
      `SELECT 1 FROM shd_notas WHERE materia_id=? AND usuario_id=? AND bloqueado=1 LIMIT 1`,
      [materia_id, usuario_id]);
    if (chk.length)
      return res.status(409).json({ message: "Las calificaciones de este cursante ya están bloqueadas." });

    const bloqueadoVal = bloquear ? 1 : 0;
    await conn.beginTransaction();
    for (const [indicadorId, nota] of Object.entries(notas)) {
      const notaNum = Math.min(100, Math.max(0, Number(nota) || 0));
      await conn.execute(
        `INSERT INTO shd_notas (materia_id, curso_id, usuario_id, indicador_id, nota, bloqueado, registrado_por)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE nota=VALUES(nota), bloqueado=VALUES(bloqueado),
           registrado_por=VALUES(registrado_por), actualizado_en=NOW()`,
        [materia_id, curso_id, usuario_id, Number(indicadorId), notaNum, bloqueadoVal, registrado_por ?? null]);
    }
    await conn.commit();
    res.json({ message: "Calificaciones SHD guardadas", usuario_id, bloqueado: bloqueadoVal === 1 });
  } catch(e) { try { await conn.rollback(); } catch {} res.status(500).json({ message: "Error interno", detail: e.message }); }
  finally { conn.release(); }
});

// ════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ API EAEN corriendo en http://localhost:${PORT}`);
  await seedDisciplina();
  await seedEvalInstPlantillas();
});
