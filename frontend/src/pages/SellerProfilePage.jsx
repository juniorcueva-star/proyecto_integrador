import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicProfile } from "../api/usuarios";
import ProductCard from "../components/ProductCard";
import { adaptProducts } from "../utils/productAdapter";

function SellerProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await fetchPublicProfile(id);
        if (!isMounted) return;
        setProfile(data);
        setError("");
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || "No se pudo cargar el perfil publico.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const profileProducts = adaptProducts(profile?.prendasPublicadas || []);

  const profilePayments = profile?.metodosPago || [];
  const profileReviews = profile?.resenasRecibidas || [];

  if (loading) {
    return (
      <section className="profile-page">
        <div className="empty-state">
          <strong>Cargando perfil...</strong>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="profile-page">
        <div className="empty-state">
          <strong>No se pudo cargar el vendedor.</strong>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">SM</div>
        <div>
          <p className="section-kicker">Perfil publico</p>
          <h1>{profile.nombre}</h1>
          <p className="profile-summary">
            {profile.telefono ? `Contacto: ${profile.telefono}` : "Vendedor registrado en Estilo IA."}
          </p>
        </div>
      </div>

      <div className="profile-stats">
        <article><strong>{profile.promedioCalificacion ?? "Sin datos"}</strong><span>valoracion media</span></article>
        <article><strong>{profile.cantidadResenas ?? 0}</strong><span>resenas recibidas</span></article>
        <article><strong>{profilePayments.length}</strong><span>metodos de pago</span></article>
      </div>

      <section className="profile-panels">
        <article className="info-panel">
          <h2>Sobre el vendedor</h2>
          <p>
            Este perfil muestra informacion publica registrada en el backend:
            prendas publicadas, metodos de pago activos y resenas recibidas.
          </p>
        </article>

        <article className="info-panel">
          <h2>Metodos de pago activos</h2>
          <div className="payment-list">
            {profilePayments.length ? (
              profilePayments.map((method) => (
                <div
                  key={method.id || method.tipoMetodoPago}
                  className="payment-item"
                >
                  <strong>{method.tipoMetodoPago}</strong>
                  <span>{method.numero || method.titular || method.instrucciones || "Activo"}</span>
                </div>
              ))
            ) : (
              <div className="payment-item">
                <strong>Sin metodos visibles</strong>
                <span>No hay metodos activos publicados.</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Resenas</p>
            <h2>Lo que dice la comunidad</h2>
          </div>
        </div>
        <div className="review-grid">
          {profileReviews.length ? (
            profileReviews.map((review) => (
              <article
                key={review.id || review.nombreAutor}
                className="review-card"
              >
                <strong>{review.nombreAutor}</strong>
                <span>{review.calificacion}</span>
                <p>{review.comentario}</p>
              </article>
            ))
          ) : (
            <article className="review-card">
              <strong>Sin resenas todavia</strong>
              <p>Este vendedor aun no tiene resenas publicadas.</p>
            </article>
          )}
        </div>
      </section>

      <section className="featured-section featured-section-tight">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Prendas activas</p>
            <h2>Catalogo del vendedor</h2>
          </div>
        </div>
        <div className="product-grid">
          {profileProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {profileProducts.length === 0 ? (
          <div className="empty-state">
            <strong>Sin prendas activas</strong>
            <p>Este vendedor todavia no tiene publicaciones disponibles.</p>
          </div>
        ) : null}
      </section>
    </section>
  );
}

export default SellerProfilePage;
