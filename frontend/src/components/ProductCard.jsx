import { Link } from "react-router-dom";
import { resolveBackendMedia } from "../utils/media";
import { adaptProduct } from "../utils/productAdapter";

const fallbackProductImages = [
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
];

function getFallbackProductImage(product) {
  const rawKey = Number(product?.id) || String(product?.name || product?.nombre || "").length || 1;
  return fallbackProductImages[Math.abs(rawKey) % fallbackProductImages.length];
}

function ProductCard({ product }) {
  const normalizedProduct = adaptProduct(product);
  const imageUrl = resolveBackendMedia(normalizedProduct.imagenUrl) || getFallbackProductImage(normalizedProduct);
  const mediaStyle = imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(37, 52, 32, 0.08), rgba(44, 33, 25, 0.1)), url("${imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <article className="product-card">
      <div
        className="product-media product-media-image"
        style={mediaStyle}
      >
        <span
          className={
            normalizedProduct.status === "Intercambio"
              ? "status-badge status-badge-alt"
              : "status-badge"
          }
        >
          {normalizedProduct.status}
        </span>
      </div>

        <div className="product-content">
          <div className="product-meta-row">
            <span>{normalizedProduct.category}</span>
            <span>{normalizedProduct.size}</span>
          </div>
          <h3>{normalizedProduct.name}</h3>
          <p>{normalizedProduct.brand}</p>
          <div className="product-price-row">
            <strong>{normalizedProduct.price}</strong>
            <span>{normalizedProduct.previousPrice || ""}</span>
          </div>
          <div className="product-card-actions">
            <span>{normalizedProduct.seller}</span>
            <Link to={`/prenda/${normalizedProduct.id}`}>Ver detalle</Link>
          </div>
        </div>
      </article>
    );
}

export default ProductCard;
