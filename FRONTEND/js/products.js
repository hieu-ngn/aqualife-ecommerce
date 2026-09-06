// ===================== TRANG THAI (STATE) =====================
const state = {
  tatCaSanPham: [],
  sanPhamDaLoc: [],
  kieuSapXep: "new",
  loaiCa: "all",
  moiTruong: [],
  trangHienTai: 1,
  soSanPhamMoiTrang: 9,
};

// ===================== KHOI TAO =====================
document.addEventListener("DOMContentLoaded", khoiTao);

async function khoiTao() {
  try {
    state.tatCaSanPham = await Aqualife.loadProducts();

    ganSuKien();
    khoiTaoBoLocTuUrl();
    capNhatVaRender();
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    hienThiLoi();
  }
}

// ===================== GAN SU KIEN =====================
function ganSuKien() {
  ganFilter("#speciesFilter li", "loaiCa", "data-species");
  ganFilterMoiTruong();

  const input = document.getElementById("searchInput");
  input?.addEventListener("input", () => {
    capNhatState({});
  });

  const sort = document.getElementById("sort");
  sort?.addEventListener("change", (e) => {
    capNhatState({ kieuSapXep: e.target.value });
  });

  const list = document.getElementById("product-list");
  list?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-add")) {
      const id = e.target.dataset.id;
      Aqualife.addToCart(id, 1);
    }
  });
}

function ganFilter(selector, key, attr) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((el) => {
    el.addEventListener("click", () => {
      elements.forEach((item) => item.classList.remove("active"));
      el.classList.add("active");

      capNhatState({
        [key]: el.getAttribute(attr),
      });
    });
  });
}

function ganFilterMoiTruong() {
  const checkboxes = document.querySelectorAll(
    "#environmentFilter input[type='checkbox']"
  );

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const danhSachMoiTruong = Array.from(checkboxes)
        .filter((item) => item.checked)
        .map((item) => item.value);

      capNhatState({
        moiTruong: danhSachMoiTruong,
      });
    });
  });
}

function khoiTaoBoLocTuUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const mapMoiTruong = {
    freshwater: "Nước ngọt",
    brackish: "Nước lợ",
    saltwater: "Nước mặn",
  };
  const moiTruong = mapMoiTruong[category];

  if (!moiTruong) return;

  state.moiTruong = [moiTruong];

  const checkboxes = document.querySelectorAll(
    "#environmentFilter input[type='checkbox']"
  );

  checkboxes.forEach((checkbox) => {
    checkbox.checked = checkbox.value === moiTruong;
  });
}

// ===================== CAP NHAT STATE =====================
function capNhatState(newData) {
  Object.assign(state, newData);
  state.trangHienTai = 1;
  capNhatVaRender();
}

// ===================== FLOW CHINH =====================
function capNhatVaRender() {
  locSanPham();
  sapXepSanPham();
  renderSanPham();
  renderPhanTrang();
  capNhatSoLuong();
}

// ===================== LOGIC =====================
function locSanPham() {
  const tuKhoa =
    document.getElementById("searchInput")?.value.trim().toLowerCase() || "";

  state.sanPhamDaLoc = state.tatCaSanPham.filter((sp) => {
    const dungLoai =
      state.loaiCa === "all" || sp.species === state.loaiCa;

    const dungMoiTruong =
      state.moiTruong.length === 0 ||
      state.moiTruong.includes(sp.waterType);

    const dungTimKiem =
      sp.name.toLowerCase().includes(tuKhoa) ||
      sp.shortDescription.toLowerCase().includes(tuKhoa);

    return dungLoai && dungMoiTruong && dungTimKiem;
  });
}

function sapXepSanPham() {
  if (state.kieuSapXep === "low") {
    state.sanPhamDaLoc.sort((a, b) => a.price - b.price);
  } else if (state.kieuSapXep === "high") {
    state.sanPhamDaLoc.sort((a, b) => b.price - a.price);
  } else {
    state.sanPhamDaLoc.sort(
      (a, b) =>
        state.tatCaSanPham.indexOf(a) -
        state.tatCaSanPham.indexOf(b)
    );
  }
}

// ===================== RENDER =====================
function renderSanPham() {
  const list = document.getElementById("product-list");
  if (!list) return;

  const batDau = (state.trangHienTai - 1) * state.soSanPhamMoiTrang;
  const danhSach = state.sanPhamDaLoc.slice(
    batDau,
    batDau + state.soSanPhamMoiTrang
  );

  if (danhSach.length === 0) {
    list.innerHTML = htmlRong("Không có sản phẩm phù hợp");
    return;
  }

  list.innerHTML = danhSach.map(taoCardSanPham).join("");
}

function taoCardSanPham(sp) {
  return `
    <div class="product-card">
      <a href="product-detail.html?id=${sp.id}" class="product-image">
        <img src="${sp.image}" alt="${sp.name}" />
      </a>
      <div class="product-info">
        <h3>
          <a href="product-detail.html?id=${sp.id}">
            ${sp.name}
          </a>
        </h3>
        <p class="species">${sp.species}</p>
        <p class="environment">${sp.waterType}</p>
        <p class="description">${sp.shortDescription}</p>

        <div class="product-footer">
          <span class="price">
            ${Aqualife.formatCurrency(sp.price)}
          </span>
          <button class="btn-add" data-id="${sp.id}">
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===================== PHAN TRANG =====================
function renderPhanTrang() {
  const el = document.getElementById("pagination");
  if (!el) return;

  const tongTrang = Math.ceil(
    state.sanPhamDaLoc.length / state.soSanPhamMoiTrang
  );

  if (tongTrang <= 1) {
    el.innerHTML = "";
    return;
  }

  let html = "";

  for (let i = 1; i <= tongTrang; i++) {
    html += `
      <button
        class="${i === state.trangHienTai ? "active" : ""}"
        data-page="${i}">
        ${i}
      </button>
    `;
  }

  el.innerHTML = html;

  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.trangHienTai = Number(btn.dataset.page);
      renderSanPham();
      renderPhanTrang();

      document.querySelector(".main")?.scrollIntoView({
        behavior: "smooth",
      });
    });
  });
}

// ===================== KHAC =====================
function capNhatSoLuong() {
  const el = document.getElementById("count");
  if (el) {
    el.textContent = `${state.sanPhamDaLoc.length} sản phẩm`;
  }
}

function htmlRong(text) {
  return `<div style="text-align:center;color:#999;grid-column:1/-1;">${text}</div>`;
}

function hienThiLoi() {
  const list = document.getElementById("product-list");
  if (list) {
    list.innerHTML = htmlRong("Không thể tải sản phẩm");
  }
}
