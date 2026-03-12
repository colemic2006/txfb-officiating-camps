
document.addEventListener("DOMContentLoaded", () => {

const DATA_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/gviz/tq?tqx=out:csv";

let map = L.map("map").setView([39.5,-98.35],4);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{maxZoom:18}
).addTo(map);

let cluster = L.markerClusterGroup();
map.addLayer(cluster);

const tableBody = document.querySelector("#campTable tbody");

const searchBox = document.getElementById("searchBox");
const monthFilter = document.getElementById("monthFilter");
const regionFilter = document.getElementById("regionFilter");
const stateFilter = document.getElementById("stateFilter");

let camps = [];

Papa.parse(DATA_URL,{
download:true,
header:true,
complete:(results)=>{

camps = results.data.filter(row => row.Active === "TRUE");

populateFilters();
render(camps);

},
error:(err)=>console.error("CSV ERROR:",err)
});

function render(data){

renderTable(data);
renderMarkers(data);

}

function renderTable(data){

tableBody.innerHTML="";

data.forEach(camp=>{

const row=document.createElement("tr");

row.innerHTML=`
<td>${camp.Camp}</td>
<td>${camp.Location}</td>
<td>${camp.State}</td>
<td>${camp.Region}</td>
<td>${camp.Date}</td>
<td>${camp.Replay}</td>
<td><a href="${camp.Link}" target="_blank">Visit</a></td>
`;

tableBody.appendChild(row);

});

}

function renderMarkers(data){

cluster.clearLayers();

data.forEach(camp=>{

const lat=parseFloat(camp.Latitude);
const lon=parseFloat(camp.Longitude);

if(!lat || !lon) return;

const marker=L.marker([lat,lon])
.bindPopup(`<b>${camp.Camp}</b><br>${camp.Location}`);

cluster.addLayer(marker);

});

}

function populateFilters(){

const regions=[...new Set(camps.map(c=>c.Region))].sort();
const states=[...new Set(camps.map(c=>c.State))].sort();

regions.forEach(r=>{
let opt=document.createElement("option");
opt.value=r;
opt.textContent=r;
regionFilter.appendChild(opt);
});

states.forEach(s=>{
let opt=document.createElement("option");
opt.value=s;
opt.textContent=s;
stateFilter.appendChild(opt);
});

}

function applyFilters(){

const text=searchBox.value.toLowerCase();
const month=monthFilter.value;
const region=regionFilter.value;
const state=stateFilter.value;

const filtered=camps.filter(camp=>{

const textMatch =
camp.Camp.toLowerCase().includes(text) ||
camp.Location.toLowerCase().includes(text);

const monthMatch = !month || camp.Date.includes(month);
const regionMatch = !region || camp.Region === region;
const stateMatch = !state || camp.State === state;

return textMatch && monthMatch && regionMatch && stateMatch;

});

render(filtered);

}

searchBox.addEventListener("input",applyFilters);
monthFilter.addEventListener("change",applyFilters);
regionFilter.addEventListener("change",applyFilters);
stateFilter.addEventListener("change",applyFilters);

document.getElementById("lastUpdated").textContent =
"Last updated " + new Date().toLocaleDateString();

});
