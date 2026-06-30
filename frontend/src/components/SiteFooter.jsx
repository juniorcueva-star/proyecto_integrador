import { Link } from "react-router-dom";

function SiteFooter() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-brand">
        <Link to="/" className="brand brand-link">
          <div className="brand-mark">E</div>
          <div className="brand-text">
            <span>Estilo IA</span>
          </div>
        </Link>
        <p>
          Moda circular con alma. Compra, vende e intercambia prendas con
          historia y dale una segunda vida a tu armario.
        </p>
      </div>

      <div className="footer-links">
        <div>
          <h3>Explorar</h3>
          <Link to="/catalogo">Catalogo</Link>
          <Link to="/user">Estilo IA</Link>
        </div>
        <div>
          <h3>Comunidad</h3>
          <Link to="/user">Vender</Link>
          <Link to="/#sostenibilidad">Sostenibilidad</Link>
        </div>
        <div>
          <h3>Soporte</h3>
          <Link to="/login">Entrar</Link>
          <Link to="/register">Crear cuenta</Link>
          <Link to="/user">Mis reclamos</Link>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
