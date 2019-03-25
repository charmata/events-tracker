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

var isAuth = false;
var data = {};
var totalPages;

var endpoint = "https://app.ticketmaster.com/discovery/v2/events";
var key = "iDRHy92FejlZujp04SMlt4ZiH2A1LpuY";

function searchEvents(query, page, city, date, category) {
  date = moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
  var queryUrl = `${endpoint}?apikey=${key}&radius=40&unit=km&city=${city}&segmentId=${category}&startDateTime=${date}&sort=date,asc&size=5&page=${page}&keyword=${query}`;

  // Check if query exists in session storage before making a network request
  if (sessionStorage.getItem(queryUrl)) {
    parseData(JSON.parse(sessionStorage.getItem(queryUrl)));
  } else {
    $.ajax({
      url: queryUrl
    }).then(function(response) {
      sessionStorage.setItem(queryUrl, JSON.stringify(response));
      parseData(JSON.parse(sessionStorage.getItem(queryUrl)));
    });
  }
}

function parseData(response) {
  $("#event-details").empty();
  totalPages = response.page.totalPages;
  if (response._embedded) {
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
  } else {
    var row = $("<tr>").html("<td>No results found</td>");
    $("#event-details").append(row);
  }
  console.log(data);
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
    var eventSchedule = $("<td>").text(moment(data[id].date).format("MMM DD, YYYY"));
  }

  if (data[id].minPrice) {
    if (data[id].minPrice === data[id].maxPrice) {
      var eventPriceRange = $("<td>").text(formatPrice(data[id].minPrice, data[id].currency));
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

  if (isAuth) {
    var eventSave = $("<td>");
    var eventSaveLink = $("<a>")
      .attr("href", "#")
      .addClass("save-event");
    var eventSaveIcon = $("<i>").addClass("fa fa-save fa-fw text-info");

    $(eventSaveLink).append(eventSaveIcon);
    $(eventSave).append(eventSaveLink);
  }

  // Append elements to table
  $(row)
    .append(eventName)
    .append(eventLocation)
    .append(eventSchedule)
    .append(eventPriceRange)
    .append(eventStatus)
    .append(eventSave);
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

  $("#start-date").val(moment().format("YYYY-MM-DD"));

  $("#search, #btn-search").on("click", function() {
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

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      isAuth = true;
      var userRef = database.ref("events-tracker/" + user.uid);
      userRef.once("value").then(function(snapshot) {
        if (!snapshot.exists()) {
          userRef.set({
            name: user.displayName
          });
        }
      });
    } else {
      isAuth = false;
    }
  });
});
