var config = {
  apiKey: "AIzaSyDiIL4vSQBo1cdD1Lh-rTGllYFUuBt5HGE",
  authDomain: "events-tracker-7f444.firebaseapp.com",
  databaseURL: "https://events-tracker-7f444.firebaseio.com",
  projectId: "events-tracker-7f444",
  storageBucket: "events-tracker-7f444.appspot.com",
  messagingSenderId: "567554433256"
};
firebase.initializeApp(config);
var database = firebase.database();

var data = [];

var endpoint = "https://app.ticketmaster.com/discovery/v2/events";

var key = "";

function searchEvents(q) {
  var queryUrl =
    endpoint +
    "?apikey=" +
    key +
    "&unit=km&city=Toronto&countryCode=ca&preferredCountry=ca&startDateTime=" +
    moment().format("YYYY-MM-DDTHH:mm:ssZ") +
    "&size=5&keyword=" +
    q;

  $.ajax({
    url: queryUrl
  }).then(function(response) {
    console.log(response);

    response._embedded.events.forEach(event => {
      var newEvent = {};
      newEvent.name = event.name;
      newEvent.link = event.url;
      newEvent.date = event.dates.start.localDate;
      newEvent.time = event.dates.start.localTime;
      newEvent.status = event.dates.status.code;
      newEvent.venue = event._embedded.venues[0].name;
      newEvent.latitude = event._embedded.venues[0].location.latitude;
      newEvent.longitude = event._embedded.venues[0].location.longitude;
      event.images.forEach(image => {
        if (image.width === 100) {
          newEvent.thumb = image.url;
        }
      });

      data.push(newEvent);
    });

    console.log(data);
  });
}
