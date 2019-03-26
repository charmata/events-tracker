$(document).ready(function() {
  var currentUser;

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = firebase.auth().currentUser;
      console.log("Signed in");
      console.log("User: " + currentUser);
      mapboxgl.accessToken =
        "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";
      var mapDatabaseRef = database.ref("events-tracker/p2K1huQpB0fSMBhho64NdidGn6F3/event-details");
      var map = new mapboxgl.Map({
        container: "saved-events-map",
        style: "mapbox://styles/mapbox/streets-v11"
      });

      mapDatabaseRef.on("child_added", function(eventSnapshot) {
        var es = eventSnapshot.val();
        console.log(es);

        var eventName = es.name;
        var eventStatus = es.status;
        var eventLatitude = es.latitude;
        var eventLongitude = es.longitude;
        var eventDate = es.date;
        var eventTime = es.time;

        var marker = new mapboxgl.Marker().setLngLat([eventLongitude, eventLatitude]).addTo(map);
      });

      map.setZoom(3);
      map.setCenter([-100.623177, 45.881832]);
    } else {
      console.log("Signed Out");
    }
  });
});
