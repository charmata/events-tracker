$(document).ready(function() {
  var currentUser;
  var userUID;
  var mapDatabaseRef;
  var isUserSignedIn = false;

  L.mapbox.accessToken =
    "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";

  var map = L.mapbox
    .map("saved-events-map")
    .setView([-100.623177, 45.881832], 4)
    .addLayer(L.mapbox.styleLayer("mapbox://styles/mapbox/streets-v11"));

  var eventFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: []
    },
    properties: {
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
    console.log("Inside plotMarker");
    console.log(geoEventObject);
    // var divElem = $("<div>");
    // var h3Elem = $("<h5>" + eventName + "</h5>");
    // var dateElem = $("<p>Date: " + eventDate + " " + eventTime + "</p>");
    // var statusElem = $("<p>Status: " + eventStatus + "</p>");

    // $(divElem).append(h3Elem, dateElem, statusElem);

    // var popup = new mapboxgl.Popup({ offset: 25, className: "marker-popup" }).setDOMContent(divElem[0]);

    var markers = new L.MarkerClusterGroup();
    var geoJsonLayer = L.geoJson(geoEventObject, {
      onEachFeature: onEachEventFeature
    });

    markers.addLayer(geoJsonLayer);
    map.addLayer(markers);
  };

  var addToEventFeature = eventSnapshot => {
    var es = eventSnapshot.val();
    console.log(es);
    eventFeature.geometry.coordinates[0] = parseFloat(es.venue.longitude);
    eventFeature.geometry.coordinates[1] = parseFloat(es.venue.latitude);
    eventFeature.properties.name = es.name;
    eventFeature.properties.date = es.date;
    eventFeature.properties.time = es.time;
    eventFeature.properties.status = es.status;
    eventFeature.properties.city = es.venue.city;
    console.log(geoEventObject);

    geoEventObject.features.push(JSON.parse(JSON.stringify(eventFeature)));
  };

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      isUserSignedIn = true;
      currentUser = firebase.auth().currentUser;
      userUID = currentUser.uid;

      var eventQuery = database.ref("events-tracker/" + userUID + "/event-details").orderByKey();
      // mapDatabaseRef = database.ref("events-tracker/" + userUID + "/event-details");

      eventQuery.once("value").then(function(eventDetailsSnapshot) {
        eventDetailsSnapshot.forEach(function(eventChildSnapshot) {
          addToEventFeature(eventChildSnapshot);
        });
        plotMarker(geoEventObject);
      });
    } else {
      isUserSignedIn = false;
      console.log("Signed Out");
    }
  });

  $(document).on("shown.bs.tab", 'a[data-toggle="tab"]', function(e) {
    console.log($(this));
    if (isUserSignedIn) {
      console.log("invalidate size");
      setTimeout(function() {
        map.invalidateSize(true);
      }, 500);
    }
  });

  var onEachEventFeature = (feature, layer) => {
    console.log(feature);
  };
});
