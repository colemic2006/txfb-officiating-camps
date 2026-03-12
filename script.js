const DATA_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/gviz/tq?tqx=out:csv";

let map;
let markers = [];

async function loadCamps(){

const response = await fetch(DATA_URL);
const csv = await response.text();

const camps = parseCSV(csv);

initMap();
populateRegions(camps);
renderTable(camps);
addMarkers(camps);
setupFilters(camps);

document.getElementById("lastUpdated").textContent =
"Last updated " + new Date().toLocaleDateString();

}

function parseCSV(csv){

const lines = csv.trim().split("\n");
const headers = lines[0].split(",");

const getIndex = name => headers.indexOf(name);

const iCamp = getIndex("Camp");
const iLocation = getIndex("Location");
const iRegion = getIndex("Region");
const iDate = getIndex("Date");
const iReplay = getIndex("Replay");
const iLink = getIndex("Link");
const iActive = getIndex("Active");
const iLat = getIndex("Latitude");
const iLon = getIndex("Longitude");

let camps = [];

for(let i=1;i<lines.length;i++){

const row = lines[i].split(",");

if(row[iActive]?.trim().toUpperCase() !== "TRUE") continue;

const lat = parseFloat(row[iLat]);
const lon = parseFloat(row[iLon]);

if(isNaN(lat) || isNaN(lon)) continue;

camps.push({

name: row[iCamp],
location: row[iLocation],
region: row[iRegion],
date: row[iDate],
replay: row[iReplay],
link: row[iLink],
lat: lat,
lon: lon

});

}

return camps;

}

function initMap(){

map = L.map("map").setView([39.5,-98.35],4);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{ maxZoom:18 }
).addTo(map);

}

function addMarkers(camps){

markers.forEach(m => map.removeLayer(m));
markers = [];

camps.forEach(camp => {

const marker = L.marker([camp.lat, camp.lon]).addTo(map);

marker.bindPopup(
"<b>"+camp.name+"</b><br>"+
camp.location+"<br>"+
camp.date+"<br>"+
"<a href='"+camp.link+"' target='_blank'>Visit Camp</a>"
);

markers.push(marker);

});

}

function renderTable(camps){

const table = document.querySelector("#campTable tbody");
table.innerHTML = "";

camps.forEach(camp => {

const row = document.createElement("tr");

row.innerHTML = `
<td>${camp.name}</td>
<td>${camp.location}</td>
<td>${camp.region}</td>
<td>${camp.date}</td>
<td>${camp.replay}</td>
<td><a href="${camp.link}" target="_blank">Visit</a></td>
`;

table.appendChild(row);

});

}

function populateRegions(camps){

const regionFilter = document.getElementById("regionFilter");

const regions = [...new Set(camps.map(c => c.region))];

regions.sort();

regions.forEach(region => {

const option = document.createElement("option");
option.value = region;
option.textContent = region;

regionFilter.appendChild(option);

});

}

function setupFilters(allCamps){

const search = document.getElementById("searchBox");
const month = document.getElementById("monthFilter");
const region = document.getElementById("regionFilter");

function filter(){

const text = search.value.toLowerCase();

const filtered = allCamps.filter(camp => {

const textMatch =
camp.name.toLowerCase().includes(text) ||
camp.location.toLowerCase().includes(text);

const monthMatch =
month.value === "" ||
camp.date.includes(month.value);

const regionMatch =
region.value === "" ||
camp.region === region.value;

return textMatch && monthMatch && regionMatch;

});

renderTable(filtered);
addMarkers(filtered);

}

search.addEventListener("input", filter);
month.addEventListener("change", filter);
region.addEventListener("change", filter);

}

loadCamps();
