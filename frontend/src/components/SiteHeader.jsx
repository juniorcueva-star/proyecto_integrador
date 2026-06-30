import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthSession } from "../utils/authStorage";

function SiteHeader({ mode = "default" }) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const showCompactNav = mode === "auth" || mode === "compact";

  function handleLogout() {
    clearAuthSession();
    navigate("/login");
    window.location.reload();
  }

  return (
    <header className={`topbar ${mode === "auth" ? "topbar-auth" : ""}`}>
      <NavLink to="/" className="brand brand-link">
        <div className="brand-mark">E</div>
        <div className="brand-text">
          <span>Estilo IA</span>
        </div>
      </NavLink>

      <nav className="main-nav" aria-label="Principal">
        {!showCompactNav ? <NavLink to="/catalogo">Catalogo</NavLink> : null}
        <a href="/#como-funciona">Como funciona</a>
        {!showCompactNav ? <a href="/#sostenibilidad">Sostenibilidad</a> : null}
        {!showCompactNav ? <a href="/#ia">Estilo IA</a> : null}
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Buscar"
          onClick={() => navigate("/catalogo")}
        >
          <span className="search-ring"></span>
        </button>
        {session.token ? (
          <>
            <span className="session-pill">{session.nombre || "Mi cuenta"}</span>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Salir
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="ghost-link">
              Entrar
            </NavLink>
            <NavLink to="/register" className="primary-link">
              Crear cuenta
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;
