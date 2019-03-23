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
var totalPages;

var endpoint = "https://app.ticketmaster.com/discovery/v2/events";
var key = "iDRHy92FejlZujp04SMlt4ZiH2A1LpuY";

function searchEvents(query, page, city, date, category) {
  if (!date) {
    date = moment().format("YYYY-MM-DDTHH:mm:ssZ");
  } else {
    date = moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
  }
  var queryUrl = `${endpoint}?apikey=${key}&radius=40&unit=km&city=${city}&segmentId=${category}&startDateTime=${date}&sort=date,asc&size=5&page=${page}&keyword=${query}`;

  $.ajax({
    url: queryUrl
  }).then(function(response) {
    $("#event-details").empty();
    totalPages = response.page.totalPages;
    response._embedded.events.forEach(event => {
      // Store data
      var id = event.id;
      if (!data[id]) {
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
          data[id].currency = event.priceRanges[0].currency;
        }
      }
      addSearchRow(id);
    });
    console.log(data);
  });
}

function addSearchRow(id) {
  // Create table elements
  var row = $("<tr>").attr("data-id", id);

  var eventName = $("<td>").attr("colspan", "2");
  var eventLink = $("<a>")
    .attr("href", data[id].link)
    .attr("target", "_blank")
    .text(data[id].name);
  $(eventName).append(eventLink);

  var eventLocation = $("<td>").text(data[id].venue);

  if (data[id].time) {
    var eventSchedule = $("<td>").text(
      moment(data[id].date).format("MMM DD, YYYY") +
        " at " +
        moment(data[id].time, "H:mm:ss").format("h:mma")
    );
  } else {
    var eventSchedule = $("<td>").text(
      moment(data[id].date).format("MMM DD, YYYY")
    );
  }

  if (data[id].minPrice) {
    if (data[id].minPrice === data[id].maxPrice) {
      var eventPriceRange = $("<td>").text(
        formatPrice(data[id].minPrice, data[id].currency)
      );
    } else {
      var eventPriceRange = $("<td>").text(
        `${formatPrice(data[id].minPrice, data[id].currency)} - ${formatPrice(
          data[id].maxPrice,
          data[id].currency
        )}`
      );
    }
  } else {
    var eventPriceRange = $("<td>").text("TBD");
  }

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
}

function formatPrice(price, country) {
  var locales = {
    CAD: "en-CA",
    USD: "en-US"
  };
  var currency = new Intl.NumberFormat(locales[country], {
    style: "currency",
    currency: country
  });
  return currency.format(price);
}

$(document).ready(function() {
  var query, page, city, date, category;
  $("#search").on("click", function() {
    $("#next-page")
      .parent()
      .removeClass("disabled");
    $("#previous-page")
      .parent()
      .addClass("disabled");
    query = $("#event-search")
      .val()
      .trim();
    page = 0;
    city = $("#cityList").val();
    date = $("#start-date").val();
    category = $("#category-list").val();
    searchEvents(query, page, city, date, category);
  });
  $("#next-page").on("click", function(e) {
    e.preventDefault();
    if (page !== undefined) {
      if (page < totalPages) {
        if (page === 0) {
          $("#previous-page")
            .parent()
            .removeClass("disabled");
        }
        page++;
        searchEvents(query, page, city, date, category);
      }
      if (page === totalPages - 1) {
        $("#next-page")
          .parent()
          .addClass("disabled");
      }
    }
  });
  $("#previous-page").on("click", function(e) {
    e.preventDefault();
    if (page !== undefined && page !== 0) {
      if (page === totalPages - 1) {
        $("#next-page")
          .parent()
          .removeClass("disabled");
      }
      page--;
      if (page === 0) {
        $("#previous-page")
          .parent()
          .addClass("disabled");
      }
      searchEvents(query, page, city, date, category);
    }
  });
});
