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
  var queryParams = $.param({
    apikey: key,
    radius: 40,
    unit: "km",
    city: city,
    segmentId: category,
    startDateTime: date,
    sort: "date,asc",
    size: 5,
    page: page,
    keyword: query
  });
  var queryUrl = `${endpoint}?${queryParams}`;

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

// Check the api for changes to the saved event
function updateEvent(id) {
  var queryUrl = `${endpoint}/${id}?apikey=${key}`;

  // Don't bother caching results since we want the latest data
  $.ajax({
    url: queryUrl
  }).then(function(response) {
    var userId = firebase.auth().currentUser.uid;
    var eventRef = database.ref(`events-tracker/${userId}/event-details/${id}`);
    eventRef.once("value").then(function(snapshot) {
      var currentData = {};

      // Get stored data
      if (snapshot.val().minPrice) {
        currentData.minPrice = snapshot.val().minPrice;
        currentData.maxPrice = snapshot.val().maxPrice;
      }
      currentData.status = snapshot.val().status;

      // Check against latest data
      if (response.priceRanges.min) {
        if (currentData.minPrice !== response.priceRanges.min) {
          currentData.minPrice = response.priceRanges.min;
        }
        if (currentData.maxPrice !== response.priceRanges.max) {
          currentData.maxPrice = response.priceRanges.max;
        }
      }
      if (currentData.status !== response.dates.status.code) {
        currentData.status = response.dates.status.code;
      }

      // Store latest data
      Object.keys(currentData).forEach(key => {
        eventRef.child(key).set(currentData[key]);
      });
    });
  });
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
        data[id] = {
          name: event.name,
          link: event.url,
          date: event.dates.start.localDate,
          status: event.dates.status.code,
          venue: {
            id: event._embedded.venues[0].id,
            name: event._embedded.venues[0].name,
            city: event._embedded.venues[0].city.name,
            address: event._embedded.venues[0].address.line1,
            postalCode: event._embedded.venues[0].postalCode,
            stateCode: event._embedded.venues[0].state.stateCode
          }
        };

        // Time is not always present
        if (!event.dates.start.timeTBA && !event.dates.start.noSpecificTime) {
          data[id].time = event.dates.start.localTime;
        }

        // Look for event image which is exactly 100px
        if (event.images) {
          event.images.forEach(image => {
            if (image.width === 100) {
              data[id].thumb = image.url;
            }
          });
        }

        // Pricing is not always available
        if (event.priceRanges) {
          data[id].minPrice = event.priceRanges[0].min;
          data[id].maxPrice = event.priceRanges[0].max;
          data[id].currency = event.priceRanges[0].currency;
        }

        // Ticketsnow doesn't provide coordinates with their venues
        if (event._embedded.venues[0].location.latitude != 0 || event._embedded.venues[0].location.longitude != 0) {
          data[id].venue.latitude = event._embedded.venues[0].location.latitude;
          data[id].venue.longitude = event._embedded.venues[0].location.longitude;
        }

        // Look for venue image which is exactly 205px
        if (event._embedded.venues[0].images) {
          event._embedded.venues[0].images.forEach(image => {
            if (image.width === 205) {
              data[id].venue.thumb = image.url;
            }
          });
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
    .attr("target", "_blank");
  var eventLinkIcon = $("<i>")
    .addClass("fas fa-shopping-cart fa-fw text-dark")
    .css("margin-right", "5px");
  var eventLinkText = $("<span>").text(data[id].name);

  $(eventLink).append(eventLinkIcon, eventLinkText);
  $(eventName).append(eventLink);

  var eventLocation = $("<td>").text(`${data[id].venue.name}, ${data[id].venue.city}`);

  if (data[id].time) {
    var eventSchedule = $("<td>").text(
      moment(data[id].date).format("MMM DD, YYYY") + " at " + moment(data[id].time, "H:mm:ss").format("h:mm A")
    );
  } else {
    var eventSchedule = $("<td>").text(moment(data[id].date).format("MMM DD, YYYY"));
  }

  if (data[id].minPrice) {
    if (data[id].minPrice === data[id].maxPrice) {
      var eventPriceRange = $("<td>").text(formatPrice(data[id].minPrice, data[id].currency));
    } else {
      var eventPriceRange = $("<td>").text(
        `${formatPrice(data[id].minPrice, data[id].currency)} - ${formatPrice(data[id].maxPrice, data[id].currency)}`
      );
    }
  } else {
    var eventPriceRange = $("<td>").text("TBD");
  }

  var eventStatus = $("<td>").text(data[id].status);

  var eventSave = $("<td>");
  var eventSaveLink = $("<a>")
    .attr("href", "#")
    .addClass("save-event");
  var eventSaveIcon = $("<i>").addClass("fa fa-save fa-fw text-info");

  $(eventSaveLink).append(eventSaveIcon);
  $(eventSave).append(eventSaveLink);
  // Hide save buttons if signed out
  if (!isAuth) {
    $(eventSave).hide();
  }

  // Append elements to table
  $(row).append(eventName, eventLocation, eventSchedule, eventPriceRange, eventStatus, eventSave);
  $("#event-details").append(row);
}

// Add row to saved events table
function addSavedRow(eventKey, eventData) {
  // Create table elements
  var row = $("<tr>").attr("data-id", eventKey);

  var eventName = $("<td>").attr("colspan", "2");
  var eventLink = $("<a>")
    .attr("href", eventData.link)
    .attr("target", "_blank");
  var eventLinkIcon = $("<i>")
    .addClass("fas fa-shopping-cart fa-fw text-dark")
    .css("margin-right", "5px");
  var eventLinkText = $("<span>").text(eventData.name);

  $(eventLink).append(eventLinkIcon, eventLinkText);
  $(eventName).append(eventLink);

  var eventLocation = $("<td>").text(`${eventData.venue.name}, ${eventData.venue.city}`);

  if (eventData.time) {
    var eventSchedule = $("<td>").text(
      moment(eventData.date).format("MMM DD, YYYY") + " at " + moment(eventData.time, "H:mm:ss").format("h:mm A")
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

  // Update event buttons
  var eventUpdate = $("<td>");
  var eventUpdateLink = $("<a>")
    .attr("href", "#")
    .addClass("update-event");
  var eventUpdateIcon = $("<i>").addClass("fa fa-sync-alt fa-fw text-success");

  $(eventUpdateLink).append(eventUpdateIcon);
  $(eventUpdate).append(eventUpdateLink);

  // Remove event buttons
  var eventRemove = $("<td>");
  var eventRemoveLink = $("<a>")
    .attr("href", "#")
    .addClass("remove-event");
  var eventRemoveIcon = $("<i>").addClass("fa fa-trash-alt fa-fw text-danger");

  $(eventRemoveLink).append(eventRemoveIcon);
  $(eventRemove).append(eventRemoveLink);

  // Append elements to table
  $(row).append(eventName, eventLocation, eventSchedule, eventPriceRange, eventStatus, eventUpdate, eventRemove);
  $("#saved-events").append(row);
}

// Update row in saved events table
function updateSavedRow(eventKey, eventData) {
  var rowSelector = "#saved-events tr[data-id=" + eventKey + "]";

  if (eventData.minPrice) {
    if (eventData.minPrice === eventData.maxPrice) {
      $(rowSelector + " td:nth-child(4)").text(formatPrice(eventData.minPrice, eventData.currency));
    } else {
      $(rowSelector + " td:nth-child(4)").text(
        `${formatPrice(eventData.minPrice, eventData.currency)} - ${formatPrice(
          eventData.maxPrice,
          eventData.currency
        )}`
      );
    }
  } else {
    $(rowSelector + " td:nth-child(4)").text("TBD");
  }

  $(rowSelector + " td:nth-child(5)").text(eventData.status);
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

  $("#search-suggest button").on("click", function() {
    query = $(this).text();
    var btnCategory = $(this).attr("data-category");
    $("#category-list").val(btnCategory);

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

  $("body").on("click", ".update-event", function(e) {
    e.preventDefault();
    var eventId = $(this)
      .parent()
      .parent()
      .attr("data-id");
    updateEvent(eventId);
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

      // Show save buttons
      $("#event-details td:nth-child(6)").show();
      $("#event-details-list th:nth-child(6)").show();

      var eventsRef = database.ref(`events-tracker/${user.uid}/event-details`);

      // Listen for saved events and add to table
      eventsRef.orderByChild("date").on("child_added", function(snapshot) {
        addSavedRow(snapshot.key, snapshot.val());
      });

      // Listen for updated values and update table
      eventsRef.on("child_changed", function(snapshot) {
        updateSavedRow(snapshot.key, snapshot.val());
      });
    } else {
      // When signed out
      isAuth = false;

      // Hide save buttons
      $("#event-details td:nth-child(6)").hide();
      $("#event-details-list th:nth-child(6)").hide();

      database.ref().off("child_added");
      $("#saved-events").empty();
      $("#signin-content").hide();
    }
  });
});
