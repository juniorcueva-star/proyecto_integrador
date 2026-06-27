export function adaptProduct(product) {
  if (!product) return product;

  return {
    ...product,
    name: product.name || product.nombre,
    category: product.category || product.categoria,
    brand: product.brand || product.marca,
    size: product.size || product.talla,
    seller: product.seller || product.nombreVendedor,
    price:
      product.price ||
      (product.precio !== undefined && product.precio !== null
        ? `S/ ${product.precio}`
        : ""),
    status:
      product.status ||
      (product.estadoPublicacion === "PUBLICADA"
        ? "Disponible"
        : product.estadoPublicacion || ""),
  };
}

export function adaptProducts(products = []) {
  return products.map(adaptProduct);
}
