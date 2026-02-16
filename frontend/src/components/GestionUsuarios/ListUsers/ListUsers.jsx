import { useMemo, useState } from "react";
import "./ListUsers.css";

const USER_TYPES = [
  "Cursante",
  "Administrador",
  "Tecnico",
  "Jefe de Carrera",
  "Jefe de Unidad o Director",
  "Personal de Apoyo",
  "Docente",
];

const USERS = [
  {
    tipo: "Administrador",
    grado: "Oficial Militar Superior",
    ap_paterno: "Pérez",
    ap_materno: "Gómez",
    nombre: "Juan",
    ci: "1234567",
    ex: "LP",
    filial: "Sede Central",
    fuerza: "Ejército",
    turno: "Mañana",
    telefono: "70123456",
    fecha_inscripcion: "2025-02-01",
    lugar_trabajo: "EAEN - Sede Central",
    correo: "juan.perez@eaen.bo",
    fecha_nacimiento: "1980-05-20",
  },
  {
    tipo: "Docente",
    grado: "Profesor",
    ap_paterno: "Rojas",
    ap_materno: "Flores",
    nombre: "María",
    ci: "9876543",
    ex: "CB",
    filial: "Filial Norte",
    fuerza: "Civil",
    turno: "Tarde",
    telefono: "76543210",
    fecha_inscripcion: "2024-08-10",
    lugar_trabajo: "UMSS",
    correo: "maria.rojas@eaen.bo",
    fecha_nacimiento: "1978-11-02",
  },
  {
    tipo: "Cursante",
    grado: "Estudiante Postgrado",
    ap_paterno: "Quispe",
    ap_materno: "Mamani",
    nombre: "Luis",
    ci: "5551112",
    ex: "SC",
    filial: "Filial Sur",
    fuerza: "Civil",
    turno: "Noche",
    telefono: "72000001",
    fecha_inscripcion: "2026-01-15",
    lugar_trabajo: "Empresa Privada",
    correo: "luis.quispe@correo.com",
    fecha_nacimiento: "1992-03-14",
  },
];

export default function ListUsers({ onBack }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("ALL");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return USERS.filter((u) => {
      const matchTipo = tipo === "ALL" ? true : u.tipo === tipo;
      if (!matchTipo) return false;

      if (!query) return true;

      const blob = [
        u.ci,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.correo,
        u.grado,
        u.filial,
        u.fuerza,
        u.turno,
        u.telefono,
        u.ex,
        u.tipo,
        u.lugar_trabajo,
      ]
        .join(" ")
        .toLowerCase();

      return blob.includes(query);
    });
  }, [q, tipo]);

  const clearFilters = () => {
    setQ("");
    setTipo("ALL");
  };

  return (
    <section className="eaen-list-wrap">
      <div className="eaen-list-head">
        <div>
          <h2 className="eaen-list-title">Listar Usuarios</h2>
          <p className="eaen-list-subtitle">
            Tabla institucional de usuarios registrados (simulación). Incluye búsqueda y filtro.
          </p>
        </div>

        <div className="eaen-list-actions">
          <button className="eaen-secondary-btn" type="button" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="eaen-list-card">
        <div className="eaen-filters">
          <div className="eaen-filter-group">
            <label className="eaen-filter-label">Buscar</label>
            <input
              className="eaen-filter-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="CI, nombre, apellidos, correo, filial..."
            />
          </div>

          <div className="eaen-filter-group">
            <label className="eaen-filter-label">Tipo de Usuario</label>
            <select
              className="eaen-filter-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {USER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="eaen-filter-buttons">
            <button className="eaen-primary-btn" type="button" onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        </div>

        <div className="eaen-table-wrap" role="region" aria-label="Tabla de usuarios">
          <table className="eaen-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Grado/Profesión</th>
                <th>Ap. Paterno</th>
                <th>Ap. Materno</th>
                <th>Nombre</th>
                <th>CI</th>
                <th>EX</th>
                <th>Filial</th>
                <th>Fuerza</th>
                <th>Turno</th>
                <th>Teléfono</th>
                <th>F. Inscripción</th>
                <th>Lugar de Trabajo</th>
                <th>Correo</th>
                <th>F. Nacimiento</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="eaen-empty" colSpan={15}>
                    No hay resultados para los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.ci}>
                    <td>
                      <span className={`eaen-badge eaen-badge-${badgeKey(u.tipo)}`}>
                        {u.tipo}
                      </span>
                    </td>
                    <td>{u.grado}</td>
                    <td>{u.ap_paterno}</td>
                    <td>{u.ap_materno}</td>
                    <td>{u.nombre}</td>
                    <td className="mono">{u.ci}</td>
                    <td className="mono">{u.ex}</td>
                    <td>{u.filial}</td>
                    <td>{u.fuerza}</td>
                    <td>{u.turno}</td>
                    <td className="mono">{u.telefono}</td>
                    <td className="mono">{u.fecha_inscripcion}</td>
                    <td>{u.lugar_trabajo}</td>
                    <td>{u.correo}</td>
                    <td className="mono">{u.fecha_nacimiento}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="eaen-list-footer">
          <span>
            Mostrando <b>{filtered.length}</b> de <b>{USERS.length}</b> usuarios
          </span>

          <span className="eaen-small">
            * Luego conectamos esta tabla a MySQL (Node API) con paginación.
          </span>
        </div>
      </div>
    </section>
  );
}

function badgeKey(tipo) {
  // para clases CSS limpias
  return tipo
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("ó", "o")
    .replaceAll("é", "e")
    .replaceAll("í", "i")
    .replaceAll("á", "a")
    .replaceAll("ú", "u");
}
