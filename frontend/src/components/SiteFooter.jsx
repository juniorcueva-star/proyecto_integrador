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
          <Link to="/catalogo">Novedades</Link>
          <Link to="/catalogo">Intercambios</Link>
          <Link to="/user">Estilo IA</Link>
        </div>
        <div>
          <h3>Comunidad</h3>
          <Link to="/user">Vender</Link>
          <Link to="/vendedor/1">Perfiles</Link>
          <Link to="/#sostenibilidad">Sostenibilidad</Link>
          <Link to="/">Blog</Link>
        </div>
        <div>
          <h3>Soporte</h3>
          <Link to="/login">Centro de ayuda</Link>
          <Link to="/login">Confianza y seguridad</Link>
          <Link to="/login">Envios</Link>
          <Link to="/login">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
