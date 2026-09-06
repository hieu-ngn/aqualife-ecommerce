document.addEventListener("DOMContentLoaded", () => {
  const yearEls = document.querySelectorAll("[data-year]");
  const year = String(new Date().getFullYear());
  yearEls.forEach((el) => {
    el.textContent = year;
  });
});