"use strict";

fetch("/cities")
  .then(response => response.json())
  .then(data => handleCities(data))
  .catch(err => console.log(err));

let longLat = [];

let map = L.map("mapid").setView([10, -10], 1.5);

let Esri_WorldImagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  }
).addTo(map);

L.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibGVvbmlkYXMwMDAwIiwiYSI6ImNqbjJja2JqZjI1MGczcXF2eWF3YXB1bWwifQ.-FRhZ4uSDN9TnhzwvQ7cgw",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken:
      "pk.eyJ1IjoibGVvbmlkYXMwMDAwIiwiYSI6ImNqbjJja2JqZjI1MGczcXF2eWF3YXB1bWwifQ.-FRhZ4uSDN9TnhzwvQ7cgw"
  }
);

map.on("click", onMapClick);
let popup = L.popup();

function onMapClick(e) {
  popup
    .setLatLng(e.latlng)
    .setContent("You clicked the map at " + e.latlng.toString())
    .openOn(map);
}
map.on("click", onMapClick, { passive: true });

function handleCities(data) {
  for (let prop in data) {
    data[prop].map(city => {
      const marker = new L.marker([city.lat, city.lng])
        .bindPopup(city.name)
        .addTo(map);
    });
  }
}
