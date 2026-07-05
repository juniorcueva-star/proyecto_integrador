import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { uploadPaymentProof } from "../api/comprobantesPago";
import { fetchProductDetail } from "../api/prendas";
import { fetchPublicProfile } from "../api/usuarios";
import { getAuthSession } from "../utils/authStorage";
import { resolveBackendMedia } from "../utils/media";
import { formatPrice } from "../utils/productAdapter";

function buildWhatsappLink(contactValue, productName) {
  const digits = String(contactValue || "").replace(/\D/g, "");
  const localPhone = digits.length === 11 && digits.startsWith("51") ? digits.slice(2) : digits;

  if (!/^9\d{8}$/.test(localPhone)) return "";

  const message = encodeURIComponent(
    `Hola, estoy interesado en la prenda "${productName}". La vi en Estilo IA.`,
  );

  return `https://wa.me/51${localPhone}?text=${message}`;
}

function ProductDetailPage() {
  const { id } = useParams();
  const session = getAuthSession();
  const [product, setProduct] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofStatus, setProofStatus] = useState({ type: "", message: "" });
  const checkoutPanelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        const data = await fetchProductDetail(id);
        if (!isMounted) return;
        setProduct(data);

        if (data?.usuarioId) {
          try {
            const profile = await fetchPublicProfile(data.usuarioId);
            if (!isMounted) return;
            setSellerProfile(profile);
          } catch {
            if (!isMounted) return;
            setSellerProfile(null);
          }
        }

        setError("");
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || "No se pudo cargar el detalle de la prenda.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const detailImage = resolveBackendMedia(product?.imagenUrl);
  const sellerPaymentMethods = sellerProfile?.metodosPago || [];
  const isOwnProduct = String(product?.usuarioId || "") === String(session?.usuarioId || "");
  const whatsappLink = buildWhatsappLink(
    product?.contacto || sellerProfile?.telefono,
    product?.nombre || "esta prenda",
  );

  function handleBuyProduct() {
    setShowCheckout(true);
    window.setTimeout(() => {
      checkoutPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function handlePaymentProofSubmit(event) {
    event.preventDefault();
    setProofStatus({ type: "", message: "" });

    try {
      await uploadPaymentProof(
        {
          vendedorId: product?.usuarioId,
          vendedorNombre: sellerProfile?.nombre || product?.nombreVendedor || "",
          prendaId: product?.id,
          prendaNombre: product?.nombre,
          monto: product?.precio,
        },
        proofFile,
      );
      setProofFile(null);
      setProofStatus({
        type: "success",
        message: "Comprobante enviado. El administrador podra revisarlo en el perfil del vendedor.",
      });
    } catch (proofError) {
      setProofStatus({ type: "error", message: proofError.message });
    }
  }

  if (loading) {
    return (
      <section className="detail-page">
        <div className="empty-state">
          <strong>Cargando prenda...</strong>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="detail-page">
        <div className="empty-state">
          <strong>No se pudo cargar esta prenda.</strong>
          <p>{error}</p>
          <Link to="/catalogo" className="button-primary">
            Volver al catalogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <div className="detail-layout">
        <div
          className={`detail-media product-media ${detailImage ? "product-media-image" : "product-media-camel"}`}
          style={
            detailImage
              ? {
                  backgroundImage: `linear-gradient(rgba(241, 228, 206, 0.08), rgba(234, 219, 195, 0.08)), url("${detailImage}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        ></div>

        <div className="detail-panel">
          <p className="section-kicker">Detalle de prenda</p>
          <h1>{product.nombre}</h1>
          <p className="detail-lead">
            {product.descripcion}
          </p>

          <div className="detail-meta-grid">
            <div><strong>Marca</strong><span>{product.marca}</span></div>
            <div><strong>Talla</strong><span>{product.talla}</span></div>
            <div><strong>Color</strong><span>{product.color}</span></div>
            <div><strong>Estado</strong><span>{product.estadoFisico}</span></div>
            <div><strong>Tipo</strong><span>{product.tipoPublicacion}</span></div>
            <div><strong>Precio</strong><span>{formatPrice(product.precio)}</span></div>
            <div><strong>Contacto</strong><span>{product?.contacto || "No registrado"}</span></div>
          </div>

          <div className="detail-actions">
            {!isOwnProduct ? (
              <button type="button" className="button-primary" onClick={handleBuyProduct}>
                Comprar prenda
              </button>
            ) : null}
            {sellerProfile ? (
              <Link to={`/vendedor/${product?.usuarioId}`} className="button-secondary">
                Ver vendedor
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {showCheckout && !isOwnProduct ? (
        <section className="checkout-panel" ref={checkoutPanelRef}>
          <div className="checkout-panel-head">
            <div>
              <p className="section-kicker">Compra simulada</p>
              <h2>Datos de pago del vendedor</h2>
            </div>
            <strong>{formatPrice(product.precio)}</strong>
          </div>

          <div className="checkout-product-summary">
            <span>{product.nombre}</span>
            <span>{sellerProfile?.nombre || product.nombreVendedor || "Vendedor Estilo IA"}</span>
          </div>

          <div className="checkout-payment-grid">
            {sellerPaymentMethods.length ? (
              sellerPaymentMethods.map((method) => (
                <article key={method.id || method.tipoMetodoPago} className="checkout-payment-card">
                  <div>
                    <strong>{method.tipoMetodoPago}</strong>
                    <p>{method.numero || "Numero no registrado"}</p>
                    {method.titular ? <span>Titular: {method.titular}</span> : null}
                    {method.instrucciones ? <span>{method.instrucciones}</span> : null}
                  </div>
                  {method.qrUrl ? (
                    <img src={resolveBackendMedia(method.qrUrl)} alt={`QR de ${method.tipoMetodoPago}`} />
                  ) : (
                    <div className="checkout-qr-empty">Sin QR</div>
                  )}
                </article>
              ))
            ) : (
              <article className="checkout-payment-card">
                <div>
                  <strong>Sin metodos de pago visibles</strong>
                  <p>Coordina el pago directamente con el vendedor.</p>
                </div>
                <div className="checkout-qr-empty">Pago pendiente</div>
              </article>
            )}
          </div>

          <form className="checkout-proof-form" onSubmit={handlePaymentProofSubmit}>
            <label>
              Subir comprobante de pago
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => setProofFile(event.target.files?.[0] || null)}
              />
              <span className="file-helper">
                {proofFile
                  ? `Comprobante seleccionado: ${proofFile.name}`
                  : "Adjunta una captura o foto del pago realizado."}
              </span>
            </label>
            {proofStatus.message ? (
              <div className={`form-message form-message-${proofStatus.type}`}>
                {proofStatus.message}
              </div>
            ) : null}
            <button type="submit" className="button-secondary">
              Enviar comprobante al administrador
            </button>
          </form>

          <div className="checkout-footer">
            <span>Contacte con el vendedor para confirmar disponibilidad y envio.</span>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                className="button-primary button-whatsapp"
                target="_blank"
                rel="noreferrer"
              >
                Contacte con el vendedor
              </a>
            ) : (
              <span className="checkout-contact-missing">Telefono no registrado</span>
            )}
          </div>
        </section>
      ) : null}

      {false ? (
        <>
      <section className="detail-extras">
        <article className="info-panel">
          <h2>Descripción</h2>
          <p>
            {product.descripcion}
          </p>
        </article>

        <article className="info-panel">
          <h2>Métodos de pago del vendedor</h2>
          <div className="payment-list">
            {sellerPaymentMethods.length ? (
              sellerPaymentMethods.map((method) => (
                <div key={method.id || method.tipoMetodoPago} className="payment-item">
                  <strong>{method.tipoMetodoPago}</strong>
                  <span>{method.numero || method.titular || method.instrucciones || "Activo"}</span>
                </div>
              ))
            ) : (
              <div className="payment-item">
              <strong>Sin métodos visibles</strong>
                <span>Contacta al vendedor</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Confianza</p>
            <h2>Resenas del vendedor</h2>
          </div>
        </div>

        <div className="review-grid">
          {sellerProfileReviews.length ? (
            sellerProfileReviews.map((review) => (
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
              <strong>Sin reseñas todavía</strong>
              <p>Este vendedor aún no tiene reseñas registradas.</p>
            </article>
          )}
        </div>
      </section>
        </>
      ) : null}
    </section>
  );
}

export default ProductDetailPage;
