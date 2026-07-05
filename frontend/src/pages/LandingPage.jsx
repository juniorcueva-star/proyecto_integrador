import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCatalog } from "../api/prendas";
import ProductCard from "../components/ProductCard";
import {
  aiFeatures,
  steps,
  sustainabilityCards,
} from "../data/staticData";
import { adaptProducts } from "../utils/productAdapter";
import heroImage from "../assets/estilo-ia-outfits.png";

function LandingPage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProducts() {
      try {
        const data = await fetchCatalog();
        if (isMounted) {
          setFeaturedProducts(adaptProducts(data).slice(0, 3));
        }
      } catch {
        if (isMounted) {
          setFeaturedProducts([]);
        }
      }
    }

    loadFeaturedProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow-pill">Moda inteligente para todos</div>
          <h1>Estilo IA transforma tu forma de vestir</h1>
          <p>
            Descubre recomendaciones personalizadas, publica prendas con ayuda
            de IA y conecta con una comunidad que impulsa la moda circular.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="button-primary">
              Empieza gratis
            </Link>
            <Link to="/catalogo" className="button-secondary">
              Explorar catálogo
            </Link>
          </div>

          <div className="hero-metrics">
            <article>
              <strong>92%</strong>
              <span>compatibilidad de estilo</span>
            </article>
            <article>
              <strong>IA</strong>
              <span>recomendaciones visuales</span>
            </article>
            <article>
              <strong>24/7</strong>
              <span>catálogo disponible</span>
            </article>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-frame">
            <img src={heroImage} alt="Estilo IA con recomendaciones de moda" />
            <div className="hero-image-shine"></div>
            <div className="floating-badge floating-badge-top">Pago seguro y protegido</div>
            <div className="floating-card">
              <strong>Estilo personalizado</strong>
              <span>La IA sugiere prendas según tu ocasión, clima y preferencias.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section" id="catalogo">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Recién llegado</p>
            <h2>Piezas seleccionadas para ti</h2>
          </div>
          <Link to="/catalogo" className="section-link">
            Ver todo
          </Link>
        </div>

        {featuredProducts.length ? (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>Aún no hay prendas publicadas.</strong>
            <p>Cuando existan publicaciones activas en el backend, aparecerán aquí.</p>
          </div>
        )}
      </section>

      <section className="steps-section" id="como-funciona">
        <div className="steps-heading">
          <p className="section-kicker">Cómo funciona</p>
          <h2>Dar una segunda vida nunca fue tan simple</h2>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article key={step.number} className="step-card">
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sustainability-section" id="sostenibilidad">
        <div className="sustainability-copy">
          <p className="section-kicker section-kicker-light">Sostenibilidad</p>
          <h2>Moda que cuida del planeta y de tu armario</h2>
          <p>
            La moda circular no es una tendencia, es un compromiso. Cada prenda
            que reutilizas alarga su vida y reduce el impacto de la industria
            textil.
          </p>
        </div>

        <div className="sustainability-grid">
          {sustainabilityCards.map((item) => (
            <article key={item.title} className="sustainability-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-section" id="ia">
        <div className="ai-panel">
          <div className="ai-copy">
            <div className="eyebrow-pill eyebrow-pill-dark">Asistente Estilo IA</div>
            <h2>Inteligencia que viste tu armario</h2>
            <p>
              Sube una foto y deja que nuestra IA haga la magia: looks
              personalizados, precios inteligentes y descripciones listas para
              publicar.
            </p>

            <div className="ai-feature-list">
              {aiFeatures.map((feature) => (
                <article key={feature.title} className="ai-feature-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>

            <Link to="/user" className="button-light">
              Probar Estilo IA
            </Link>
          </div>

          <div className="ai-visual" aria-hidden="true">
            <div className="ai-closet">
              <div className="closet-piece closet-piece-jacket"></div>
              <div className="closet-piece closet-piece-knit"></div>
              <div className="closet-piece closet-piece-bag"></div>
              <div className="closet-piece closet-piece-boots"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2>Únete al movimiento de la moda circular</h2>
          <p>
            Crea tu cuenta gratis y empieza a vender, comprar e intercambiar hoy
            mismo.
          </p>

          <div className="cta-actions">
            <Link to="/register" className="button-primary">
              Crear cuenta gratis
            </Link>
            <Link to="/login" className="button-secondary">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
