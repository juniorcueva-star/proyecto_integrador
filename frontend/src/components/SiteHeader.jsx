import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthSession } from "../utils/authStorage";

function SiteHeader({ mode = "default", showSessionActions = true }) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const showMarketingNav = mode !== "compact";
  const useStaticBrand = mode === "compact" && Boolean(session.token);

  function handleLogout() {
    clearAuthSession();
    navigate("/login");
    window.location.reload();
  }

  return (
    <header className={`topbar ${mode === "auth" ? "topbar-auth" : ""}`}>
      {useStaticBrand ? (
        <div className="brand brand-static" aria-label="Estilo IA">
          <div className="brand-mark">E</div>
          <div className="brand-text">
            <span>Estilo IA</span>
          </div>
        </div>
      ) : (
        <NavLink to="/" className="brand brand-link">
          <div className="brand-mark">E</div>
          <div className="brand-text">
            <span>Estilo IA</span>
          </div>
        </NavLink>
      )}

      {showMarketingNav ? (
        <nav className="main-nav" aria-label="Principal">
          <NavLink to="/catalogo?genero=HOMBRE">Hombre</NavLink>
          <NavLink to="/catalogo?genero=MUJER">Mujer</NavLink>
          <NavLink to="/catalogo?genero=UNISEX">Unisex</NavLink>
          <a href="/#como-funciona">Como funciona</a>
        </nav>
      ) : null}

      <div className="topbar-actions">
        {showSessionActions && session.token ? (
          <>
            <span className="session-pill">{session.nombre || "Mi cuenta"}</span>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Salir
            </button>
          </>
        ) : (
          <>
            {!showSessionActions && session.token ? null : (
              <>
                <NavLink to="/login" className="ghost-link">
                  Entrar
                </NavLink>
                <NavLink to="/register" className="primary-link">
                  Crear cuenta
                </NavLink>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;
