/* Night Sky Society — events, calendar and booking logic.
   Bookings are stored in localStorage; no data leaves the browser. */

(() => {
  "use strict";

  // ---------- Club info ----------
  // Fill these in to replace the blank placeholders on the page. Empty strings stay blank.
  const SITE = {
    clubName: "",
    established: "",
    statMembers: "", statNights: "", statRating: "", statSky: "",
    aboutStory1: "", aboutStory2: "",
    featTelescopes: "", featFacilities: "", featAccess: "", featWeather: "",
    team1Name: "", team1Role: "", team2Name: "", team2Role: "",
    team3Name: "", team3Role: "", team4Name: "", team4Role: "",
    review1Text: "", review1Name: "", review2Text: "", review2Name: "", review3Text: "", review3Name: "",
    faqWeather: "", faqCancel: "", faqEquipment: "", faqClothing: "", faqKids: "", faqAccess: "",
    address: "", email: "", phone: "", hours: "",
    footerBlurb: "",
    // Membership prices in £ (numbers as strings, e.g. "9")
    priceStargazerMonthly: "", priceStargazerAnnual: "",
    priceObserverMonthly: "", priceObserverAnnual: "",
    priceAstronomerMonthly: "", priceAstronomerAnnual: "",
  };

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const money = (n) => "£" + n.toFixed(2);
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = (s, opts = { weekday: "short", day: "numeric", month: "short" }) =>
    parseISO(s).toLocaleDateString("en-GB", opts);
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Show a value, or a blank placeholder labelled with what belongs there.
  const fill = (value, label) => value ? escapeHTML(value) : `<span class="blank">${label}</span>`;
  const plain = (value, label) => value || label;
  const IMG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>`;
  const imgPlaceholder = (label, cls = "") => `<div class="img-ph ${cls}" role="img" aria-label="${label} placeholder">${IMG_ICON}<span>${label}</span></div>`;

  const storage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return isoDate(d); };

  // ---------- Event data ----------
  // Session dates are generated relative to today so the site always has upcoming events.
  const nextWeekdays = (weekday, count, startOffset = 1, step = 7) => {
    const out = [];
    const d = new Date(today);
    d.setDate(d.getDate() + startOffset);
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
    for (let i = 0; i < count; i++) { out.push(isoDate(d)); d.setDate(d.getDate() + step); }
    return out;
  };

  // Text fields left "" show as blanks. Prices, capacity and dates are sample values to edit.
  const EVENTS = [
    {
      id: "event-1", type: "stargazing", title: "", desc: "", time: "", duration: "", location: "", capacity: 24,
      art: ["#2b1b6b", "#8b7bff"], dates: nextWeekdays(6, 8),
      tickets: [{ id: "adult", label: "Adult", price: 22 }, { id: "concession", label: "Student / Senior", price: 16 }, { id: "child", label: "Child", price: 11 }],
    },
    {
      id: "event-2", type: "stargazing", title: "", desc: "", time: "", duration: "", location: "", capacity: 30,
      art: ["#5a2a0c", "#ffb36b"], dates: nextWeekdays(5, 8),
      tickets: [{ id: "adult", label: "Adult", price: 18 }, { id: "concession", label: "Student / Senior", price: 13 }, { id: "child", label: "Child", price: 9 }],
    },
    {
      id: "event-3", type: "workshop", title: "", desc: "", time: "", duration: "", location: "", capacity: 12,
      art: ["#06324a", "#5ec8ff"], dates: nextWeekdays(3, 6, 2, 14),
      tickets: [{ id: "adult", label: "Participant", price: 65 }, { id: "observer", label: "Observer", price: 30 }],
    },
    {
      id: "event-4", type: "workshop", title: "", desc: "", time: "", duration: "", location: "", capacity: 14,
      art: ["#13314a", "#7fd1c7"], dates: nextWeekdays(0, 5, 3, 14),
      tickets: [{ id: "adult", label: "Participant", price: 45 }],
    },
    {
      id: "event-5", type: "retreat", title: "", desc: "", time: "", duration: "", location: "", capacity: 16,
      art: ["#3a2a05", "#ffd27a"], dates: nextWeekdays(5, 3, 10, 28),
      tickets: [{ id: "shared", label: "Shared room (per person)", price: 289 }, { id: "private", label: "Private room (per person)", price: 379 }],
    },
    {
      id: "event-6", type: "kids", title: "", desc: "", time: "", duration: "", location: "", capacity: 40,
      art: ["#0b3a2a", "#4fe0a8"], dates: nextWeekdays(0, 8),
      tickets: [{ id: "adult", label: "Adult", price: 12 }, { id: "child", label: "Child", price: 8 }, { id: "family", label: "Family (2 + 2)", price: 34, seats: 4 }],
    },
    {
      id: "event-7", type: "stargazing", title: "", desc: "", time: "", duration: "", location: "", capacity: 20,
      art: ["#22263f", "#c9d0ff"], dates: nextWeekdays(4, 4, 5, 28),
      tickets: [{ id: "adult", label: "Adult", price: 14 }, { id: "child", label: "Child", price: 7 }],
    },
    {
      id: "event-8", type: "kids", title: "", desc: "", time: "", duration: "", location: "", capacity: 18,
      art: ["#3d0f2e", "#ff8ac2"], dates: nextWeekdays(6, 4, 4, 14),
      tickets: [{ id: "child", label: "Child", price: 15 }],
    },
  ];
  const eventById = (id) => EVENTS.find((e) => e.id === id);
  const fromPrice = (ev) => Math.min(...ev.tickets.map((t) => t.price));

  // Deterministic "already booked" count per session so availability looks realistic.
  const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const seededBooked = (ev, date) => Math.floor((hash(ev.id + date) % 1000) / 1000 * ev.capacity * 0.95);

  // ---------- Bookings store ----------
  let bookings = storage.get("nss-bookings", []).filter((b) => eventById(b.eventId));
  const saveBookings = () => { storage.set("nss-bookings", bookings); updateBookingBadge(); };

  const seatsFor = (ev, tickets) =>
    Object.entries(tickets).reduce((sum, [tid, q]) => sum + q * (ev.tickets.find((t) => t.id === tid)?.seats || 1), 0);

  const spacesLeft = (ev, date) => {
    const mine = bookings
      .filter((b) => b.eventId === ev.id && b.date === date && b.status === "confirmed")
      .reduce((s, b) => s + seatsFor(ev, b.tickets), 0);
    return Math.max(0, ev.capacity - seededBooked(ev, date) - mine);
  };
  const nextOpenDate = (ev) => ev.dates.find((d) => spacesLeft(ev, d) > 0);

  // ---------- Toast ----------
  let toastTimer;
  const toast = (msg, isError = false) => {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.toggle("error", isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  };

  // ---------- Starfield background ----------
  const initStarfield = () => {
    const canvas = $("#starfield");
    const ctx = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars = [];
    let shooting = null;

    const resize = () => {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      const count = Math.floor((innerWidth * innerHeight) / 3500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3 * devicePixelRatio + 0.2,
        a: Math.random(),
        s: Math.random() * 0.02 + 0.003,
      }));
    };

    const draw = () => {
      const g = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.1, 0, canvas.width * 0.7, canvas.height * 0.1, canvas.width);
      g.addColorStop(0, "#1a1645");
      g.addColorStop(0.5, "#0a0f26");
      g.addColorStop(1, "#05070f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const st of stars) {
        if (!reduce) st.a += st.s;
        ctx.globalAlpha = 0.35 + Math.abs(Math.sin(st.a)) * 0.65;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduce) {
        if (!shooting && Math.random() < 0.004) {
          shooting = { x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.4, life: 1 };
        }
        if (shooting) {
          const len = 120 * devicePixelRatio;
          const grad = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - len, shooting.y - len * 0.4);
          grad.addColorStop(0, `rgba(255,255,255,${shooting.life})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2 * devicePixelRatio;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(shooting.x - len, shooting.y - len * 0.4);
          ctx.stroke();
          shooting.x += 14 * devicePixelRatio;
          shooting.y += 5.6 * devicePixelRatio;
          shooting.life -= 0.025;
          if (shooting.life <= 0) shooting = null;
        }
        requestAnimationFrame(draw);
      }
    };

    addEventListener("resize", () => { resize(); if (reduce) draw(); });
    resize();
    draw();
  };

  // ---------- Navigation ----------
  const initNav = () => {
    const toggle = $(".nav-toggle");
    const links = $("#nav-links");
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });

    const header = $(".site-header");
    addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 20), { passive: true });

    // Highlight the nav link of the section in view.
    const navAnchors = $$(".nav-links a:not(.btn)");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navAnchors.forEach((a) => { const s = $(a.getAttribute("href")); if (s) observer.observe(s); });
  };

  const updateBookingBadge = () => {
    const n = bookings.filter((b) => b.status === "confirmed" && b.date >= isoDate(today)).length;
    const badge = $("#booking-count");
    badge.textContent = n;
    badge.classList.toggle("zero", n === 0);
  };

  // ---------- Tonight's sky ----------
  const initSky = () => {
    const synodic = 29.530588853;
    const knownNew = Date.UTC(2000, 0, 6, 18, 14);
    const age = (((Date.now() - knownNew) / 86400000) % synodic + synodic) % synodic;
    const p = age / synodic;
    const illum = Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100);
    const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    const name = names[Math.floor((p * 8 + 0.5) % 8)];

    $("#moon-phase").textContent = name;
    $("#moon-illum").textContent = `${illum}% illuminated · day ${Math.floor(age)} of cycle`;
    const shift = p < 0.5 ? -p * 200 : (1 - (p - 0.5) * 2) * 100;
    $("#moon-shadow").style.transform = `translateX(${shift}%)`;
    $("#sky-advice").textContent = illum < 35
      ? "Dark skies — excellent for galaxies and nebulae. A great night for a Deep-Sky Discovery session."
      : illum > 75
        ? "Bright moonlight — ideal for lunar and planetary viewing, or our Full Moon Night Walk."
        : "Moderate moonlight — good for planets, double stars and bright clusters.";

    const HIGHLIGHTS = {
      0: [["Jan 3–4", "Quadrantids meteor shower peak"], ["All month", "Orion high in the south by 9pm"], ["Evenings", "Winter Hexagon of bright stars"]],
      1: [["All month", "Beehive Cluster (M44) in Cancer"], ["Evenings", "Sirius at its best"], ["Late month", "Zodiacal light after dusk"]],
      2: [["Mar 20", "Spring equinox"], ["Evenings", "Leo rising in the east"], ["All month", "Galaxy season begins"]],
      3: [["Apr 22", "Lyrids meteor shower peak"], ["All month", "Virgo galaxy cluster"], ["Evenings", "Big Dipper overhead"]],
      4: [["May 6", "Eta Aquariids meteor shower"], ["All month", "Globular cluster M13 in Hercules"], ["Late evenings", "Arcturus shining bright"]],
      5: [["Jun 21", "Summer solstice — short nights"], ["All month", "Noctilucent clouds to the north"], ["Late night", "Summer Triangle rising"]],
      6: [["Late July", "Delta Aquariids begin"], ["All month", "Milky Way core low in the south"], ["Evenings", "Scorpius & Antares"]],
      7: [["Aug 12–13", "Perseids meteor shower peak"], ["All month", "Milky Way overhead"], ["Evenings", "Lagoon & Trifid Nebulae"]],
      8: [["Sep 22", "Autumn equinox"], ["All month", "Andromeda Galaxy rising"], ["Evenings", "Double Cluster in Perseus"]],
      9: [["Oct 21–22", "Orionids meteor shower peak"], ["All month", "Andromeda Galaxy high overhead"], ["Late night", "Pleiades climbing in the east"]],
      10: [["Nov 17–18", "Leonids meteor shower peak"], ["Early Nov", "Taurid fireballs"], ["All month", "Pleiades & Hyades in Taurus"]],
      11: [["Dec 13–14", "Geminids — year's best meteor shower"], ["Dec 21", "Winter solstice — longest night"], ["All month", "Orion Nebula returns"]],
    };
    $("#highlight-list").innerHTML = HIGHLIGHTS[today.getMonth()]
      .map(([when, what]) => `<li><strong>${when}</strong>${what}</li>`).join("");
  };

  // ---------- Events listing ----------
  const favs = new Set(storage.get("nss-favs", []));
  const filters = { type: "all", q: "", sort: "date", from: null, guests: 1 };

  const eventCard = (ev) => {
    const date = nextOpenDate(ev);
    const left = date ? spacesLeft(ev, date) : 0;
    const pct = date ? Math.round((1 - left / ev.capacity) * 100) : 100;
    const low = left > 0 && left <= 5;
    const tooFew = left < filters.guests;
    const [c1, c2] = ev.art;
    return `
      <article class="card event-card reveal" data-id="${ev.id}">
        <div class="event-art" style="background: linear-gradient(135deg, ${c1}99, #070b1a);">
          ${ev.image ? `<img src="${escapeHTML(ev.image)}" alt="" style="width:100%;height:100%;object-fit:cover">` : imgPlaceholder("Event photo · 800×300")}
          <span class="tag" style="color:${c2}">${ev.type === "kids" ? "Family" : ev.type}</span>
          <button class="fav ${favs.has(ev.id) ? "on" : ""}" data-fav="${ev.id}" aria-label="Save to favourites" aria-pressed="${favs.has(ev.id)}">${favs.has(ev.id) ? "♥" : "♡"}</button>
        </div>
        <div class="event-body">
          <h3>${fill(ev.title, "Event name")}</h3>
          <div class="event-meta">
            <span>📅 ${date ? fmtDate(date) : "Sold out"}</span>
            <span>🕗 ${fill(ev.time, "Start time")} · ${fill(ev.duration, "Duration")}</span>
            <span>📍 ${fill(ev.location, "Location")}</span>
          </div>
          <p>${ev.desc ? escapeHTML(ev.desc) : `<span class="blank block">Event description</span>`}</p>
          <div class="spaces">
            <div class="spaces-bar ${low ? "low" : ""}"><i style="width:${pct}%"></i></div>
            <div class="spaces-text">
              <span class="${low ? "low" : ""}">${left === 0 ? "Fully booked" : low ? `Only ${left} spaces left!` : `${left} of ${ev.capacity} spaces left`}</span>
            </div>
          </div>
          <div class="event-foot">
            <div class="event-price"><small>from</small> ${money(fromPrice(ev)).replace(".00", "")}</div>
            <button class="btn btn-primary btn-sm" data-book="${ev.id}" ${!date ? "disabled" : ""}>
              ${!date ? "Sold out" : tooFew && filters.guests > 1 ? "Limited spaces" : "Book now"}
            </button>
          </div>
        </div>
      </article>`;
  };

  const renderEvents = () => {
    const q = filters.q.trim().toLowerCase();
    let list = EVENTS.filter((ev) =>
      (filters.type === "all" || ev.type === filters.type) &&
      (!q || (ev.title + ev.desc + ev.location).toLowerCase().includes(q)) &&
      (!filters.from || ev.dates.some((d) => d >= filters.from)));

    const sorters = {
      date: (a, b) => (nextOpenDate(a) || "9999").localeCompare(nextOpenDate(b) || "9999"),
      "price-asc": (a, b) => fromPrice(a) - fromPrice(b),
      "price-desc": (a, b) => fromPrice(b) - fromPrice(a),
      spaces: (a, b) => spacesLeft(b, nextOpenDate(b) || "") - spacesLeft(a, nextOpenDate(a) || ""),
    };
    list.sort(sorters[filters.sort]);

    $("#event-grid").innerHTML = list.map(eventCard).join("");
    $("#events-empty").hidden = list.length > 0;
    observeReveals();
  };

  const initEvents = () => {
    $("#type-chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
      filters.type = chip.dataset.type;
      renderEvents();
    });
    $("#event-search").addEventListener("input", (e) => { filters.q = e.target.value; renderEvents(); });
    $("#event-sort").addEventListener("change", (e) => { filters.sort = e.target.value; renderEvents(); });

    $("#event-grid").addEventListener("click", (e) => {
      const fav = e.target.closest("[data-fav]");
      if (fav) {
        const id = fav.dataset.fav;
        favs.has(id) ? favs.delete(id) : favs.add(id);
        storage.set("nss-favs", [...favs]);
        toast(favs.has(id) ? "Saved to favourites" : "Removed from favourites");
        renderEvents();
        return;
      }
      const book = e.target.closest("[data-book]");
      if (book) openBooking(book.dataset.book);
    });

    // Hero quick search
    $("#qs-date").min = isoDate(today);
    $("#quick-search").addEventListener("submit", (e) => {
      e.preventDefault();
      const type = $("#qs-type").value;
      filters.type = type;
      filters.from = $("#qs-date").value || null;
      filters.guests = Math.max(1, Math.min(10, Number($("#qs-guests").value) || 1));
      $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.type === type));
      renderEvents();
      $("#events").scrollIntoView();
    });

    renderEvents();
  };

  // ---------- Calendar ----------
  const cal = { year: today.getFullYear(), month: today.getMonth(), selected: null };

  const eventsOn = (date) => EVENTS.filter((ev) => ev.dates.includes(date));

  const renderCalendar = () => {
    const first = new Date(cal.year, cal.month, 1);
    const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    $("#cal-title").textContent = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    let html = "<span class='cal-day empty'></span>".repeat(lead);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = isoDate(new Date(cal.year, cal.month, d));
      const evs = eventsOn(date);
      const past = date < isoDate(today);
      const cls = ["cal-day", past && "past", date === isoDate(today) && "today", evs.length && !past && "has-events", cal.selected === date && "selected"].filter(Boolean).join(" ");
      const dots = [...new Set(evs.map((e) => e.type))].map((t) => `<i class="dot ${t}"></i>`).join("");
      html += evs.length && !past
        ? `<button class="${cls}" data-date="${date}" aria-label="${fmtDate(date, { day: "numeric", month: "long" })}, ${evs.length} event${evs.length > 1 ? "s" : ""}">${d}<span class="cal-dots">${dots}</span></button>`
        : `<span class="${cls}">${d}<span class="cal-dots"></span></span>`;
    }
    $("#cal-days").innerHTML = html;

    const minMonth = today.getFullYear() * 12 + today.getMonth();
    $("#cal-prev").disabled = cal.year * 12 + cal.month <= minMonth;
  };

  const renderCalSide = () => {
    if (!cal.selected) return;
    $("#cal-side-title").textContent = fmtDate(cal.selected, { weekday: "long", day: "numeric", month: "long" });
    $("#cal-side-list").innerHTML = eventsOn(cal.selected).map((ev) => {
      const left = spacesLeft(ev, cal.selected);
      return `<div class="cal-side-item">
        <div>
          <h4><i class="dot ${ev.type}"></i> ${fill(ev.title, "Event name")}</h4>
          <p class="muted small">${fill(ev.time, "Start time")} · from ${money(fromPrice(ev))} · ${left ? left + " spaces" : "Fully booked"}</p>
        </div>
        <button class="btn btn-primary btn-sm" data-book="${ev.id}" data-date="${cal.selected}" ${left ? "" : "disabled"}>Book</button>
      </div>`;
    }).join("");
  };

  const initCalendar = () => {
    $("#cal-prev").addEventListener("click", () => { if (--cal.month < 0) { cal.month = 11; cal.year--; } renderCalendar(); });
    $("#cal-next").addEventListener("click", () => { if (++cal.month > 11) { cal.month = 0; cal.year++; } renderCalendar(); });
    $("#cal-days").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-date]");
      if (!btn) return;
      cal.selected = btn.dataset.date;
      renderCalendar();
      renderCalSide();
    });
    $("#cal-side-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-book]");
      if (btn) openBooking(btn.dataset.book, btn.dataset.date);
    });
    renderCalendar();
  };

  // ---------- Booking flow ----------
  const PROMOS = { STARS10: 0.10, MILKYWAY: 0.15 };
  const MEMBER_DISCOUNTS = { OBS: 0.15, AST: 0.25 };
  const bk = { event: null, date: null, step: 1, tickets: {}, addons: [], promo: null };
  const modal = $("#booking-modal");
  let lastFocus = null;

  const memberDiscount = () => {
    const m = $("#bk-member").value.trim().toUpperCase().match(/^(OBS|AST)-\d{4}$/);
    return m ? { code: m[1], rate: MEMBER_DISCOUNTS[m[1]] } : null;
  };

  const totalSeats = () => seatsFor(bk.event, bk.tickets);

  const calcTotals = () => {
    const lines = [];
    let subtotal = 0;
    bk.event.tickets.forEach((t) => {
      const q = bk.tickets[t.id] || 0;
      if (q) { lines.push([`${q} × ${t.label}`, q * t.price]); subtotal += q * t.price; }
    });
    bk.addons.forEach((a) => {
      const cost = a.perPerson ? a.price * totalSeats() : a.price;
      if (cost) { lines.push([a.name, cost]); subtotal += cost; }
    });
    const discounts = [];
    const member = memberDiscount();
    if (member) discounts.push([`Member discount (${member.rate * 100}%)`, -subtotal * member.rate]);
    if (bk.promo) {
      const after = subtotal + discounts.reduce((s, [, v]) => s + v, 0);
      discounts.push([`Promo ${bk.promo} (${PROMOS[bk.promo] * 100}%)`, -after * PROMOS[bk.promo]]);
    }
    const total = Math.max(0, subtotal + discounts.reduce((s, [, v]) => s + v, 0));
    return { lines, discounts, subtotal, total };
  };

  const renderSummary = () => {
    const { lines, discounts, total } = calcTotals();
    $("#bk-lines").innerHTML =
      `<div class="sum-line"><span>${fill(bk.event.title, "Event name")}</span></div>
       <div class="sum-line"><span>${fmtDate(bk.date, { weekday: "long", day: "numeric", month: "long" })}, ${fill(bk.event.time, "Start time")}</span></div>` +
      (lines.length ? lines.map(([l, v]) => `<div class="sum-line"><span>${l}</span><span>${money(v)}</span></div>`).join("")
        : `<div class="sum-line"><span>No tickets selected</span></div>`) +
      discounts.map(([l, v]) => `<div class="sum-line discount"><span>${l}</span><span>−${money(-v)}</span></div>`).join("");
    $("#bk-total").textContent = money(total);
  };

  const renderTickets = () => {
    const left = spacesLeft(bk.event, bk.date);
    const seats = totalSeats();
    $("#bk-avail").innerHTML = left
      ? `<span style="color:var(--${left <= 5 ? "danger" : "success"})">● ${left} space${left > 1 ? "s" : ""} available</span> on this date`
      : `<span style="color:var(--danger)">This date is fully booked.</span>`;
    $("#bk-tickets").innerHTML = bk.event.tickets.map((t) => {
      const q = bk.tickets[t.id] || 0;
      const canAdd = seats + (t.seats || 1) <= left;
      return `<div class="ticket-row">
        <div><strong>${t.label}</strong><span>${money(t.price)}${t.seats ? ` · admits ${t.seats}` : ""}</span></div>
        <div class="qty">
          <button type="button" data-qty="${t.id}" data-d="-1" aria-label="Remove one ${t.label}" ${q ? "" : "disabled"}>−</button>
          <output aria-live="polite">${q}</output>
          <button type="button" data-qty="${t.id}" data-d="1" aria-label="Add one ${t.label}" ${canAdd ? "" : "disabled"}>+</button>
        </div>
      </div>`;
    }).join("");
    renderSummary();
  };

  const setStep = (n) => {
    bk.step = n;
    $$(".step", modal).forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    $$("#bk-steps li").forEach((li, i) => {
      li.classList.toggle("active", i + 1 === n);
      li.classList.toggle("done", i + 1 < n);
    });
    $("#bk-back").hidden = n === 1 || n === 4;
    $("#bk-next").textContent = n === 3 ? "Confirm booking" : n === 4 ? "Done" : "Continue";
    $("#bk-summary").hidden = n === 4;
    $("#bk-error").textContent = "";
    $(".modal-panel").scrollTop = 0;
  };

  const openBooking = (eventId, date) => {
    const ev = eventById(eventId);
    const openDates = ev.dates.filter((d) => spacesLeft(ev, d) > 0);
    if (!openDates.length) return toast("Sorry, this event is fully booked.", true);

    Object.assign(bk, { event: ev, date: date && openDates.includes(date) ? date : openDates[0], tickets: {}, addons: [], promo: null });
    const left = spacesLeft(ev, bk.date);
    bk.tickets[ev.tickets[0].id] = Math.min(filters.guests, left);

    $("#booking-form").reset();
    $$(".invalid", modal).forEach((el) => el.classList.remove("invalid"));
    $("#bk-promo-msg").textContent = "";
    $("#bk-title").textContent = "Book your place";
    $("#bk-event").innerHTML = `${imgPlaceholder("Event photo", "icon-only")}
      <div><h3>${fill(ev.title, "Event name")}</h3><p>${fill(ev.time, "Start time")} · ${fill(ev.duration, "Duration")} · ${fill(ev.location, "Location")}</p></div>`;
    $("#bk-date").innerHTML = ev.dates.map((d) => {
      const l = spacesLeft(ev, d);
      return `<option value="${d}" ${l ? "" : "disabled"} ${d === bk.date ? "selected" : ""}>${fmtDate(d, { weekday: "long", day: "numeric", month: "long" })} — ${l ? l + " left" : "Sold out"}</option>`;
    }).join("");

    setStep(1);
    renderTickets();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $("#bk-date").focus();
  };

  const closeBooking = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    lastFocus?.focus();
  };

  const validateDetails = () => {
    let ok = true;
    const req = ["#bk-first", "#bk-last", "#bk-email", "#bk-phone"];
    req.forEach((sel) => {
      const el = $(sel);
      const valid = el.value.trim() && el.checkValidity();
      el.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    const member = $("#bk-member");
    const memberOk = !member.value.trim() || memberDiscount();
    member.classList.toggle("invalid", !memberOk);
    if (!ok) return "Please complete all required fields with valid details.";
    if (!memberOk) return "Membership numbers look like OBS-1234 or AST-1234.";
    if (!$("#bk-terms").checked) return "Please accept the booking terms to continue.";
    return null;
  };

  const makeRef = () => "NSS-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

  const confirmBooking = () => {
    if (totalSeats() > spacesLeft(bk.event, bk.date)) return "Sorry — those spaces were just taken. Please adjust your tickets.";
    const { total } = calcTotals();
    const booking = {
      ref: makeRef(),
      eventId: bk.event.id,
      date: bk.date,
      tickets: { ...bk.tickets },
      addons: bk.addons.map((a) => a.name),
      name: `${$("#bk-first").value.trim()} ${$("#bk-last").value.trim()}`,
      email: $("#bk-email").value.trim(),
      phone: $("#bk-phone").value.trim(),
      notes: $("#bk-notes").value.trim(),
      payment: $("input[name='pay']:checked").value,
      total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    bookings.unshift(booking);
    saveBookings();
    $("#bk-ref").textContent = booking.ref;
    $("#bk-confirm-email").textContent = booking.email;
    bk.lastBooking = booking;
    renderEvents();
    renderCalendar();
    renderCalSide();
    renderBookings();
    return null;
  };

  const initBooking = () => {
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeBooking(); });
    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") closeBooking();
      if (e.key === "Tab") { // keep focus inside the dialog
        const f = $$("button, input, select, textarea, a[href]", modal).filter((el) => !el.disabled && el.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    });

    $("#bk-date").addEventListener("change", (e) => {
      bk.date = e.target.value;
      const left = spacesLeft(bk.event, bk.date);
      // Trim tickets if the new date has fewer spaces.
      while (totalSeats() > left) {
        const id = Object.keys(bk.tickets).reverse().find((k) => bk.tickets[k] > 0);
        bk.tickets[id]--;
      }
      renderTickets();
    });

    $("#bk-tickets").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-qty]");
      if (!btn) return;
      const id = btn.dataset.qty;
      bk.tickets[id] = Math.max(0, (bk.tickets[id] || 0) + Number(btn.dataset.d));
      renderTickets();
    });

    $$(".addons input", modal).forEach((cb) => cb.addEventListener("change", () => {
      bk.addons = $$(".addons input:checked", modal).map((c) => ({
        name: c.dataset.addon, price: Number(c.dataset.price), perPerson: c.closest("label").textContent.includes("/ person"),
      }));
      renderSummary();
    }));

    $("#bk-member").addEventListener("input", renderSummary);

    $("#bk-apply-promo").addEventListener("click", () => {
      const code = $("#bk-promo").value.trim().toUpperCase();
      const msg = $("#bk-promo-msg");
      if (PROMOS[code]) {
        bk.promo = code;
        msg.style.color = "var(--success)";
        msg.textContent = `Code ${code} applied — ${PROMOS[code] * 100}% off.`;
      } else {
        bk.promo = null;
        msg.style.color = "var(--danger)";
        msg.textContent = code ? "That code isn't valid." : "Enter a code first.";
      }
      renderSummary();
    });

    $("#bk-back").addEventListener("click", () => setStep(bk.step - 1));

    $("#bk-next").addEventListener("click", () => {
      let err = null;
      if (bk.step === 1 && totalSeats() === 0) err = "Please choose at least one ticket.";
      if (bk.step === 2) err = validateDetails();
      if (bk.step === 3) err = confirmBooking();
      if (bk.step === 4) return closeBooking();
      if (err) { $("#bk-error").textContent = err; return; }
      setStep(bk.step + 1);
      if (bk.step === 4) toast("Booking confirmed! 🌌");
    });

    $("#bk-ics").addEventListener("click", () => downloadICS(bk.lastBooking));
    $("#bk-print").addEventListener("click", () => printTicket(bk.lastBooking));
  };

  // ---------- Calendar export & printing ----------
  const downloadICS = (b) => {
    const ev = eventById(b.eventId);
    const [h, m] = (ev.time.match(/\d{2}:\d{2}/) || ["20:00"])[0].split(":");
    const dt = b.date.replace(/-/g, "") + `T${h}${m}00`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stargazing Club//Bookings//EN", "BEGIN:VEVENT",
      `UID:${b.ref}@stargazing-bookings`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${dt}`, `SUMMARY:${plain(ev.title, "Stargazing event")}`, `LOCATION:${ev.location}`,
      `DESCRIPTION:Booking ref ${b.ref}. Dress warmly and bring a red torch!`, "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${b.ref}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const ticketSummary = (b) => {
    const ev = eventById(b.eventId);
    return ev.tickets.filter((t) => b.tickets[t.id]).map((t) => `${b.tickets[t.id]} × ${t.label}`).join(", ");
  };

  const printTicket = (b) => {
    const ev = eventById(b.eventId);
    const w = open("", "_blank", "width=600,height=700");
    if (!w) return toast("Please allow pop-ups to print your ticket.", true);
    w.document.write(`<!doctype html><title>Ticket ${b.ref}</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}.t{border:2px dashed #444;border-radius:12px;padding:24px}
      h1{margin:0 0 4px}.ref{font-size:28px;letter-spacing:.1em;font-weight:700;margin:16px 0}td{padding:4px 12px 4px 0;vertical-align:top}</style>
      <div class="t"><p>${escapeHTML(plain(SITE.clubName, "______________")).toUpperCase()} · ADMIT</p><h1>${escapeHTML(plain(ev.title, "______________"))}</h1>
      <div class="ref">${b.ref}</div><table>
      <tr><td><b>Date</b></td><td>${fmtDate(b.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${escapeHTML(plain(ev.time, "______"))}</td></tr>
      <tr><td><b>Location</b></td><td>${escapeHTML(plain(ev.location, "______________"))}</td></tr>
      <tr><td><b>Guest</b></td><td>${escapeHTML(b.name)}</td></tr>
      <tr><td><b>Tickets</b></td><td>${ticketSummary(b)}</td></tr>
      ${b.addons.length ? `<tr><td><b>Add-ons</b></td><td>${b.addons.map(escapeHTML).join(", ")}</td></tr>` : ""}
      <tr><td><b>Total</b></td><td>${money(b.total)} (${escapeHTML(b.payment)})</td></tr></table>
      <p>Please arrive 15 minutes early. Dress warmly!</p></div>`);
    w.document.close();
    w.focus();
    w.print();
  };

  // ---------- My bookings ----------
  let lookupFilter = null;

  const renderBookings = () => {
    const list = lookupFilter ? bookings.filter((b) => b.ref === lookupFilter) : bookings;
    const el = $("#bookings-list");
    if (!list.length) {
      el.innerHTML = `<div class="card empty-bookings">
        <h3>${lookupFilter ? "No booking found" : "No bookings yet"}</h3>
        <p class="muted">${lookupFilter ? `We couldn't find ${escapeHTML(lookupFilter)} on this device.` : "Your upcoming stargazing adventures will appear here."}</p>
        ${lookupFilter ? `<button class="btn btn-ghost" data-clear-lookup>Show all bookings</button>` : `<a href="#events" class="btn btn-primary">Browse events</a>`}
      </div>`;
      return;
    }
    const todayISO = isoDate(today);
    el.innerHTML = list.map((b) => {
      const ev = eventById(b.eventId);
      if (!ev) return "";
      const d = parseISO(b.date);
      const cancelled = b.status === "cancelled";
      const past = b.date < todayISO;
      const hoursUntil = (d - Date.now()) / 3600000;
      const canCancel = !cancelled && !past && hoursUntil > 48;
      return `<article class="card booking-item ${cancelled ? "is-cancelled" : ""}">
        <div class="booking-date"><strong>${d.getDate()}</strong><span>${d.toLocaleDateString("en-GB", { month: "short" })}</span></div>
        <div>
          <h3>${fill(ev.title, "Event name")} <span class="status ${b.status}">${past && !cancelled ? "Completed" : b.status}</span></h3>
          <p>${b.ref} · ${fmtDate(b.date, { weekday: "long" })}, ${fill(ev.time, "Start time")} · ${ticketSummary(b)}</p>
          <p>${money(b.total)} · ${escapeHTML(b.payment)}${b.addons.length ? " · " + b.addons.map(escapeHTML).join(", ") : ""}</p>
        </div>
        <div class="booking-actions">
          ${!cancelled ? `<button class="btn btn-ghost btn-sm" data-ics="${b.ref}">Calendar</button>
          <button class="btn btn-ghost btn-sm" data-print="${b.ref}">Print</button>` : ""}
          ${canCancel ? `<button class="btn btn-ghost btn-sm btn-danger" data-cancel="${b.ref}">Cancel</button>` : ""}
          ${cancelled || past ? `<button class="btn btn-ghost btn-sm" data-rebook="${b.eventId}">Book again</button>` : ""}
        </div>
      </article>`;
    }).join("");
  };

  const initBookings = () => {
    $("#bookings-list").addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const find = (ref) => bookings.find((b) => b.ref === ref);
      if (t.dataset.ics) downloadICS(find(t.dataset.ics));
      if (t.dataset.print) printTicket(find(t.dataset.print));
      if (t.dataset.rebook) openBooking(t.dataset.rebook);
      if ("clearLookup" in t.dataset) { lookupFilter = null; $("#lookup-ref").value = ""; renderBookings(); }
      if (t.dataset.cancel) {
        const b = find(t.dataset.cancel);
        if (!confirm(`Cancel booking ${b.ref}? You'll receive a full refund of ${money(b.total)}.`)) return;
        b.status = "cancelled";
        saveBookings();
        renderBookings();
        renderEvents();
        renderCalSide();
        toast(`Booking ${b.ref} cancelled.`);
      }
    });
    $("#lookup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      lookupFilter = $("#lookup-ref").value.trim().toUpperCase() || null;
      renderBookings();
    });
    renderBookings();
    updateBookingBadge();
  };

  // ---------- Membership, contact, newsletter ----------
  const initMisc = () => {
    const renderPrices = () => {
      const annual = $("#billing-annual").checked;
      $$(".plan .amt").forEach((el) => {
        const price = SITE[annual ? el.dataset.annual : el.dataset.monthly];
        el.innerHTML = price ? "£" + escapeHTML(price) : `<span class="blank">£ Price</span>`;
      });
      $$(".plan .per").forEach((el) => (el.textContent = annual ? "/yr" : "/mo"));
    };
    $("#billing-annual").addEventListener("change", renderPrices);
    renderPrices();
    $$("[data-plan]").forEach((btn) => btn.addEventListener("click", () => {
      const form = $("#contact-form");
      form.topic.value = "General question";
      form.message.value = `Hi! I'd like to join as a ${btn.dataset.plan} member${$("#billing-annual").checked ? " (annual billing)" : ""}.`;
      $("#contact").scrollIntoView();
      toast(`Tell us a little about yourself to join ${btn.dataset.plan}.`);
    }));

    $("#contact-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      let ok = true;
      $$("[required]", form).forEach((el) => {
        const valid = el.value.trim() && el.checkValidity();
        el.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      const note = $("#contact-note");
      if (!ok) { note.style.color = "var(--danger)"; note.textContent = "Please fill in all fields with a valid email."; return; }
      note.style.color = "var(--success)";
      note.textContent = `Thanks, ${form.name.value.trim()}! We'll get back to you soon.`;
      form.reset();
    });

    $("#newsletter-form").addEventListener("submit", (e) => {
      e.preventDefault();
      e.target.reset();
      toast("You're subscribed to the monthly sky newsletter ✨");
    });

    $("#year").textContent = today.getFullYear();
  };

  // ---------- Scroll reveal ----------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.1 });
  function observeReveals() { $$(".reveal:not(.in)").forEach((el) => revealObserver.observe(el)); }

  // ---------- Placeholders ----------
  const applySiteInfo = () => {
    $$("[data-field]").forEach((el) => {
      const value = SITE[el.dataset.field];
      if (!value) return;
      el.textContent = value;
      el.classList.remove("blank", "block");
    });
    document.title = `${SITE.clubName || "Stargazing Club"} | Stargazing Events & Bookings`;
    $$(".img-ph[data-label]").forEach((el) => {
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", `${el.dataset.label} placeholder`);
      el.innerHTML = `${IMG_ICON}<span>${el.dataset.label}</span>`;
    });
  };

  // ---------- Init ----------
  applySiteInfo();
  $$(".section-head, .card:not(.event-card), .faq details").forEach((el) => el.classList.add("reveal"));
  initStarfield();
  initNav();
  initSky();
  initEvents();
  initCalendar();
  initBooking();
  initBookings();
  initMisc();
  observeReveals();
})();
