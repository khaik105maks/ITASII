(function () {
  const STORAGE_KEY = "itasii-language";

  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfYMQHLORX7aMpEQ5e6l9yeZOUBbi4naPXkgSxikCnv1dy8WQ/viewform";

  const root = document.documentElement;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  function activeClass(page) {
    return currentPage === page ? ' class="is-active"' : "";
  }

  function renderHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    header.innerHTML = `<nav class="nav-bar" aria-label="Primary navigation">
      <a class="brand" href="index.html" aria-label="ITASII 2026 home"><span class="brand-mark">IT/26</span><span><strong>ITASII 2026</strong><small><span class="lang lang-uk">29–30 жовтня 2026 · Одеса · онлайн</span><span class="lang lang-en">29–30 October 2026 · Odesa · online</span></small></span></a>
      <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-toggle><span></span><span></span><span></span></button>
      <div class="nav-links">
        <a${activeClass("index.html")} href="index.html"><span class="lang lang-uk">Головна</span><span class="lang lang-en">Home</span></a>
        <a${activeClass("about.html")} href="about.html"><span class="lang lang-uk">Про нас</span><span class="lang lang-en">About</span></a>
        <a${activeClass("submission.html")} href="submission.html"><span class="lang lang-uk">Авторам</span><span class="lang lang-en">Authors</span></a>
        <a${activeClass("programme.html")} href="programme.html"><span class="lang lang-uk">Програма</span><span class="lang lang-en">Programme</span></a>
        <a${activeClass("committee.html")} href="committee.html"><span class="lang lang-uk">Комітет</span><span class="lang lang-en">Committee</span></a>
        <a${activeClass("contacts.html")} href="contacts.html"><span class="lang lang-uk">Контакти</span><span class="lang lang-en">Contacts</span></a>
        <div class="language-switch" aria-label="Language switcher"><button type="button" data-lang-switch="uk">UA</button><span>/</span><button type="button" data-lang-switch="en">EN</button></div>
        <a class="button button-dark" href="${GOOGLE_FORM_URL}" data-submission-link><span class="lang lang-uk">Подати →</span><span class="lang lang-en">Submit →</span></a>
      </div>
    </nav>`;
  }

  function renderFooter() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    footer.className = "site-footer";
    footer.innerHTML = `<div class="container footer-grid">
      <div><p class="footer-label">ITASII / 2026</p><p><span class="lang lang-uk">Міжнародна наукова конференція</span><span class="lang lang-en">International scientific conference</span></p></div>
      <div><p class="footer-label"><span class="lang lang-uk">Навігація</span><span class="lang lang-en">Navigation</span></p><a href="about.html"><span class="lang lang-uk">Про конференцію</span><span class="lang lang-en">About</span></a><a href="submission.html"><span class="lang lang-uk">Авторам</span><span class="lang lang-en">For Authors</span></a><a href="programme.html"><span class="lang lang-uk">Програма</span><span class="lang lang-en">Programme</span></a><a href="venue.html"><span class="lang lang-uk">Місце проведення</span><span class="lang lang-en">Venue</span></a><a href="committee.html"><span class="lang lang-uk">Комітети</span><span class="lang lang-en">Committees</span></a><a href="archive.html"><span class="lang lang-uk">Архів</span><span class="lang lang-en">Archive</span></a></div>
      <div><p class="footer-label"><span class="lang lang-uk">Контакти</span><span class="lang lang-en">Contacts</span></p><a href="mailto:itasii@khai.edu">itasii@khai.edu</a></div>
    </div>`;
  }

  renderHeader();
  renderFooter();

  function readStoredLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function storeLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // The site still works if storage is unavailable in a local browser mode.
    }
  }

  const preferred = readStoredLanguage();
  const initialLanguage = preferred === "en" || preferred === "uk" ? preferred : "uk";

  function applyLanguage(language) {
    root.dataset.lang = language;
    root.lang = language;
    storeLanguage(language);

    const title = document.body.dataset[language === "en" ? "titleEn" : "titleUk"];
    if (title) {
      document.title = title;
    }

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      const active = button.dataset.langSwitch === language;
      button.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.langSwitch));
  });

  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    const header = button.closest(".site-header");
    if (!header) return;

    button.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    header.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
      });
    });
  });

  document.querySelectorAll("[data-submission-link]").forEach((link) => {
    if (GOOGLE_FORM_URL !== "#") {
      link.href = GOOGLE_FORM_URL;
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });

  const screenMain = document.querySelector(".screen-page main");
  if (screenMain) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        screenMain.scrollTo({
          top: target.offsetTop,
          behavior: "smooth",
        });
      });
    });
  }

  applyLanguage(initialLanguage);
})();
