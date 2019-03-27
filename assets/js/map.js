$(document).ready(function() {
  var currentUser;
  var map;
  var markerCollection = [];

  var geoEventObject = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-79.3849, 43.6529]
        },
        properties: {
          name: "Toronto1"
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-79.3849, 43.6529]
        },
        properties: {
          name: "Toronto2"
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-79.3849, 43.6529]
        },
        properties: {
          name: "Toronto3"
        }
      }
    ]
  };

  var plotMarker = eventSnapshot => {
    var es = eventSnapshot.val();
    // console.log(es);

    var eventName = es.name;
    var eventStatus = es.status;
    var eventLatitude = es.venue.latitude;
    var eventLongitude = es.venue.longitude;
    var eventDate = es.date;
    var eventTime = es.time;

    var divElem = $("<div>");
    var h3Elem = $("<h5>" + eventName + "</h5>");
    var dateElem = $("<p>Date: " + eventDate + " " + eventTime + "</p>");
    var statusElem = $("<p>Status: " + eventStatus + "</p>");

    $(divElem).append(h3Elem, dateElem, statusElem);

    // var popup = new mapboxgl.Popup({ offset: 25, className: "marker-popup" }).setDOMContent(divElem[0]);

    // var marker = new mapboxgl.Marker()
    //   .setLngLat([eventLongitude, eventLatitude])
    //   .setPopup(popup)
    //   .addTo(map);
  };

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = firebase.auth().currentUser;
      // console.log("Signed in");
      // console.log("User: " + currentUser);
      L.mapbox.accessToken =
        "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";
      // var mapDatabaseRef = database.ref("events-tracker/p2K1huQpB0fSMBhho64NdidGn6F3/event-details");
      map = L.mapbox
        .map("saved-events-map")
        .setView([-100.623177, 45.881832], 4)
        .addLayer(L.mapbox.styleLayer("mapbox://styles/mapbox/streets-v11"));

      // mapDatabaseRef.on("child_added", function(eventSnapshot) {
      //   plotMarker(eventSnapshot);
      // });

      var markers = new L.MarkerClusterGroup();
      var geoJsonLayer = L.geoJson(geoEventObject, {
        onEachFeature: onEachEventFeature
      });

      markers.addLayer(geoJsonLayer);
      map.addLayer(markers);
    } else {
      console.log("Signed Out");
    }
  });

  var onEachEventFeature = (feature, layer) => {
    console.log(feature);
  };

  // $(document).on("click", ".mapboxgl-marker", function() {

  // })
});
