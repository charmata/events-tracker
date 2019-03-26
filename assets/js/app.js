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

// Queries the api or loads a saved response from session storage
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

// Parse and store the info we need from the api response
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
    // Add a message indicating no results were returned
    var row = $("<tr>").html("<td>No results found</td>");
    $("#event-details").append(row);
  }
}

// Add row to search results table
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
    // Create save buttons if signed in
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

// Add row to saved events table
function addSavedRow(eventKey, eventData) {
  // Create table elements
  var row = $("<tr>").attr("data-id", eventKey);

  var eventName = $("<td>").attr("colspan", "2");
  var eventLink = $("<a>")
    .attr("href", eventData.link)
    .attr("target", "_blank")
    .text(eventData.name);
  $(eventName).append(eventLink);

  var eventLocation = $("<td>").text(eventData.venue);

  if (eventData.time) {
    var eventSchedule = $("<td>").text(
      moment(eventData.date).format("MMM DD, YYYY") +
        " at " +
        moment(eventData.time, "H:mm:ss").format("h:mma")
    );
  } else {
    var eventSchedule = $("<td>").text(moment(eventData.date).format("MMM DD, YYYY"));
  }

  if (eventData.minPrice) {
    if (eventData.minPrice === eventData.maxPrice) {
      var eventPriceRange = $("<td>").text(formatPrice(eventData.minPrice, eventData.currency));
    } else {
      var eventPriceRange = $("<td>").text(
        `${formatPrice(eventData.minPrice, eventData.currency)} - ${formatPrice(
          eventData.maxPrice,
          eventData.currency
        )}`
      );
    }
  } else {
    var eventPriceRange = $("<td>").text("TBD");
  }

  var eventStatus = $("<td>").text(eventData.status);

  var eventRemove = $("<td>");
  var eventRemoveLink = $("<a>")
    .attr("href", "#")
    .addClass("remove-event");
  var eventRemoveIcon = $("<i>").addClass("fa fa-trash-alt fa-fw text-info");

  $(eventRemoveLink).append(eventRemoveIcon);
  $(eventRemove).append(eventRemoveLink);

  // Append elements to table
  $(row)
    .append(eventName)
    .append(eventLocation)
    .append(eventSchedule)
    .append(eventPriceRange)
    .append(eventStatus)
    .append(eventRemove);
  $("#saved-events").append(row);
}

// Format price based on the type of currency
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

// Wait for the DOM to load before listening for any elements
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

  $("body").on("click", ".save-event", function(e) {
    e.preventDefault();
    var eventId = $(this)
      .parent()
      .parent()
      .attr("data-id");
    var userId = firebase.auth().currentUser.uid;
    var eventRef = database.ref(`events-tracker/${userId}/event-details/${eventId}`);
    eventRef.set(data[eventId]);
  });

  $("body").on("click", ".remove-event", function(e) {
    e.preventDefault();
    var row = $(this)
      .parent()
      .parent();
    var eventId = row.attr("data-id");
    var userId = firebase.auth().currentUser.uid;
    var eventRef = database.ref(`events-tracker/${userId}/event-details/${eventId}`);
    eventRef.remove();
    row.remove();
  });

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // When signed in
      isAuth = true;
      $("#signin-content").show();

      var userRef = database.ref(`events-tracker/${user.uid}`);
      userRef.once("value").then(function(snapshot) {
        if (!snapshot.exists()) {
          // Add user to database if they don't already exist
          userRef.set({
            name: user.displayName
          });
        }
      });

      var eventsRef = database.ref(`events-tracker/${user.uid}/event-details`);
      eventsRef.orderByChild("date").on("child_added", function(snapshot) {
        // Listen for saved events and add to table
        addSavedRow(snapshot.key, snapshot.val());
      });
    } else {
      // When signed out
      isAuth = false;
      database.ref().off("child_added");
      $("#saved-events").empty();
      $("#signin-content").hide();
    }
  });
});
