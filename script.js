(function () {
  const STORAGE_KEY = "itasii-language";

  // TODO: Replace "#" with the final Google Form URL when it is ready.
  const GOOGLE_FORM_URL = "#";

  const root = document.documentElement;
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
      link.target = "_blank";
      link.rel = "noopener";
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
