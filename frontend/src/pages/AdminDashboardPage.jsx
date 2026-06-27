import { useEffect, useState } from "react";
import { fetchAdminClaims, fetchAdminStats } from "../api/admin";
import { adminModules, adminStats, claimsMock } from "../data/mockData";

function AdminDashboardPage() {
  const [stats, setStats] = useState(adminStats);
  const [claims, setClaims] = useState(claimsMock);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [data, claimsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminClaims(),
        ]);
        if (!isMounted) return;
        setStats([
          { label: "Usuarios totales", value: String(data.usuariosTotales) },
          { label: "Usuarios activos", value: String(data.usuariosActivos) },
          { label: "Usuarios baneados", value: String(data.usuariosBaneados) },
          { label: "Prendas publicadas", value: String(data.prendasPublicadas) },
        ]);
        setClaims(
          claimsData.length
            ? claimsData.map((claim) => ({
                id: `#R-${claim.id}`,
                title: claim.nombrePrenda || claim.descripcion,
                status: claim.estado,
              }))
            : claimsMock,
        );
      } catch {
        if (isMounted) {
          setStats(adminStats);
          setClaims(claimsMock);
        }
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="dashboard-page admin-theme">
      <div className="dashboard-header">
        <div>
          <p className="section-kicker">Panel administrador</p>
          <h1>Supervisa usuarios, reclamos e impacto sostenible</h1>
        </div>
      </div>

      <div className="dashboard-stats">
        {stats.map((item) => (
          <article key={item.label} className="stat-card stat-card-admin">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        {adminModules.map((module) => (
          <article key={module.title} className="dashboard-card">
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-split">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Reclamos recientes</h2>
            <span>Listar, filtrar, responder y actualizar estado</span>
          </div>

          <div className="mini-list">
            {claims.map((claim) => (
              <article key={claim.id} className="mini-item">
                <div>
                  <strong>{claim.id}</strong>
                  <p>{claim.title}</p>
                </div>
                <span>{claim.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Moderacion de usuarios</h2>
            <span>Banear, reactivar y revisar actividad</span>
          </div>

          <div className="mini-list">
            <article className="mini-item">
              <div>
                <strong>Sofia Marin</strong>
                <p>Activa · 4.9 de reputacion · 12 prendas publicadas</p>
              </div>
              <span>Revisar</span>
            </article>
            <article className="mini-item">
              <div>
                <strong>Daniela Wears</strong>
                <p>Baneada temporalmente · 2 reclamos asociados</p>
              </div>
              <span>Reactivar</span>
            </article>
          </div>
        </section>
      </div>

      <section className="dashboard-panel dashboard-panel-feature admin-panel-feature">
        <div className="panel-head">
          <h2>Impacto sostenible acumulado</h2>
          <span>Indicadores clave del marketplace</span>
        </div>

        <div className="chip-grid">
          <div className="action-chip">2,700 L de agua ahorrados por prenda reutilizada</div>
          <div className="action-chip">8,920 publicaciones activas en circulacion</div>
          <div className="action-chip">1,840 prendas reutilizadas este trimestre</div>
          <div className="action-chip">Reduccion estimada de residuos textiles en crecimiento</div>
        </div>
      </section>
    </section>
  );
}

export default AdminDashboardPage;
