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
          bor
