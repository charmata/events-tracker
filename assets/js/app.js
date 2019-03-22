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

var data = {};

var endpoint = "https://app.ticketmaster.com/discovery/v2/events";

var key = "";

function searchEvents(q, p, city) {
  if (!p) {
    p = 0;
  }
  if (!city) {
    city = "Toronto";
  }
  var queryUrl =
    endpoint +
    "?apikey=" +
    key +
    "&unit=km&countryCode=CA&city=" +
    city +
    "&startDateTime=" +
    moment().format("YYYY-MM-DDTHH:mm:ssZ") +
    "&sort=date,asc&size=5&page=" +
    p +
    "&keyword=" +
    q;

  $.ajax({
    url: queryUrl
  }).then(function(response) {
    console.log(response);
    response._embedded.events.forEach(event => {
      var id = event.id;
      data[id] = {};
      data[id].name = event.name;
      data[id].link = event.url;
      data[id].date = event.dates.start.localDate;
      if (!event.dates.start.timeTBA) {
        data[id].time = event.dates.start.localTime;
      }
      data[id].status = event.dates.status.code;
      data[id].venue = event._embedded.venues[0].name;
      data[id].latitude = event._embedded.venues[0].location.latitude;
      data[id].longitude = event._embedded.venues[0].location.longitude;
      event.images.forEach(image => {
        if (image.width === 100) {
          data[id].thumb = image.url;
        }
      });
      if (event.priceRanges) {
        data[id].minPrice = event.priceRanges[0].min;
        data[id].maxPrice = event.priceRanges[0].max;
      }
    });

    console.log(data);
  });
}
