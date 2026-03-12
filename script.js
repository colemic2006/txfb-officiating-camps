const DATA_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTAg8dG8C3NattrTr95K_v4A7bQ5K9MazH9o59V0xZyLNnkoUv7y8FjvWmjA1T-yoh6wgCI_Ts9Etwp/gviz/tq?tqx=out:csv";

let map;
let markerCluster;
let allCamps=[];

async function loadCamps(){

const response=await fetch(DATA_URL);
const csv=await response.text();

allCamps=parseCSV(csv);

initMap();
populateFilters(allCamps);
render(allCamps);

setupFilters();
setupViewToggle();

document.getElementById("lastUpdated").textContent=
"Last updated "+new Date().toLocaleDateString();

}

function parseCSV(csv){

const lines=csv.trim().split("\n");
const headers=parseRow(lines[0]);

const idx=name=>headers.indexOf(name);

const iCamp=idx("Camp");
const iLocation=idx("Location");
const iState=idx("State");
const iRegion=idx("Region");
const iDate=idx("Date");
const iReplay=idx("Replay");
const iLink=idx("Link");
const iActive=idx("Active");
const iLat=idx("Latitude");
const iLon=idx("Longitude");

let camps=[];

for(let i=1;i<lines.length;i++){

const row=parseRow(lines[i]);

if(!row) continue;
if(row[iActive]?.toUpperCase()!=="TRUE") continue;

const lat=parseFloat(row[iLat]);
const lon=parseFloat(row[iLon]);

camps.push({
name:row[iCamp],
location:row[iLocation],
state:row[iState],
region:row[iRegion],
date:row[iDate],
replay:row[iReplay],
link:row[iLink],
lat,
lon
});

}

return camps;

}

function parseRow(row){

const regex=/(".*?"|[^",]+)(?=\s*,|\s*$)/g;
const matches=row.match(regex);

if(!matches) return null;

return matches.map(v=>v.replace(/^"|"$/g,""));

}

function initMap(){

map=L.map("map").setView([39.5,-98.35],4);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{maxZoom:18}
).addTo(map);

markerCluster=L.markerClusterGroup();
map.addLayer(markerCluster);

}

function render(camps){

renderTable(camps);
renderMarkers(camps);

}

function renderMarkers(camps){

markerCluster.clearLayers();

let bounds=[];

camps.forEach(camp=>{

if(!camp.lat||!camp.lon) return;

const marker=L.marker([camp.lat,camp.lon]);

marker.bindPopup(
"<b>"+camp.name+"</b><br>"+
camp.location+"<br>"+
camp.date+"<br>"+
"<a href='"+camp.link+"' target='_blank'>Visit Camp</a>"
);

markerCluster.addLayer(marker);

bounds.push([camp.lat,camp.lon]);

});

if(bounds.length){
map.fitBounds(bounds,{padding:[40,40]});
}

}

function renderTable(camps){

const table=document.querySelector("#campTable tbody");
table.innerHTML="";

camps.forEach(camp=>{

const row=document.createElement("tr");

row.innerHTML=`
<td>${camp.name}</td>
<td>${camp.location}</td>
<td>${camp.state}</td>
<td>${camp.region}</td>
<td>${camp.date}</td>
<td>${camp.replay}</td>
<td><a href="${camp.link}" target="_blank">Visit</a></td>
`;

table.appendChild(row);

});

}

function populateFilters(camps){

const regionFilter=document.getElementById("regionFilter");
const stateFilter=document.getElementById("stateFilter");

const regions=[...new Set(camps.map(c=>c.region))].sort();
const states=[...new Set(camps.map(c=>c.state))].sort();

regions.forEach(r=>{
const option=document.createElement("option");
option.value=r;
option.textContent=r;
regionFilter.appendChild(option);
});

states.forEach(s=>{
const option=document.createElement("option");
option.value=s;
option.textContent=s;
stateFilter.appendChild(option);
});

}

function setupFilters(){

const search=document.getElementById("searchBox");
const month=document.getElementById("monthFilter");
const region=document.getElementById("regionFilter");
const state=document.getElementById("stateFilter");

function filter(){

const text=search.value.toLowerCase();

const filtered=allCamps.filter(camp=>{

const textMatch=
camp.name.toLowerCase().includes(text)||
camp.location.toLowerCase().includes(text);

const monthMatch=
month.value===""||
camp.date.includes(month.value);

const regionMatch=
region.value===""||
camp.region===region.value;

const stateMatch=
state.value===""||
camp.state===state.value;

return textMatch&&monthMatch&&regionMatch&&stateMatch;

});

render(filtered);

}

search.addEventListener("input",filter);
month.addEventListener("change",filter);
region.addEventListener("change",filter);
state.addEventListener("change",filter);

}

function setupViewToggle(){

const mapBtn=document.getElementById("mapBtn");
const listBtn=document.getElementById("listBtn");

const mapContainer=document.getElementById("mapContainer");
const listContainer=document.getElementById("listContainer");

mapBtn.onclick=()=>{
mapContainer.classList.remove("hidden");
listContainer.classList.add("hidden");
};

listBtn.onclick=()=>{
mapContainer.classList.add("hidden");
listContainer.classList.remove("hidden");
};

}

loadCamps();
