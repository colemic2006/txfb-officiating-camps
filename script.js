document.addEventListener("DOMContentLoaded", function () {

  const DATA_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/pub?gid=0&single=true&output=csv";

  const tableBody = document.querySelector("#campTable tbody");
  const searchBox = document.getElementById("searchBox");
  const monthFilter = document.getElementById("monthFilter");
  const regionFilter = document.getElementById("regionFilter");
  const stateFilter = document.getElementById("stateFilter");
  const resultCount = document.getElementById("resultCount");

  // Stats elements
  const statCamps   = document.getElementById("statCamps");
  const statStates  = document.getElementById("statStates");
  const statRegions = document.getElementById("statRegions");
  const statReplay  = document.getElementById("statReplay");

  let camps = [];

  // ── MAP SETUP (dark CartoDB tiles) ──────────────────────────
  const map = L.map("map").setView([39.5, -98.35], 4);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19
    }
  ).addTo(map);

  const cluster = L.markerClusterGroup({
    iconCreateFunction: function (c) {
      const count = c.getChildCount();
      return L.divIcon({
        html: `<div style="
          background: rgba(0,255,136,0.85);
          color: #050a0e;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 12px;
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 0 14px #00ff8880;
        ">${count}</div>`,
        className: "",
        iconSize: [36, 36]
      });
    }
  });
  map.addLayer(cluster);

  // ── GLOWING GREEN MARKER ICON ────────────────────────────────
  const glowIcon = L.divIcon({
    className: "",
    html: `<div class="glow-marker"></div>`,
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

      updateGlobalStats(camps);
      populateFilters();
      render(camps);
    },

    error: function (err) {
      console.error("CSV load error:", err);
    }
  });

  // ── GLOBAL STATS (always based on full dataset) ──────────────
  function updateGlobalStats(data) {
    const totalCamps   = data.length;
    const uniqueStates = new Set(data.map(c => c.State).filter(Boolean)).size;
    const uniqueRegions= new Set(data.map(c => c.Region).filter(Boolean)).size;
    const replayCount  = data.filter(c =>
      c.Replay && c.Replay.toString().trim().toUpperCase() === "TRUE"
    ).length;

    animateCounter(statCamps,   totalCamps);
    animateCounter(statStates,  uniqueStates);
    animateCounter(statRegions, uniqueRegions);
    animateCounter(statReplay,  replayCount);
  }

  function animateCounter(el, target) {
    let start = 0;
    const duration = 600;
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
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionFilter.appendChild(option);
    });

    states.forEach(state => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateFilter.appendChild(option);
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
      const isReplay  = replayVal === "TRUE";
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
        <td><a href="${camp.Link || "#"}" target="_blank">Visit ↗</a></td>
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

      const marker = L.marker([lat, lon], { icon: glowIcon });

      marker.bindPopup(`
        <b>${camp.Camp}</b><br>
        ${camp.Location}${camp.State ? ", " + camp.State : ""}
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

  searchBox.addEventListener("input",  applyFilters);
  monthFilter.addEventListener("change", applyFilters);
  regionFilter.addEventListener("change", applyFilters);
  stateFilter.addEventListener("change", applyFilters);

  // ── TIMESTAMP ────────────────────────────────────────────────
  document.getElementById("lastUpdated").textContent =
    "Updated " + new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });

});
