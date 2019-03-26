$(document).ready(function() {
  var currentUser;
  var map;
  var markerCollection = [];
  var existingLngLat = [];
  var xOffset = 0;
  var yOffset = 0;

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

    var popup = new mapboxgl.Popup({ offset: 25, className: "marker-popup" }).setDOMContent(divElem[0]);

    // if (markerCollection.length > 0) {
    //   markerCollection.forEach(element => {
    //     console.log(element.getLngLat().toArray());
    //     console.log("Lng: " + eventLongitude);
    //     console.log("Lat: " + eventLatitude);
    //     existingLngLat = element.getLngLat().toArray();
    //     if (eventLongitude === existingLngLat[0] && eventLatitude === existingLngLat[1]) {
    //       xOffset = -0.2;
    //       yOffset = -0.1;
    //     }
    //   });
    // }

    var marker = new mapboxgl.Marker()
      .setLngLat([eventLongitude, eventLatitude])
      .setPopup(popup)
      .addTo(map);
    // markerCollection.push(marker);
    // xOffset = 0;
    // yOffset = 0;
  };

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = firebase.auth().currentUser;
      // console.log("Signed in");
      // console.log("User: " + currentUser);
      mapboxgl.accessToken =
        "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";
      var mapDatabaseRef = database.ref("events-tracker/p2K1huQpB0fSMBhho64NdidGn6F3/event-details");
      map = new mapboxgl.Map({
        container: "saved-events-map",
        style: "mapbox://styles/mapbox/streets-v11"
      });

      mapDatabaseRef.on("child_added", function(eventSnapshot) {
        plotMarker(eventSnapshot);
      });

      map.setZoom(3);
      map.setCenter([-100.623177, 45.881832]);
    } else {
      console.log("Signed Out");
    }
  });

  // $(document).on("click", ".mapboxgl-marker", function() {

  // })
});
