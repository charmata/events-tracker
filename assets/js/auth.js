$(document).ready(function() {
  var firebaseUID = "";

  $("#signin").on("click", function() {
    $("#modal-signin").modal("show");
  });

  $("#signup").on("click", function() {
    $("#modal-signup").modal("show");
  });

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

    firebase
      .auth()
      .createUserWithEmailAndPassword(userEmail, userPassword)
      .then(userObj => {
        console.log(userObj);
        if (userObj) {
          var newUser = firebase.auth().currentUser;
          newUser
            .updateProfile({
              displayName: userName
            })
            .then(function() {
              // console.log(newUser.displayName);
              // console.log(newUser.uid);
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

  $("#btn-signin").on("click", function() {
    var userEmail = $("#signin-email")
      .val()
      .trim();

    var userPassword = $("#signin-password")
      .val()
      .trim();

    firebase
      .auth()
      .signInWithEmailAndPassword(userEmail, userPassword)
      .then(function(userObj) {
        var currentUser = firebase.auth().currentUser;
        console.log(currentUser);
        $("#modal-signin").modal("hide");
        signedIn(currentUser);
      })
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + " " + errorMessage);
        $("#invalid-credentials").text("Invalid Credentials!!");
      });

    $("#signin-email").val("");
    $("#signin-password").val("");
  });

  $("#btn-signup-cancel").on("click", function() {
    $("#modal-signup").modal("hide");
  });

  $("#btn-signin-cancel").on("click", function() {
    $("#modal-signin").modal("hide");
  });

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

  firebase
    .auth()
    .setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(function() {})
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
    });

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
