document.addEventListener("DOMContentLoaded", function () {

  const DATA_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/pub?gid=0&single=true&output=csv";

  const tableBody   = document.querySelector("#campTable tbody");
  const searchBox   = document.getElementById("searchBox");
  const monthFilter = document.getElementById("monthFilter");
  const regionFilter= document.getElementById("regionFilter");
  const stateFilter = document.getElementById("stateFilter");
  const resultCount = document.getElementById("resultCount");
  const statCamps   = document.getElementById("statCamps");
  const statStates  = document.getElementById("statStates");
  const statRegions = document.getElementById("statRegions");
  const statReplay  = document.getElementById("statReplay");

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

  // ── MARKER ICON ──────────────────────────────────────────────
  const fieldIcon = L.divIcon({
    className: "",
    html: `<div class="field-marker"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });

  // ── REPLAY CHECK HELPER ───────────────────────────────────────
  function isReplayAvailable(val) {
    const v = (val || "").toString().trim().toUpperCase();
    return v === "TRUE" || v === "YES" || v === "Y" || v === "1";
  }

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
    const replayCount   = data.filter(c => isReplayAvailable(c.Replay)).length;

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

    if (data.l
