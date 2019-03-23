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
var key = "iDRHy92FejlZujp04SMlt4ZiH2A1LpuY";

var categories = {
  sports: "KZFzniwnSyZfZ7v7nE",
  concerts: "KZFzniwnSyZfZ7v7nJ",
  arts: "KZFzniwnSyZfZ7v7na",
  family: "KnvZfZ7vA1n",
  film: "KZFzniwnSyZfZ7v7nn"
};

function searchEvents(query, page, city, category, date) {
  $("#event-details").empty();
  if (!category) {
    category = categories.sports;
  }
  if (!date) {
    date = moment().format("YYYY-MM-DDTHH:mm:ssZ");
  } else {
    date = moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
  }
  var queryUrl = `${endpoint}?apikey=${key}&radius=40&unit=km&countryCode=CA&city=${city}&segmentId=${category}&startDateTime=${date}&source=ticketmaster&sort=date,asc&size=5&page=${page}&keyword=${query}`;

  $.ajax({
    url: queryUrl
  }).then(function(response) {
    response._embedded.events.forEach(event => {
      // Store data
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

      // Create table elements
      var row = $("<tr>").attr("data-id", id);
      var eventName = $("<td>").attr("colspan", "2");
      var eventLink = $("<a>")
        .attr("href", data[id].link)
        .attr("target", "_blank")
        .text(data[id].name);
      $(eventName).append(eventLink);
      var eventLocation = $("<td>").text(data[id].venue);
      var eventSchedule = $("<td>").text(
        moment(data[id].date).format("MMMM DD, YYYY") +
          " at " +
          moment(data[id].time, "H:mm:ss").format("h:mma")
      );
      var eventPriceRange = $("<td>").text(
        "$" + data[id].minPrice + " - $" + data[id].maxPrice
      );
      var eventStatus = $("<td>").text(data[id].status);
      var eventSave = $("<td>").text(""); // Placeholder

      // Append elements to table
      $(row).append(eventName);
      $(row).append(eventLocation);
      $(row).append(eventSchedule);
      $(row).append(eventPriceRange);
      $(row).append(eventStatus);
      $(row).append(eventSave);
      $("#event-details").append(row);
    });
    console.log(data);
  });
}

$(document).ready(function() {
  $("#search").on("click", function() {
    var query = $("#event-search")
      .val()
      .trim();
    var city = $("#cityList").val();
    var date = $("#start-date").val();
    searchEvents(query, 0, city, null, date);
  });
});
