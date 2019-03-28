$(document).ready(function() {
  var currentUser;
  var userUID;
  var isUserSignedIn = false;
  var markers;
  var geoJsonLayer;

  L.mapbox.accessToken =
    "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";

  var map = L.mapbox
    .map("saved-events-map")
    .setView([45.681832, -100.623177], 4)
    .addLayer(L.mapbox.styleLayer("mapbox://styles/mapbox/streets-v11"));

  var eventFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: []
    },
    properties: {
      eventId: "",
      name: "",
      date: "",
      time: "",
      status: "",
      city: ""
    }
  };

  var geoEventObject = {
    type: "FeatureCollection",
    features: []
  };

  var plotMarker = geoEventObject => {
    markers = new L.MarkerClusterGroup({
      zoomToBoundsOnClick: true
    });
    geoJsonLayer = L.geoJson(geoEventObject, {
      onEachFeature: onEachEventFeature
    });

    markers.addLayer(geoJsonLayer);
    map.addLayer(markers);
  };

  var addToEventFeature = eventSnapshot => {
    var es = eventSnapshot.val();

    eventFeature.geometry.coordinates[0] = parseFloat(es.venue.longitude);
    eventFeature.geometry.coordinates[1] = parseFloat(es.venue.latitude);
    eventFeature.properties.eventId = eventSnapshot.key;
    eventFeature.properties.name = es.name;
    eventFeature.properties.date = es.date;
    eventFeature.properties.time = es.time;
    eventFeature.properties.status = es.status;
    eventFeature.properties.city = es.venue.city;

    geoEventObject.features.push(JSON.parse(JSON.stringify(eventFeature)));
  };

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      isUserSignedIn = true;
      currentUser = firebase.auth().currentUser;
      userUID = currentUser.uid;

      var eventQuery = database.ref("events-tracker/" + userUID + "/event-details").orderByKey();

      eventQuery.once("value").then(function(eventDetailsSnapshot) {
        eventDetailsSnapshot.forEach(function(eventChildSnapshot) {
          addToEventFeature(eventChildSnapshot);
        });
        plotMarker(geoEventObject);
      });
    } else {
      isUserSignedIn = false;
    }
  });

  $(document).on("shown.bs.tab", 'a[data-toggle="tab"]', function(e) {
    if (isUserSignedIn) {
      map.invalidateSize(true).setView([45.681832, -100.623177], 4);
    }
  });

  var onEachEventFeature = (feature, layer) => {
    layer.on("click", function(e) {
      var divElem = $("<div>");
      var h5Elem = $("<h5>" + feature.properties.name + "</h5>");
      var cityElem = $("<p>Date: " + feature.properties.city + "</p>");
      var dateElem = $("<p>Date: " + feature.properties.date + " " + feature.properties.time + "</p>");
      var statusElem = $("<p>Status: " + feature.properties.status + "</p>");

      $(divElem).append(h5Elem, cityElem, dateElem, statusElem);
      var popup = L.popup()
        .setLatLng([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
        .setContent(divElem[0])
        .openOn(map);
    });
  };

  $(document).on("click", ".remove-event", function() {
    var eventId = $(this)
      .parents("tr")
      .attr("data-id");

    map.removeLayer(markers);
    markers.removeLayer(geoJsonLayer);

    geoEventObject.features = $.grep(geoEventObject.features, function(e) {
      return e.properties.eventId !== eventId;
    });
    geoJsonLayer = L.geoJson(geoEventObject, {
      onEachFeature: onEachEventFeature
    });

    markers.addLayer(geoJsonLayer);
    map.addLayer(markers);
  });

  $(document).on("click", ".save-event", function(e) {
    e.preventDefault();
    var eventId = $(this)
      .parents("tr")
      .attr("data-id");

    setTimeout(function() {
      map.removeLayer(markers);
      markers.removeLayer(geoJsonLayer);

      var query = database.ref("events-tracker/" + userUID + "/event-details/" + eventId).orderByKey();
      query.once("value").then(function(newEventSnapshot) {
        addToEventFeature(newEventSnapshot);

        plotMarker(geoEventObject);
      });
    }, 500);
  });
});
