import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicProfile } from "../api/usuarios";
import ProductCard from "../components/ProductCard";
import { featuredProducts, paymentMethods, sellerReviews } from "../data/mockData";
import { adaptProducts } from "../utils/productAdapter";

function SellerProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
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
        setError("No se pudo cargar el perfil publico real. Se muestra una vista de referencia.");
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const profileProducts = profile?.prendasPublicadas?.length
    ? adaptProducts(profile.prendasPublicadas)
    : featuredProducts.slice(0, 3);

  const profilePayments = profile?.metodosPago?.length ? profile.metodosPago : paymentMethods;
  const profileReviews = profile?.resenasRecibidas?.length ? profile.resenasRecibidas : sellerReviews;

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">SM</div>
        <div>
          <p className="section-kicker">Perfil publico</p>
          <h1>{profile?.nombre || "Sofia Marin"}</h1>
          <p className="profile-summary">
            {error ||
              "Vendedora con enfoque en piezas atemporales, envios bien cuidados y excelente reputacion dentro de la comunidad."}
          </p>
        </div>
      </div>

      <div className="profile-stats">
        <article><strong>{profile?.promedioCalificacion ?? "4.9"}</strong><span>valoracion media</span></article>
        <article><strong>{profile?.cantidadResenas ?? "128"}</strong><span>resenas recibidas</span></article>
        <article><strong>{profilePayments.length}</strong><span>metodos de pago</span></article>
      </div>

      <section className="profile-panels">
        <article className="info-panel">
          <h2>Sobre el vendedor</h2>
          <p>
            Especialista en piezas neutras, blazers, abrigos y prendas
            atemporales con buen acabado para oficina o uso diario.
          </p>
        </article>

        <article className="info-panel">
          <h2>Metodos de pago activos</h2>
          <div className="payment-list">
            {profilePayments.map((method) => (
              <div
                key={method.id || method.type || method.tipoMetodoPago}
                className="payment-item"
              >
                <strong>{method.type || method.tipoMetodoPago}</strong>
                <span>{method.detail || method.numero || method.titular || "Activo"}</span>
              </div>
            ))}
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
          {profileReviews.map((review) => (
            <article
              key={review.id || review.author || review.nombreAutor}
              className="review-card"
            >
              <strong>{review.author || review.nombreAutor}</strong>
              <span>{review.score || review.calificacion}</span>
              <p>{review.text || review.comentario}</p>
            </article>
          ))}
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
          {profileProducts.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </section>
  );
}

export default SellerProfilePage;
