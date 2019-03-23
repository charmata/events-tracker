$(document).ready(function() {
  var firebaseUID = "";

  $("#signin").on("click", function() {
    $("#modal-signin").modal("show");
  });

  $("#signup").on("click", function() {
    $("#modal-signup").modal("show");
  });

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
              firebaseUID = newUser.uid;
              $("#modal-signup").modal("hide");
              $("#signin").hide();
              $("#signup").hide();
              $("#signout")
                .children("a")
                .text(newUser.displayName);
              $("#signout").show();
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

        firebaseUID = currentUser.uid;
        $("#modal-signin").modal("hide");
        $("#signin").hide();
        $("#signup").hide();
        $("#signout")
          .children("a")
          .text(currentUser.displayName);
        $("#signout").show();
      })
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + " " + errorMessage);
        $("#invalid-credentials").text("Invalid Credentials!!");
      });
  });

  $("#btn-signup-cancel").on("click", function() {
    $("#modal-signup").modal("hide");
  });

  $("#btn-signin-cancel").on("click", function() {
    $("#modal-signin").modal("hide");
  });
});
