/* ==========================================================================
   VIMH — main.js
   Mobile nav, filters, booking steps, FAQ (native details), form validation
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Shared helpers ---------- */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function setInvalid(field, invalid) {
    if (!field) return;
    field.classList.toggle("is-invalid", invalid);
    var input = field.querySelector("input, select, textarea");
    if (input) {
      input.setAttribute("aria-invalid", invalid ? "true" : "false");
      var err = field.querySelector(".error");
      if (err && err.id) {
        if (invalid) input.setAttribute("aria-describedby", err.id);
        else input.removeAttribute("aria-describedby");
      }
    }
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isPhMobile(value) {
    var digits = value.replace(/\D/g, "");
    return /^(09\d{9}|639\d{9})$/.test(digits);
  }

  function ensureToastRegion() {
    var region = qs("#toast-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "toast-region";
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-relevant", "additions");
      document.body.appendChild(region);
    }
    return region;
  }

  function showToast(message, type) {
    var region = ensureToastRegion();
    var toast = document.createElement("div");
    toast.className = "toast toast--" + (type || "success");
    toast.setAttribute("role", "status");
    toast.innerHTML =
      "<p style=\"margin:0;flex:1\">" +
      message +
      '</p><button type="button" class="toast__close icon-btn" aria-label="Dismiss notification">×</button>';
    region.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    function dismiss() {
      toast.classList.remove("is-visible");
      setTimeout(function () {
        toast.remove();
      }, 200);
    }

    qs(".toast__close", toast).addEventListener("click", dismiss);
    setTimeout(dismiss, 5000);
  }

  function setButtonLoading(btn, loading, loadingLabel) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");
      btn.disabled = true;
      btn.innerHTML =
        '<span class="btn__spinner" aria-hidden="true"></span><span class="btn__label">' +
        (loadingLabel || "Loading…") +
        "</span>";
    } else {
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  /* ---------- Footer year ---------- */
  qsa("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Portal greeting ---------- */
  var greeting = qs("#greeting");
  if (greeting) {
    var hour = new Date().getHours();
    var part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    greeting.textContent = part + ", Maria";
  }

  /* ---------- Header search (mobile) ---------- */
  var searchToggle = qs(".header-search-toggle");
  var headerSearch = qs("#header-search");
  if (searchToggle && headerSearch) {
    searchToggle.addEventListener("click", function () {
      var open = headerSearch.classList.toggle("is-open");
      headerSearch.hidden = !open;
      searchToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var input = qs("input", headerSearch);
        if (input) input.focus();
      }
    });
  }

  /* ---------- Mobile navigation drawer ---------- */
  var drawer = qs("#nav-drawer");
  var menuToggle = qs(".menu-toggle");
  var lastFocus = null;

  function getFocusable(container) {
    return qsa(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function openDrawer() {
    if (!drawer || !menuToggle) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
    });
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    var panel = qs(".nav-drawer__panel", drawer);
    var focusables = getFocusable(panel);
    if (focusables.length) focusables[0].focus();
  }

  function closeDrawer() {
    if (!drawer || !menuToggle) return;
    drawer.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    setTimeout(function () {
      drawer.hidden = true;
    }, 200);
    if (lastFocus) lastFocus.focus();
  }

  if (menuToggle && drawer) {
    menuToggle.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer();
    });

    qsa("[data-close-drawer]", drawer).forEach(function (el) {
      el.addEventListener("click", closeDrawer);
    });

    document.addEventListener("keydown", function (e) {
      if (!drawer.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key === "Tab") {
        var panel = qs(".nav-drawer__panel", drawer);
        var focusables = getFocusable(panel);
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------- Carousel controls ---------- */
  var carousel = qs("[data-carousel], .carousel");
  if (carousel) {
    var prev = qs("[data-carousel-prev]");
    var next = qs("[data-carousel-next]");
    var scrollAmt = 300;

    function updateCarouselButtons() {
      var maxScroll = carousel.scrollWidth - carousel.clientWidth - 4;
      if (prev) {
        var atStart = carousel.scrollLeft <= 4;
        prev.disabled = atStart;
        prev.setAttribute("aria-disabled", atStart ? "true" : "false");
      }
      if (next) {
        var atEnd = carousel.scrollLeft >= maxScroll;
        next.disabled = atEnd;
        next.setAttribute("aria-disabled", atEnd ? "true" : "false");
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        carousel.scrollBy({ left: -scrollAmt, behavior: "smooth" });
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        carousel.scrollBy({ left: scrollAmt, behavior: "smooth" });
      });
    }
    carousel.addEventListener("scroll", updateCarouselButtons, { passive: true });
    window.addEventListener("resize", updateCarouselButtons);
    updateCarouselButtons();
  }

  /* ---------- Accessible tabs + hash ---------- */
  var tabsRoot = qs("[data-tabs]");
  if (tabsRoot) {
    var tabs = qsa('[role="tab"]', tabsRoot);
    var panels = qsa('[role="tabpanel"]', tabsRoot);

    function activateTab(tab, updateHash) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
      if (updateHash !== false) {
        var hash = tab.getAttribute("data-hash");
        if (hash) {
          history.replaceState(null, "", "#" + hash);
        }
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateTab(tab);
      });
      tab.addEventListener("keydown", function (e) {
        var nextIndex = index;
        if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") nextIndex = 0;
        else if (e.key === "End") nextIndex = tabs.length - 1;
        else return;
        e.preventDefault();
        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex]);
      });
    });

    var initialHash = (location.hash || "").replace("#", "");
    var match = tabs.find(function (t) {
      return t.getAttribute("data-hash") === initialHash;
    });
    if (match) activateTab(match, false);
    else if (tabs[0]) activateTab(tabs[0], false);

    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace("#", "");
      var t = tabs.find(function (tab) {
        return tab.getAttribute("data-hash") === h;
      });
      if (t) activateTab(t, false);
    });
  }

  /* ---------- Department filter chips ---------- */
  function updateDeptResults() {
    var visible = qsa("#department-grid [data-category]").filter(function (card) {
      return !card.hidden;
    });
    var countEl = qs("#dept-results-count");
    if (countEl) {
      countEl.textContent =
        visible.length === 1
          ? "Showing 1 department"
          : "Showing " + visible.length + " departments";
    }
  }

  function sortDepartments(mode) {
    var grid = qs("#department-grid");
    if (!grid) return;
    var cards = qsa("[data-category]", grid);
    cards.sort(function (a, b) {
      if (mode === "category") {
        var ca = a.getAttribute("data-category") || "";
        var cb = b.getAttribute("data-category") || "";
        if (ca !== cb) return ca.localeCompare(cb);
      }
      return (a.getAttribute("data-name") || "").localeCompare(b.getAttribute("data-name") || "");
    });
    cards.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  qsa("[data-dept-filter]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var filter = chip.getAttribute("data-dept-filter");
      qsa("[data-dept-filter]").forEach(function (c) {
        var active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });
      qsa("#department-grid [data-category]").forEach(function (card) {
        var show = filter === "all" || card.getAttribute("data-category") === filter;
        card.hidden = !show;
      });
      updateDeptResults();
    });
  });

  var deptSort = qs("#dept-sort");
  if (deptSort) {
    deptSort.addEventListener("change", function () {
      sortDepartments(deptSort.value);
      updateDeptResults();
    });
  }

  /* ---------- Doctor directory ---------- */
  var DOCTORS = [
    { id: "ana-reyes", name: "Dr. Ana Reyes, MD", specialty: "Cardiology", credentials: "FPCP, FPCC", gender: "F", languages: ["English", "Filipino"], days: ["Mon", "Wed", "Fri"], next: "Mon 10:00 AM", photo: "assets/img/doctor-ana.jpg" },
    { id: "miguel-santos", name: "Dr. Miguel Santos, MD", specialty: "Internal Medicine", credentials: "FPCP", gender: "M", languages: ["English", "Filipino"], days: ["Tue", "Thu", "Sat"], next: "Tue 9:00 AM", photo: "assets/img/doctor-miguel.jpg" },
    { id: "sofia-cruz", name: "Dr. Sofia Cruz, MD", specialty: "Pediatrics", credentials: "FPSMS", gender: "F", languages: ["English", "Filipino"], days: ["Mon", "Tue", "Thu"], next: "Thu 1:30 PM", photo: "assets/img/doctor-sofia.jpg" },
    { id: "james-lim", name: "Dr. James Lim, MD", specialty: "Orthopedics", credentials: "FPOA", gender: "M", languages: ["English", "Filipino", "Chinese"], days: ["Wed", "Fri"], next: "Wed 11:00 AM", photo: "assets/img/doctor-james.jpg" },
    { id: "lara-gonzales", name: "Dr. Lara Gonzales, MD", specialty: "Obstetrics", credentials: "FPOGS", gender: "F", languages: ["English", "Filipino"], days: ["Mon", "Thu", "Sat"], next: "Sat 8:30 AM", photo: "assets/img/doctor-sofia.jpg" },
    { id: "paolo-tan", name: "Dr. Paolo Tan, MD", specialty: "Dermatology", credentials: "FPDS", gender: "M", languages: ["English", "Chinese"], days: ["Tue", "Fri"], next: "Fri 2:00 PM", photo: "assets/img/doctor-miguel.jpg" },
    { id: "nina-bautista", name: "Dr. Nina Bautista, MD", specialty: "Cardiology", credentials: "FPCP", gender: "F", languages: ["English", "Filipino"], days: ["Tue", "Thu"], next: "Tue 3:00 PM", photo: "assets/img/doctor-ana.jpg" },
    { id: "carlo-mendoza", name: "Dr. Carlo Mendoza, MD", specialty: "Internal Medicine", credentials: "FPCP", gender: "M", languages: ["English", "Filipino"], days: ["Mon", "Wed", "Fri"], next: "Mon 4:00 PM", photo: "assets/img/doctor-james.jpg" },
    { id: "isabelle-uy", name: "Dr. Isabelle Uy, MD", specialty: "Pediatrics", credentials: "FPSMS", gender: "F", languages: ["English", "Filipino", "Chinese"], days: ["Wed", "Sat"], next: "Sat 10:00 AM", photo: "assets/img/doctor-sofia.jpg" },
    { id: "rafael-diaz", name: "Dr. Rafael Diaz, MD", specialty: "Orthopedics", credentials: "FPOA", gender: "M", languages: ["English", "Filipino"], days: ["Mon", "Thu"], next: "Thu 9:30 AM", photo: "assets/img/doctor-miguel.jpg" },
    { id: "grace-villanueva", name: "Dr. Grace Villanueva, MD", specialty: "Obstetrics", credentials: "FPOGS", gender: "F", languages: ["English", "Filipino"], days: ["Tue", "Fri"], next: "Fri 11:30 AM", photo: "assets/img/doctor-ana.jpg" },
    { id: "henry-chua", name: "Dr. Henry Chua, MD", specialty: "Dermatology", credentials: "FPDS", gender: "M", languages: ["English", "Chinese", "Filipino"], days: ["Wed", "Sat"], next: "Wed 1:00 PM", photo: "assets/img/doctor-james.jpg" }
  ];

  var resultsEl = qs("#doctor-results");
  var countEl = qs("#results-count");
  var emptyEl = qs("#doctor-empty");

  function getDoctorFilters() {
    var specialties = qsa('input[name="specialty"]:checked').map(function (el) {
      return el.value;
    });
    var languages = qsa('input[name="language"]:checked').map(function (el) {
      return el.value;
    });
    var genderEl = qs('input[name="gender"]:checked');
    return {
      q: (qs("#doctor-search") && qs("#doctor-search").value.trim().toLowerCase()) || "",
      specialties: specialties,
      day: (qs("#availability-day") && qs("#availability-day").value) || "",
      gender: genderEl ? genderEl.value : "",
      languages: languages
    };
  }

  function filterDoctors() {
    if (!resultsEl) return;
    var f = getDoctorFilters();
    var filtered = DOCTORS.filter(function (d) {
      if (f.q && d.name.toLowerCase().indexOf(f.q) === -1 && d.specialty.toLowerCase().indexOf(f.q) === -1) {
        return false;
      }
      if (f.specialties.length && f.specialties.indexOf(d.specialty) === -1) return false;
      if (f.day && d.days.indexOf(f.day) === -1) return false;
      if (f.gender && d.gender !== f.gender) return false;
      if (f.languages.length && !f.languages.some(function (l) { return d.languages.indexOf(l) !== -1; })) {
        return false;
      }
      return true;
    });

    resultsEl.innerHTML = "";
    if (countEl) {
      countEl.textContent =
        filtered.length === 1 ? "Showing 1 doctor" : "Showing " + filtered.length + " doctors";
    }
    if (emptyEl) emptyEl.hidden = filtered.length > 0;

    filtered.forEach(function (d) {
      var article = document.createElement("article");
      article.className = "doctor-result";
      article.innerHTML =
        '<div class="doctor-result__photo"><img src="' +
        d.photo +
        '" width="96" height="96" loading="lazy" alt="Portrait of ' +
        d.name.replace(/, MD$/, "") +
        '"></div>' +
        "<div><h3 style=\"font-size:1.125rem;margin-bottom:4px\">" +
        d.name +
        "</h3>" +
        '<p class="doctor-result__meta">' +
        d.specialty +
        " · " +
        d.credentials +
        "</p>" +
        '<p class="doctor-result__meta">Languages: ' +
        d.languages.join(", ") +
        "</p>" +
        '<p class="doctor-result__meta">Next available: <strong>' +
        d.next +
        "</strong></p></div>" +
        '<div><a class="btn btn--primary" href="book.html?doctor=' +
        d.id +
        "&specialty=" +
        encodeURIComponent(d.specialty) +
        '">Book</a></div>';
      resultsEl.appendChild(article);
    });
  }

  if (resultsEl) {
    filterDoctors();
    ["#doctor-search", "#availability-day"].forEach(function (sel) {
      var el = qs(sel);
      if (el) el.addEventListener("input", filterDoctors);
      if (el) el.addEventListener("change", filterDoctors);
    });
    qsa('input[name="specialty"], input[name="gender"], input[name="language"]').forEach(function (el) {
      el.addEventListener("change", filterDoctors);
    });

    function resetFilters() {
      var search = qs("#doctor-search");
      if (search) search.value = "";
      var day = qs("#availability-day");
      if (day) day.value = "";
      qsa('input[name="specialty"], input[name="language"]').forEach(function (el) {
        el.checked = false;
      });
      var any = qs("#g-any");
      if (any) any.checked = true;
      filterDoctors();
    }

    var resetBtn = qs("#reset-filters");
    var emptyReset = qs("#empty-reset");
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);
    if (emptyReset) emptyReset.addEventListener("click", resetFilters);

    /* Mobile filter sheet */
    var sheetToggle = qs("#filter-sheet-toggle");
    var filterPanel = qs("#doctor-filters");
    var filterBackdrop = qs("#filter-backdrop");
    var closeFilters = qs("#close-filters");

    function openFilters() {
      if (!filterPanel) return;
      filterPanel.classList.add("is-open");
      if (filterBackdrop) {
        filterBackdrop.hidden = false;
        filterBackdrop.classList.add("is-open");
      }
      if (sheetToggle) sheetToggle.setAttribute("aria-expanded", "true");
      if (closeFilters) closeFilters.hidden = false;
    }

    function closeFilterSheet() {
      if (!filterPanel) return;
      filterPanel.classList.remove("is-open");
      if (filterBackdrop) {
        filterBackdrop.classList.remove("is-open");
        filterBackdrop.hidden = true;
      }
      if (sheetToggle) sheetToggle.setAttribute("aria-expanded", "false");
      if (closeFilters) closeFilters.hidden = true;
    }

    if (sheetToggle) sheetToggle.addEventListener("click", openFilters);
    if (closeFilters) closeFilters.addEventListener("click", closeFilterSheet);
    if (filterBackdrop) filterBackdrop.addEventListener("click", closeFilterSheet);

    /* Prefill from ?q= */
    var params = new URLSearchParams(location.search);
    var qParam = params.get("q");
    if (qParam && qs("#doctor-search")) {
      qs("#doctor-search").value = qParam;
      var doctorsTab = qs("#tab-doctors");
      if (doctorsTab) doctorsTab.click();
      filterDoctors();
    }
  }

  /* ---------- Contact form ---------- */
  var contactForm = qs("#contact-form");
  if (contactForm) {
    var topicParam = new URLSearchParams(location.search).get("topic");
    if (topicParam && qs("#topic")) {
      var opt = qs('#topic option[value="' + topicParam + '"]');
      if (opt && !opt.disabled) qs("#topic").value = topicParam;
    }
  }

  /* ---------- Booking wizard ---------- */
  var booking = qs("[data-booking]");
  if (booking) {
    var step = 1;
    var state = {
      specialty: "",
      doctor: "any",
      doctorLabel: "Any available",
      date: null,
      time: null,
      name: "",
      birthdate: "",
      phone: "",
      email: "",
      patientType: "new",
      reason: ""
    };

    var specialtySelect = qs("#book-specialty");
    var doctorSelect = qs("#book-doctor");
    var live = qs("#booking-live");

    function announce(msg) {
      if (live) live.textContent = msg;
    }

    function doctorsForSpecialty(specialty) {
      return DOCTORS.filter(function (d) {
        return !specialty || d.specialty === specialty;
      });
    }

    function populateDoctors() {
      if (!doctorSelect || !specialtySelect) return;
      var specialty = specialtySelect.value;
      var current = doctorSelect.value;
      doctorSelect.innerHTML = '<option value="any">Any available</option>';
      doctorsForSpecialty(specialty).forEach(function (d) {
        var opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.name;
        doctorSelect.appendChild(opt);
      });
      if (current && qs('option[value="' + current + '"]', doctorSelect)) {
        doctorSelect.value = current;
      }
    }

    if (specialtySelect) {
      specialtySelect.addEventListener("change", function () {
        state.specialty = specialtySelect.value;
        populateDoctors();
        updateSummary();
      });
    }
    if (doctorSelect) {
      doctorSelect.addEventListener("change", function () {
        state.doctor = doctorSelect.value;
        state.doctorLabel =
          doctorSelect.value === "any"
            ? "Any available"
            : doctorSelect.options[doctorSelect.selectedIndex].text;
        updateSummary();
      });
    }

    /* Prefill from query */
    var bookParams = new URLSearchParams(location.search);
    if (bookParams.get("specialty") && specialtySelect) {
      specialtySelect.value = bookParams.get("specialty");
      state.specialty = specialtySelect.value;
    }
    populateDoctors();
    if (bookParams.get("doctor") && doctorSelect) {
      doctorSelect.value = bookParams.get("doctor");
      state.doctor = doctorSelect.value;
      if (doctorSelect.selectedIndex >= 0) {
        state.doctorLabel = doctorSelect.options[doctorSelect.selectedIndex].text;
      }
    }

    /* Calendar */
    var calendar = qs("#booking-calendar");
    var timeSlots = qs("#time-slots");
    var monthLabel = qs("#calendar-month-label");
    var TIME_OPTIONS = ["08:30 AM", "09:00 AM", "10:00 AM", "10:30 AM", "01:00 PM", "02:00 PM", "03:30 PM", "04:00 PM"];
    var DISABLED_TIMES = { "09:00 AM": true, "02:00 PM": true };

    function buildCalendar() {
      if (!calendar) return;
      calendar.innerHTML = "";
      var now = new Date();
      var year = now.getFullYear();
      var month = now.getMonth();
      if (monthLabel) {
        monthLabel.textContent =
          "Select an available day in " +
          now.toLocaleString("en-PH", { month: "long", year: "numeric" }) +
          ".";
      }

      ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(function (d) {
        var head = document.createElement("div");
        head.className = "calendar__head";
        head.textContent = d;
        calendar.appendChild(head);
      });

      var first = new Date(year, month, 1);
      var startPad = first.getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      for (var i = 0; i < startPad; i++) {
        var empty = document.createElement("div");
        calendar.appendChild(empty);
      }

      for (var day = 1; day <= daysInMonth; day++) {
        var date = new Date(year, month, day);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "calendar__day";
        btn.textContent = String(day);
        btn.setAttribute("aria-label", date.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" }));

        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var isPast = date < today;
        var isSunday = date.getDay() === 0;
        var isToday =
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate();
        if (isToday) btn.classList.add("is-today");
        if (isPast || isSunday) {
          btn.disabled = true;
          btn.classList.add("is-unavailable");
          btn.setAttribute("aria-disabled", "true");
          btn.tabIndex = -1;
        } else {
          btn.addEventListener("click", function (d) {
            return function () {
              qsa(".calendar__day.is-selected", calendar).forEach(function (b) {
                b.classList.remove("is-selected");
                b.removeAttribute("aria-pressed");
              });
              btn.classList.add("is-selected");
              btn.setAttribute("aria-pressed", "true");
              state.date = d;
              state.time = null;
              renderTimes();
              updateSummary();
              announce("Selected " + d.toLocaleDateString("en-PH", { dateStyle: "full" }));
            };
          }(date));
        }
        calendar.appendChild(btn);
      }
    }

    function renderTimes() {
      if (!timeSlots) return;
      timeSlots.innerHTML = "";
      TIME_OPTIONS.forEach(function (t) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "time-slot";
        btn.textContent = t;
        if (DISABLED_TIMES[t]) {
          btn.disabled = true;
          btn.classList.add("is-booked");
          btn.setAttribute("aria-disabled", "true");
          btn.setAttribute("aria-label", t + ", full");
          btn.tabIndex = -1;
        } else {
          btn.addEventListener("click", function () {
            qsa(".time-slot.is-selected", timeSlots).forEach(function (b) {
              b.classList.remove("is-selected");
            });
            btn.classList.add("is-selected");
            state.time = t;
            updateSummary();
            var err = qs("#datetime-error");
            if (err) err.style.display = "none";
          });
        }
        timeSlots.appendChild(btn);
      });
    }

    buildCalendar();
    renderTimes();

    function updateSummary() {
      var map = {
        "#sum-specialty": state.specialty || "Not selected",
        "#sum-doctor": state.doctorLabel || "Any available",
        "#sum-date": state.date
          ? state.date.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
          : "Not selected",
        "#sum-time": state.time || "Not selected",
        "#sum-patient": state.name || "—"
      };
      Object.keys(map).forEach(function (sel) {
        var el = qs(sel);
        if (el) el.textContent = map[sel];
      });
    }

    function showStep(n) {
      step = n;
      qsa(".wizard-panel").forEach(function (panel) {
        var s = panel.getAttribute("data-step");
        if (n === "success") {
          panel.hidden = s !== "success";
        } else {
          panel.hidden = String(s) !== String(n);
        }
      });
      qsa("[data-progress]").forEach(function (el) {
        var p = Number(el.getAttribute("data-progress"));
        var isActive = typeof n === "number" && p === n;
        var isComplete = typeof n === "number" && p < n;
        el.classList.toggle("is-active", isActive);
        el.classList.toggle("is-complete", isComplete);
        if (isActive) el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
        if (isComplete) {
          el.disabled = false;
          el.removeAttribute("aria-disabled");
        } else {
          el.disabled = !isActive;
          el.setAttribute("aria-disabled", isActive ? "false" : "true");
        }
      });
      var heading = qs(".wizard-panel:not([hidden]) h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
      announce(n === "success" ? "Appointment requested successfully." : "Step " + n + " of 4");
    }

    qsa("[data-progress]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (!el.classList.contains("is-complete")) return;
        showStep(Number(el.getAttribute("data-progress")));
      });
    });

    function validateStep(n) {
      if (n === 1) {
        var field = specialtySelect && specialtySelect.closest(".form-field");
        var ok = specialtySelect && specialtySelect.value !== "";
        setInvalid(field, !ok);
        if (!ok) {
          announce("Please select a specialty.");
          specialtySelect.focus();
        }
        state.specialty = specialtySelect.value;
        state.doctor = doctorSelect.value;
        state.doctorLabel =
          doctorSelect.value === "any"
            ? "Any available"
            : doctorSelect.options[doctorSelect.selectedIndex].text;
        updateSummary();
        return ok;
      }

      if (n === 2) {
        var ok2 = !!(state.date && state.time);
        var err = qs("#datetime-error");
        if (err) err.style.display = ok2 ? "none" : "block";
        if (!ok2) announce("Select both a date and a time slot.");
        updateSummary();
        return ok2;
      }

      if (n === 3) {
        var ok3 = true;
        var nameInput = qs("#patient-name");
        var birthInput = qs("#patient-birthdate");
        var phoneInput = qs("#patient-phone");
        var emailInput = qs("#patient-email");
        var reasonInput = qs("#visit-reason");
        var consent = qs("#consent");

        setInvalid(nameInput.closest(".form-field"), !(nameInput.value.trim()));
        if (!nameInput.value.trim()) ok3 = false;

        setInvalid(birthInput.closest(".form-field"), !(birthInput.value));
        if (!birthInput.value) ok3 = false;

        setInvalid(phoneInput.closest(".form-field"), !isPhMobile(phoneInput.value));
        if (!isPhMobile(phoneInput.value)) ok3 = false;

        setInvalid(emailInput.closest(".form-field"), !isEmail(emailInput.value));
        if (!isEmail(emailInput.value)) ok3 = false;

        setInvalid(reasonInput.closest(".form-field"), !(reasonInput.value.trim()));
        if (!reasonInput.value.trim()) ok3 = false;

        setInvalid(qs("#consent-field"), !(consent && consent.checked));
        if (!(consent && consent.checked)) ok3 = false;

        if (!ok3) {
          announce("Please correct the patient details.");
          var first = qs(".wizard-panel[data-step='3'] .form-field.is-invalid input, .wizard-panel[data-step='3'] .form-field.is-invalid textarea");
          if (first) first.focus();
          return false;
        }

        state.name = nameInput.value.trim();
        state.birthdate = birthInput.value;
        state.phone = phoneInput.value.trim();
        state.email = emailInput.value.trim();
        state.reason = reasonInput.value.trim();
        var typeEl = qs('input[name="patientType"]:checked');
        state.patientType = typeEl ? typeEl.value : "new";
        updateSummary();
        renderReview();
        return true;
      }

      return true;
    }

    function renderReview() {
      var box = qs("#review-summary");
      if (!box) return;
      box.innerHTML =
        "<dl>" +
        "<dt>Specialty</dt><dd>" +
        state.specialty +
        "</dd>" +
        "<dt>Doctor</dt><dd>" +
        state.doctorLabel +
        "</dd>" +
        "<dt>Date</dt><dd>" +
        (state.date
          ? state.date.toLocaleDateString("en-PH", { dateStyle: "full" })
          : "") +
        "</dd>" +
        "<dt>Time</dt><dd>" +
        state.time +
        "</dd>" +
        "<dt>Patient</dt><dd>" +
        state.name +
        " (" +
        state.patientType +
        ")</dd>" +
        "<dt>Contact</dt><dd>" +
        state.phone +
        " · " +
        state.email +
        "</dd>" +
        "<dt>Reason</dt><dd>" +
        state.reason +
        "</dd>" +
        "</dl>";
    }

    qsa("[data-next]", booking).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!validateStep(step)) return;
        showStep(step + 1);
      });
    });

    qsa("[data-back]", booking).forEach(function (btn) {
      btn.addEventListener("click", function () {
        showStep(Math.max(1, step - 1));
      });
    });

    var bookingForm = qs("#booking-form");
    if (bookingForm) {
      bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (step !== 4) return;
        var submitBtn = qs('button[type="submit"]', bookingForm);
        setButtonLoading(submitBtn, true, "Booking…");

        setTimeout(function () {
          var ref =
            "VIMH-" +
            String(Math.floor(100000 + Math.random() * 900000));
          var refEl = qs("#ref-number");
          if (refEl) refEl.textContent = ref;

          var cal = qs("#add-to-calendar");
          if (cal && state.date && state.time) {
            var y = state.date.getFullYear();
            var m = String(state.date.getMonth() + 1).padStart(2, "0");
            var d = String(state.date.getDate()).padStart(2, "0");
            var match = state.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            var hh = 9;
            var mm = 0;
            if (match) {
              hh = Number(match[1]);
              mm = Number(match[2]);
              if (/PM/i.test(match[3]) && hh < 12) hh += 12;
              if (/AM/i.test(match[3]) && hh === 12) hh = 0;
            }
            var start =
              y +
              m +
              d +
              "T" +
              String(hh).padStart(2, "0") +
              String(mm).padStart(2, "0") +
              "00";
            var endHH = hh;
            var endMM = mm + 30;
            if (endMM >= 60) {
              endMM -= 60;
              endHH += 1;
            }
            var end =
              y +
              m +
              d +
              "T" +
              String(endHH).padStart(2, "0") +
              String(endMM).padStart(2, "0") +
              "00";
            var ics =
              "data:text/calendar;charset=utf-8," +
              encodeURIComponent(
                "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:" +
                  start +
                  "\nDTEND:" +
                  end +
                  "\nSUMMARY:VIMH Appointment — " +
                  state.specialty +
                  "\nDESCRIPTION:Reference " +
                  ref +
                  " with " +
                  state.doctorLabel +
                  "\nLOCATION:VIMH Main Campus, Batangas City\nEND:VEVENT\nEND:VCALENDAR"
              );
            cal.setAttribute("href", ics);
            cal.setAttribute("download", ref + ".ics");
          }

          setButtonLoading(submitBtn, false);
          showStep("success");
          showToast("Appointment requested. Reference " + ref + ".", "success");
        }, 900);
      });
    }

    updateSummary();
    showStep(1);
  }

  /* ---------- Portal chart tooltips ---------- */
  var chartTooltip = qs("#chart-tooltip");
  if (chartTooltip) {
    function placeTooltip(point) {
      var card = point.closest(".chart-card");
      var rect = point.getBoundingClientRect();
      var cardRect = card.getBoundingClientRect();
      chartTooltip.textContent = point.getAttribute("data-value") + " · " + point.getAttribute("data-date");
      chartTooltip.style.left = rect.left - cardRect.left + rect.width / 2 + "px";
      chartTooltip.style.top = rect.top - cardRect.top + "px";
      chartTooltip.classList.add("is-visible");
    }

    function hideTooltip() {
      chartTooltip.classList.remove("is-visible");
    }

    qsa(".chart-point").forEach(function (point) {
      point.setAttribute("role", "button");
      point.setAttribute(
        "aria-label",
        point.getAttribute("data-value") + " on " + point.getAttribute("data-date")
      );
      point.addEventListener("mouseenter", function () {
        placeTooltip(point);
      });
      point.addEventListener("mouseleave", hideTooltip);
      point.addEventListener("focus", function () {
        placeTooltip(point);
      });
      point.addEventListener("blur", hideTooltip);
      point.addEventListener("click", function () {
        placeTooltip(point);
      });
    });
  }
})();
