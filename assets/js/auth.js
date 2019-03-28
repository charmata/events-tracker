$(document).ready(function() {
  var firebaseUID = "";

  //Show modal on clicking sign in
  $("#signin").on("click", function() {
    $("#modal-signin").modal("show");
  });

  //Show modal on clicking sign up
  $("#signup").on("click", function() {
    $("#modal-signup").modal("show");
  });

  // Function to hide sign in and show sign out options
  var signedIn = currentUser => {
    firebaseUID = currentUser.uid;
    // $("#signin")
    //   .parent("li")
    //   .hide();
    $("#signin").hide();
    // $("#signup")
    //   .parent("li")
    //   .css("display", "none");
    $("#signup").hide();
    $("#signout")
      .children("a")
      .text(currentUser.displayName);
    $("#signout").show();
    // $("#signout").css("display", "block");
  };

  // Function to hide sign out and show sign in options
  var signedOut = () => {
    $("#signin").show();
    // $("#signin").css("display", "block");
    $("#signup").show();
    // $("#signup").css("display", "block");
    $("#signout")
      .children("a")
      .text("");
    $("#signout").hide();
    // $("#signout").css("display", "none");
  };

  //Event handler for signup button click
  $("#btn-signup").on("click", function() {
    var userEmail = $("#signup-email")
      .val()
      .trim();

    var userPassword = $("#signup-password")
      .val()
      .trim();

    var userName = $("#signup-name")
      .val()
      .trim();

    // Create new user account with email and password
    firebase
      .auth()
      .createUserWithEmailAndPassword(userEmail, userPassword)
      .then(userObj => {
        console.log(userObj);
        if (userObj) {
          var newUser = firebase.auth().currentUser;
          //Update the user profile with teh display name
          newUser
            .updateProfile({
              displayName: userName
            })
            .then(function() {
              $("#modal-signup").modal("hide");
              signedIn(newUser);
            })
            .catch(function(error) {
              console.log(error);
            });
        }
      })
      .catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + " " + errorMessage);
        $("#invalid-input").text("Invalid Input!!");
      });

    $("#signin-email").val("");
    $("#signin-password").val("");
    $("#signup-name").val("");
  });

  // Event handler for sign in button click
  $("#btn-signin").on("click", function() {
    var userEmail = $("#signin-email")
      .val()
      .trim();

    var userPassword = $("#signin-password")
      .val()
      .trim();

    // Firebase sign in with email and password
    firebase
      .auth()
      .signInWithEmailAndPassword(userEmail, userPassword)
      .then(function(userObj) {
        var currentUser = firebase.auth().currentUser;
        $("#modal-signin").modal("hide");
        signedIn(currentUser);
      })
      .catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + " " + errorMessage);
        $("#invalid-credentials").text("Invalid Credentials!!");
      });

    $("#signin-email").val("");
    $("#signin-password").val("");
  });

  //Cancel button event on sign up modal
  $("#btn-signup-cancel").on("click", function() {
    $("#modal-signup").modal("hide");
  });

  //Cancel button event on sign in modal
  $("#btn-signin-cancel").on("click", function() {
    $("#modal-signin").modal("hide");
  });

  // Handle authentication state change
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var currentUser = firebase.auth().currentUser;
      console.log("Signed in");
      signedIn(currentUser);
    } else {
      console.log("Signed Out");
      signedOut();
    }
  });

  //Set persistence to SESSION. Closing browser session will end the session
  firebase
    .auth()
    .setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(function() {})
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
    });

  //Handle sign out event
  $("a[name=signout]").on("click", function() {
    console.log("Text " + $(this).text());
    firebase
      .auth()
      .signOut()
      .then(
        function() {
          console.log("Signed Out");
        },
        function(error) {
          console.error("Sign Out Error", error);
        }
      );
  });
});
