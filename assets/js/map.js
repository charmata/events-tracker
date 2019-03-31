$(document).ready(function() {
  var currentUser;
  var userUID;
  var isUserSignedIn = false;
  var markers;
  var geoJsonLayer;

  //Mapbox access token
  L.mapbox.accessToken =
    "pk.eyJ1IjoidG9zaHlhbXN1bmRhciIsImEiOiJjanRoazR5M2wwOHU0NDNsZTJmNHRwYjM1In0.9ID0Zv8TuBqLP0r6NYiSSQ";

  // Create a map inside the given container
  var map = L.mapbox
    .map("saved-events-map")
    .setView([45.681832, -100.623177], 4)
    .addLayer(L.mapbox.styleLayer("mapbox://styles/mapbox/streets-v11"));

  // GeoJSON, one feature for each event
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

  // The whole GeoJSON object. Contains multiple event features
  var geoEventObject = {
    type: "FeatureCollection",
    features: []
  };

  //Function to plot markers on the map
  var plotMarker = geoEventObject => {
    // Create a marker cluster group
    markers = new L.MarkerClusterGroup({
      zoomToBoundsOnClick: true
    });
    //Create a GeoJSON layer using Leaflet geoJson API
    geoJsonLayer = L.geoJson(geoEventObject, {
      //Execute the function onEachEventFeature for each feature
      onEachFeature: onEachEventFeature
    });

    // Add the markers using the GeoJSON
    markers.addLayer(geoJsonLayer);
    // Add the markers to the map
    map.addLayer(markers);
  };

  //Function to the event's properties in the GeoJSON object
  var addToEventFeature = eventSnapshot => {
    var es = eventSnapshot.val();

    if (es.venue.longitude) {
      eventFeature.geometry.coordinates[0] = parseFloat(es.venue.longitude);
    } else {
      eventFeature.geometry.coordinates[0] = 0;
    }

    if (es.venue.latitude) {
      eventFeature.geometry.coordinates[1] = parseFloat(es.venue.latitude);
    } else {
      eventFeature.geometry.coordinates[1] = 0;
    }

    eventFeature.properties.eventId = eventSnapshot.key;
    eventFeature.properties.name = es.name;
    eventFeature.properties.date = es.date;
    if (es.time) {
      eventFeature.properties.time = es.time;
    } else {
      eventFeature.properties.time = "";
    }
    eventFeature.properties.status = es.status;
    eventFeature.properties.city = es.venue.city;

    //Add the event feature object to the overall object by value
    geoEventObject.features.push(JSON.parse(JSON.stringify(eventFeature)));
  };

  // Authentication state change event
  firebase.auth().onAuthStateChanged(function(user) {
    //If user is signed in
    if (user) {
      isUserSignedIn = true;
      currentUser = firebase.auth().currentUser;
      userUID = currentUser.uid;

      //Get the reference to the saved events for the user
      var eventQuery = database.ref("events-tracker/" + userUID + "/event-details").orderByKey();

      eventQuery.once("value").then(function(eventDetailsSnapshot) {
        eventDetailsSnapshot.forEach(function(eventChildSnapshot) {
          //Store each saved event to the GeoJSON object
          addToEventFeature(eventChildSnapshot);
        });
        // Then plot the map with markers
        plotMarker(geoEventObject);
      });
    } else {
      isUserSignedIn = false;
    }
  });

  //On tab shown event
  $(document).on("shown.bs.tab", 'a[data-toggle="tab"]', function(e) {
    if (isUserSignedIn) {
      //Update the map based on the change in the container size
      map.invalidateSize(true).setView([45.681832, -100.623177], 4);
    }
  });

  // Function for each event feature
  var onEachEventFeature = (feature, layer) => {
    //Add a click event for the markers
    layer.on("click", function(e) {
      var divElem = $("<div>");
      var h5Elem = $("<h5>" + feature.properties.name + "</h5>");
      var cityElem = $("<p>Date: " + feature.properties.city + "</p>");
      var dateElem = $("<p>Date: " + feature.properties.date + " " + feature.properties.time + "</p>");
      var statusElem = $("<p>Status: " + feature.properties.status + "</p>");

      $(divElem).append(h5Elem, cityElem, dateElem, statusElem);
      //Add a popup for the marker
      var popup = L.popup()
        .setLatLng([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
        .setContent(divElem[0])
        .openOn(map);
    });
  };

  //Event handler for removing markers from the map
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

  //Event handler for adding markers to the map
  $(document).on("click", ".save-event", function(e) {
    e.preventDefault();
    var eventId = $(this)
      .parents("tr")
      .attr("data-id");

    // Timeout to ensure newly saved event is available in the database
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
