$(document).ready(function() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";
  var map = new mapboxgl.Map({
    container: "saved-events-map",
    style: "mapbox://styles/mapbox/streets-v11"
  });

  map.setZoom(3);
  map.setCenter([-74.5, 40]);
  map.resize();
});
