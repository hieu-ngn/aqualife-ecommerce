document.addEventListener("DOMContentLoaded", async () => {
  const imageEl = document.getElementById("detail-image");
  const nameEl = document.getElementById("detail-name");
  const priceEl = document.getElementById("detail-price");
  const speciesEl = document.getElementById("detail-species");
  const waterTypeEl = document.getElementById("detail-water-type");
  const descEl = document.getElementById("detail-description");
  const quantityEl = document.getElementById("detail-quantity");
  const addBtn = document.getElementById("detail-add");
  const relatedEl = document.getElementById("related-products");

  if (!imageEl || !nameEl || !priceEl || !descEl || !quantityEl || !addBtn || !relatedEl) {
    return;
  }

  try {
    const products = await Aqualife.loadProducts();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || products[0]?.id;
    const product = Aqualife.findProductById(products, id) || products[0];

    if (!product) {
      nameEl.textContent = "Khong tim thay san pham";
      return;
    }

    imageEl.src = product.image;
    imageEl.alt = product.name;
    nameEl.textContent = product.name;
    priceEl.textContent = Aqualife.formatCurrency(product.price);
    speciesEl.textContent = product.species || "Chua co thong tin";
    waterTypeEl.textContent = product.waterType || "Chua co thong tin";
    descEl.textContent = product.description;

    addBtn.addEventListener("click", () => {
      const qty = Math.max(1, Number(quantityEl.value || 1));
      Aqualife.addToCart(product.id, qty);
      quantityEl.value = "1";
    });

    const related = laySanPhamLienQuan(products, product).slice(0, 3);
    relatedEl.innerHTML = related.map(taoCardSanPhamLienQuan).join("");

    relatedEl.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn-add")) {
        const idCanThem = event.target.dataset.id;
        Aqualife.addToCart(idCanThem, 1);
      }
    });
  } catch (error) {
    nameEl.textContent = `Co loi: ${error.message}`;
  }
});

function taoCardSanPhamLienQuan(product) {
  return `
    <article class="product-card related-product-card">
      <a href="product-detail.html?id=${product.id}" class="product-image">
        <img src="${product.image}" alt="${product.name}" />
      </a>
      <div class="product-info">
        <h3>
          <a href="product-detail.html?id=${product.id}">
            ${product.name}
          </a>
        </h3>
        <p class="species">${product.species}</p>
        <p class="environment">${product.waterType}</p>
        <p class="description">${product.shortDescription}</p>

        <div class="product-footer">
          <span class="price">${Aqualife.formatCurrency(product.price)}</span>
          <button class="btn-add" data-id="${product.id}" type="button">
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </article>
  `;
}

function laySanPhamLienQuan(products, product) {
  const sanPhamKhac = products.filter((item) => item.id !== product.id);
  const cungLoai = sanPhamKhac.filter((item) => item.species === product.species);
  const cungMoiTruong = sanPhamKhac.filter(
    (item) => item.species !== product.species && item.waterType === product.waterType
  );
  const conLai = sanPhamKhac.filter(
    (item) => item.species !== product.species && item.waterType !== product.waterType
  );

  return [...cungLoai, ...cungMoiTruong, ...conLai];
}
