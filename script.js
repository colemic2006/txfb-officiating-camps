document.addEventListener("DOMContentLoaded", function () {

  const DATA_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/pub?gid=0&single=true&output=csv";

  const FORMSPREE_URL = "https://formspree.io/f/xykbpbdo";

  const tableBody    = document.querySelector("#campTable tbody");
  const searchBox    = document.getElementById("searchBox");
  const monthFilter  = document.getElementById("monthFilter");
  const regionFilter = document.getElementById("regionFilter");
  const stateFilter  = document.getElementById("stateFilter");
  const resultCount  = document.getElementById("resultCount");
  const statCamps    = document.getElementById("statCamps");
  const statStates   = document.getElementById("statStates");
  const statRegions  = document.getElementById("statRegions");
  const statReplay   = document.getElementById("statReplay");

  let camps = [];

  // ── MAP SETUP ────────────────────────────────────────────────
  const map = L.map("map").setView([39.5, -98.35], 4);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18
    }
  ).addTo(map);

  const cluster = L.markerClusterGroup({
    iconCreateFunction: function (c) {
      const count = c.getChildCount();
      return L.divIcon({
        html: `<div style="
          background: #2d7a3a;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 13px;
          width: 34px; height: 34px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${count}</div>`,
        className: "",
        iconSize: [34, 34]
      });
    }
  });
  map.addLayer(cluster);

  const fieldIcon = L.divIcon({
    className: "",
    html: `<div class="field-marker"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });

  // ── LOAD DATA ────────────────────────────────────────────────
  Papa.parse(DATA_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function (results) {
      camps = results.data.filter(row =>
        row.Active &&
        row.Active.toString().trim().toUpperCase() === "TRUE"
      );

      updateStats(camps);
      populateFilters();
      render(camps);
    },

    error: function (err) {
      console.error("CSV load error:", err);
    }
  });

  // ── STATS BAR ────────────────────────────────────────────────
  function updateStats(data) {
    const totalCamps    = data.length;
    const uniqueStates  = new Set(data.map(c => c.State).filter(Boolean)).size;
    const uniqueRegions = new Set(data.map(c => c.Region).filter(Boolean)).size;
    const replayCount   = data.filter(c => {
      const v = (c.Replay || "").toString().trim().toUpperCase();
      return v === "TRUE" || v === "YES" || v === "Y" || v === "1";
    }).length;

    animateCounter(statCamps,   totalCamps);
    animateCounter(statStates,  uniqueStates);
    animateCounter(statRegions, uniqueRegions);
    animateCounter(statReplay,  replayCount);
  }

  function animateCounter(el, target) {
    let start = 0;
    const duration = 700;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  // ── FILTERS ──────────────────────────────────────────────────
  function populateFilters() {
    const regions = [...new Set(camps.map(c => c.Region).filter(Boolean))].sort();
    const states  = [...new Set(camps.map(c => c.State).filter(Boolean))].sort();

    regions.forEach(region => {
      const opt = document.createElement("option");
      opt.value = region;
      opt.textContent = region;
      regionFilter.appendChild(opt);
    });

    states.forEach(state => {
      const opt = document.createElement("option");
      opt.value = state;
      opt.textContent = state;
      stateFilter.appendChild(opt);
    });
  }

  // ── RENDER ───────────────────────────────────────────────────
  function render(data) {
    renderTable(data);
    renderMarkers(data);
    resultCount.textContent = `${data.length} result${data.length !== 1 ? "s" : ""}`;
  }

  function renderTable(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">No camps match your filters.</div>
        </td></tr>`;
      return;
    }

    data.forEach(camp => {
      const row = document.createElement("tr");

      const replayVal = (camp.Replay || "").toString().trim().toUpperCase();
      const isReplay  = replayVal === "TRUE" || replayVal === "YES" || replayVal === "Y" || replayVal === "1";
      const replayBadge = isReplay
        ? `<span class="badge badge-replay-yes">✓ Yes</span>`
        : `<span class="badge badge-replay-no">No</span>`;

      row.innerHTML = `
        <td>${camp.Camp || ""}</td>
        <td>${camp.Location || ""}</td>
        <td><span class="badge badge-state">${camp.State || ""}</span></td>
        <td><span class="badge badge-region">${camp.Region || ""}</span></td>
        <td>${camp.Date || ""}</td>
        <td>${replayBadge}</td>
        <td><a href="${camp.Link || "#"}" target="_blank">Details ↗</a></td>
      `;

      tableBody.appendChild(row);
    });
  }

  function renderMarkers(data) {
    cluster.clearLayers();

    const bounds = [];

    data.forEach(camp => {
      const lat = parseFloat(camp.Latitude);
      const lon = parseFloat(camp.Longitude);
      if (isNaN(lat) || isNaN(lon)) return;

      const marker = L.marker([lat, lon], { icon: fieldIcon });

      marker.bindPopup(`
        <b>${camp.Camp}</b><br>
        ${camp.Location}${camp.State ? ", " + camp.State : ""}
        ${camp.Date ? "<br>" + camp.Date : ""}
      `);

      cluster.addLayer(marker);
      bounds.push([lat, lon]);
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  // ── FILTER LOGIC ─────────────────────────────────────────────
  function applyFilters() {
    const text   = searchBox.value.toLowerCase();
    const month  = monthFilter.value;
    const region = regionFilter.value;
    const state  = stateFilter.value;

    const filtered = camps.filter(camp => {
      const textMatch =
        (camp.Camp     || "").toLowerCase().includes(text) ||
        (camp.Location || "").toLowerCase().includes(text);

      const monthMatch  = !month  || (camp.Date   || "").includes(month);
      const regionMatch = !region || camp.Region === region;
      const stateMatch  = !state  || camp.State  === state;

      return textMatch && monthMatch && regionMatch && stateMatch;
    });

    render(filtered);
  }

  searchBox.addEventListener("input",     applyFilters);
  monthFilter.addEventListener("change",  applyFilters);
  regionFilter.addEventListener("change", applyFilters);
  stateFilter.addEventListener("change",  applyFilters);

  // ── TIMESTAMP ────────────────────────────────────────────────
  document.getElementById("lastUpdated").textContent =
    "Updated " + new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });

  // ── MODAL ────────────────────────────────────────────────────
  const modal        = document.getElementById("submitModal");
  const openBtn      = document.getElementById("openSubmitModal");
  const closeBtn     = document.getElementById("closeSubmitModal");
  const cancelBtn    = document.getElementById("cancelSubmit");
  const successClose = document.getElementById("successClose");
  const form         = document.getElementById("submitCampForm");
  const submitBtn    = document.getElementById("submitBtn");
  const formSuccess  = document.getElementById("formSuccess");
  const formError    = document.getElementById("formError");

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function resetModal() {
    form.reset();
    form.hidden = false;
    formSuccess.hidden = true;
    formError.hidden = true;
    submitBtn.classList.remove("is-loading");
    submitBtn.disabled = false;
  }

  openBtn.addEventListener("click", () => {
    resetModal();
    openModal();
  });

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  successClose.addEventListener("click", closeModal);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // ── FORM SUBMIT ──────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    formError.hidden = true;
    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;

    const data = new FormData(form);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        form.hidden = true;
        formSuccess.hidden = false;
      } else {
        throw new Error("Non-OK response");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      formError.hidden = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });

});
