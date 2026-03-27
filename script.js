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
    iconAnchor: [7, 7]
