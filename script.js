document.addEventListener("DOMContentLoaded", function () {

const DATA_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/gviz/tq?tqx=out:csv";

const tableBody = document.querySelector("#campTable tbody");

const searchBox = document.getElementById("searchBox");
const monthFilter = document.getElementById("monthFilter");
const regionFilter = document.getElementById("regionFilter");
const stateFilter = document.getElementById("stateFilter");

let camps = [];

const map = L.map("map").setView([39.5, -98.35], 4);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{ maxZoom: 18 }
).addTo(map);

const cluster = L.markerClusterGroup();
map.addLayer(cluster);

Papa.parse(DATA_URL, {
download: true,
header: true,
skipEmptyLines: true,

complete: function(results) {

camps = results.data.filter(row =>
row.Active &&
row.Active.toString().trim().toUpperCase() === "TRUE"
);

populateFilters();
render(camps);

},

error: function(err) {
console.error("CSV load error:", err);
}

});


function populateFilters() {

const regions = [...new Set(camps.map(c => c.Region).filter(Boolean))].sort();
const states = [...new Set(camps.map(c => c.State).filter(Boolean))].sort();

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


function render(data) {
renderTable(data);
renderMarkers(data);
}


function renderTable(data) {

tableBody.innerHTML = "";

data.forEach(camp => {

const row = document.createElement("tr");

row.innerHTML = `
<td>${camp.Camp || ""}</td>
<td>${camp.Location || ""}</td>
<td>${camp.State || ""}</td>
<td>${camp.Region || ""}</td>
<td>${camp.Date || ""}</td>
<td>${camp.Replay || ""}</td>
<td><a href="${camp.Link || "#"}" target="_blank">Visit</a></td>
`;

tableBody.appendChild(row);

});

}


function renderMarkers(data) {

cluster.clearLayers();

let bounds = [];

data.forEach(camp => {

const lat = parseFloat(camp.Latitude);
const lon = parseFloat(camp.Longitude);

if (isNaN(lat) || isNaN(lon)) return;

const marker = L.marker([lat, lon]);

marker.bindPopup(`<b>${camp.Camp}</b><br>${camp.Location}`);

cluster.addLayer(marker);

bounds.push([lat, lon]);

});

if (bounds.length) {
map.fitBounds(bounds, { padding: [40, 40] });
}

}


function applyFilters() {

const text = searchBox.value.toLowerCase();
const month = monthFilter.value;
const region = regionFilter.value;
const state = stateFilter.value;

const filtered = camps.filter(camp => {

const textMatch =
(camp.Camp || "").toLowerCase().includes(text) ||
(camp.Location || "").toLowerCase().includes(text);

const monthMatch =
!month || (camp.Date || "").includes(month);

const regionMatch =
!region || camp.Region === region;

const stateMatch =
!state || camp.State === state;

return textMatch && monthMatch && regionMatch && stateMatch;

});

render(filtered);

}

searchBox.addEventListener("input", applyFilters);
monthFilter.addEventListener("change", applyFilters);
regionFilter.addEventListener("change", applyFilters);
stateFilter.addEventListener("change", applyFilters);

document.getElementById("lastUpdated").textContent =
"Last updated " + new Date().toLocaleDateString();

});
