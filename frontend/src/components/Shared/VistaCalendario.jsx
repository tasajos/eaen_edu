import { useState, useEffect } from "react";
import "./VistaCalendario.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DIAS_LARGO  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const COLORES_MATERIA = [
  {bg:"#e3f2fd",border:"#1565c0",text:"#1565c0"},
  {bg:"#f3e5f5",border:"#6a1b9a",text:"#6a1b9a"},
  {bg:"#e8f5e9",border:"#2e7d32",text:"#2e7d32"},
  {bg:"#fff3e0",border:"#e65100",text:"#e65100"},
  {bg:"#fce4ec",border:"#c62828",text:"#c62828"},
  {bg:"#e0f7fa",border:"#00695c",text:"#00695c"},
  {bg:"#f9fbe7",border:"#558b2f",text:"#558b2f"},
  {bg:"#ede7f6",border:"#4527a0",text:"#4527a0"},
];

function fmtHora(h){ return h?.slice(0,5) || "—"; }

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   Props:
   - cursos: array de cursos a mostrar (puede ser todos o los del usuario)
   - titulo: string opcional
   - modoDocente: bool — si true muestra todos los cursos
══════════════════════════════════════════════════════════ */
export default function VistaCalendario({ cursos = [], titulo = "Mi Calendario", modoDocente = false }) {
  const hoy       = new Date();
  const [mes,     setMes]     = useState(hoy.getMonth());
  const [anio,    setAnio]    = useState(hoy.getFullYear());
  const [clases,  setClases]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [diasel,  setDiasel]  = useState(null);  // fecha seleccionada "YYYY-MM-DD"
  const [vista,   setVista]   = useState("mes"); // "mes" | "semana" | "lista"

  // Colores por materia_id
  const colorMap = {};
  const getColor = (materiaId) => {
    if(!colorMap[materiaId]){
      const idx = Object.keys(colorMap).length % COLORES_MATERIA.length;
      colorMap[materiaId] = COLORES_MATERIA[idx];
    }
    return colorMap[materiaId];
  };

  // Cargar clases del mes para todos los cursos
  useEffect(() => {
    if(!cursos.length) return;
    setLoading(true);
    const fechaIni = `${anio}-${String(mes+1).padStart(2,"0")}-01`;
    const fechaFin = `${anio}-${String(mes+1).padStart(2,"0")}-31`;

    Promise.all(cursos.map(c =>
      fetch(`${API}/horarios?curso_id=${c.id}&fecha_inicio=${fechaIni}&fecha_fin=${fechaFin}`)
        .then(r => r.json())
        .then(d => Array.isArray(d) ? d.map(h => ({...h, curso_nombre: c.nombre})) : [])
        .catch(() => [])
    )).then(results => {
      setClases(results.flat());
    }).finally(() => setLoading(false));
  }, [cursos, mes, anio]);

  // Agrupar clases por fecha
  const clasesPorFecha = clases.reduce((acc, cl) => {
    const f = cl.fecha?.slice(0,10);
    if(!acc[f]) acc[f] = [];
    acc[f].push(cl);
    return acc;
  }, {});

  // Navegación de mes
  const prevMes = () => { if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); setDiasel(null); };
  const nextMes = () => { if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); setDiasel(null); };
  const irHoy   = () => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()); setDiasel(null); };

  // Construir grilla del mes
  const diasEnMes   = new Date(anio, mes+1, 0).getDate();
  const primerDia   = new Date(anio, mes, 1).getDay();
  const celdas      = Array(primerDia).fill(null)
    .concat(Array.from({length: diasEnMes}, (_,i) => i+1));
  while(celdas.length % 7 !== 0) celdas.push(null);

  const fechaStr = (d) => d
    ? `${anio}-${String(mes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
    : null;

  const esHoy = (d) => {
    return d && anio === hoy.getFullYear() && mes === hoy.getMonth() && d === hoy.getDate();
  };

  // Clases del día seleccionado
  const clasesDelDia = diasel ? (clasesPorFecha[diasel] || []) : [];

  // Vista lista: próximas clases del mes ordenadas
  const clasesOrdenadas = Object.entries(clasesPorFecha)
    .sort(([a],[b]) => a.localeCompare(b))
    .flatMap(([,cls]) => cls.sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)));

  return (
    <div className="vcal-wrap">
      {/* ── Header ── */}
      <div className="vcal-header">
        <div className="vcal-titulo">{titulo}</div>
        <div className="vcal-controls">
          {/* Tabs de vista */}
          <div className="vcal-tabs">
            {[["mes","📅 Mes"],["lista","📋 Lista"]].map(([v,l]) => (
              <button key={v} className={`vcal-tab ${vista===v?"active":""}`}
                onClick={() => setVista(v)}>{l}</button>
            ))}
          </div>
          {/* Navegación */}
          <div className="vcal-nav">
            <button className="vcal-nav-btn" onClick={prevMes}>‹</button>
            <span className="vcal-mes-label">
              {MESES[mes]} {anio}
            </span>
            <button className="vcal-nav-btn" onClick={nextMes}>›</button>
            <button className="vcal-hoy-btn" onClick={irHoy}>Hoy</button>
          </div>
        </div>
      </div>

      {loading && <div className="vcal-loading"><div className="vcal-ring"/></div>}

      {/* ══ VISTA MES ══ */}
      {vista === "mes" && !loading && (
        <div className="vcal-body">
          <div className="vcal-grid">
            {/* Cabecera días de semana */}
            {DIAS_SEMANA.map(d => (
              <div key={d} className="vcal-dow">{d}</div>
            ))}

            {/* Celdas */}
            {celdas.map((d, i) => {
              const fstr  = fechaStr(d);
              const cls   = fstr ? (clasesPorFecha[fstr] || []) : [];
              const hoyClass = esHoy(d) ? "hoy" : "";
              const selClass = fstr === diasel ? "sel" : "";
              return (
                <div key={i}
                  className={`vcal-celda ${d?"":"vacía"} ${hoyClass} ${selClass}`}
                  onClick={() => d && setDiasel(fstr === diasel ? null : fstr)}
                >
                  {d && <>
                    <div className="vcal-dia-num">{d}</div>
                    <div className="vcal-eventos">
                      {cls.slice(0,3).map((cl,j) => {
                        const col = getColor(cl.materia_id);
                        return (
                          <div key={j} className="vcal-evento-pill"
                            style={{background:col.bg, borderLeft:`3px solid ${col.border}`, color:col.text}}>
                            <span className="vcal-ev-hora">{fmtHora(cl.hora_inicio)}</span>
                            <span className="vcal-ev-mat">{cl.materia_nombre?.split(" ").slice(0,3).join(" ")}</span>
                          </div>
                        );
                      })}
                      {cls.length > 3 && (
                        <div className="vcal-mas">+{cls.length-3} más</div>
                      )}
                    </div>
                  </>}
                </div>
              );
            })}
          </div>

          {/* Panel lateral del día seleccionado */}
          {diasel && (
            <div className="vcal-dia-panel">
              <div className="vcal-dia-header">
                <div className="vcal-dia-titulo">
                  {DIAS_LARGO[new Date(diasel+"T12:00:00").getDay()]}
                </div>
                <div className="vcal-dia-fecha">
                  {new Date(diasel+"T12:00:00").getDate()} de {MESES[new Date(diasel+"T12:00:00").getMonth()]}
                </div>
                <button className="vcal-close-btn" onClick={() => setDiasel(null)}>✕</button>
              </div>

              {!clasesDelDia.length ? (
                <div className="vcal-sin-clases">
                  <span>📭</span>
                  <p>Sin clases este día</p>
                </div>
              ) : (
                <div className="vcal-dia-clases">
                  {clasesDelDia.sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio)).map(cl => {
                    const col = getColor(cl.materia_id);
                    return (
                      <div key={cl.id} className="vcal-clase-card"
                        style={{borderLeft:`4px solid ${col.border}`, background:col.bg}}>
                        <div className="vcal-clase-hora" style={{color:col.border}}>
                          🕐 {fmtHora(cl.hora_inicio)} – {fmtHora(cl.hora_fin)}
                        </div>
                        <div className="vcal-clase-mat">{cl.materia_nombre}</div>
                        <div className="vcal-clase-meta">
                          {cl.aula && <span>🏫 {cl.aula}</span>}
                          {cl.docente_nombre && <span>👨‍🏫 {cl.docente_ap} {cl.docente_nombre}</span>}
                          {modoDocente && cl.curso_nombre && <span>📚 {cl.curso_nombre}</span>}
                        </div>
                        {cl.observacion && <div className="vcal-clase-obs">💬 {cl.observacion}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ VISTA LISTA ══ */}
      {vista === "lista" && !loading && (
        <div className="vcal-lista">
          {!clasesOrdenadas.length ? (
            <div className="vcal-empty">
              <div>📅</div>
              <p>No hay clases programadas para {MESES[mes]} {anio}.</p>
            </div>
          ) : (
            Object.entries(clasesPorFecha)
              .sort(([a],[b]) => a.localeCompare(b))
              .map(([fecha, cls]) => {
                const d = new Date(fecha+"T12:00:00");
                const esHoyFecha = fecha === hoy.toISOString().slice(0,10);
                return (
                  <div key={fecha} className={`vcal-lista-grupo ${esHoyFecha?"hoy":""}`}>
                    <div className="vcal-lista-fecha">
                      <div className="vcal-lista-dia-num">{d.getDate()}</div>
                      <div className="vcal-lista-dia-info">
                        <div className="vcal-lista-dow">{DIAS_LARGO[d.getDay()]}</div>
                        <div className="vcal-lista-mes">{MESES[d.getMonth()]} {d.getFullYear()}</div>
                      </div>
                      {esHoyFecha && <span className="vcal-hoy-badge">HOY</span>}
                    </div>
                    <div className="vcal-lista-clases">
                      {cls.sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio)).map(cl => {
                        const col = getColor(cl.materia_id);
                        return (
                          <div key={cl.id} className="vcal-lista-clase"
                            style={{borderLeft:`4px solid ${col.border}`}}>
                            <div className="vcal-lc-hora" style={{color:col.border}}>
                              {fmtHora(cl.hora_inicio)}<span>–</span>{fmtHora(cl.hora_fin)}
                            </div>
                            <div className="vcal-lc-info">
                              <div className="vcal-lc-mat">{cl.materia_nombre}</div>
                              <div className="vcal-lc-meta">
                                {cl.aula && <span>🏫 {cl.aula}</span>}
                                {cl.docente_nombre && <span>👨‍🏫 {cl.docente_ap} {cl.docente_nombre}</span>}
                                {modoDocente && cl.curso_nombre && <span>📚 {cl.curso_nombre}</span>}
                                {cl.observacion && <span>💬 {cl.observacion}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Leyenda de materias */}
      {clases.length > 0 && (
        <div className="vcal-leyenda">
          {[...new Set(clases.map(c=>c.materia_id))].map(mid => {
            const cl    = clases.find(c=>c.materia_id===mid);
            const color = getColor(mid);
            return (
              <div key={mid} className="vcal-ley-item"
                style={{background:color.bg, borderColor:color.border, color:color.text}}>
                <div className="vcal-ley-dot" style={{background:color.border}}/>
                {cl?.materia_nombre}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
