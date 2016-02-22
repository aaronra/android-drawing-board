if (Meteor.isClient) {
  function onDeviceReady() {
    navigator.splashscreen.hide();
    newCanvas();

    // accelerometer triggers
    startWatch();
  }

  var ctx, color = "#000", x = 0, y = 0, z = 0, etch = 0;

  $(document).ready(function () {
    // hide the accelerometer aka etch on/off button
    $("#etch").hide();

    // Call onDeviceReady when Cordova is loaded and talking with the native device
    document.addEventListener("deviceready", onDeviceReady, false);

    // setup a new canvas for drawing
    newCanvas();

    // prevent footer to toggle on touch
    $("[data-role=footer]").fixedtoolbar({tapToggle: false});

    // reset palette selection (css) and select the clicked color for canvas strokeStyle
    $(".palette").click(function () {
      $(".palette").css("border-color", "#777");
      $(".palette").css("border-style", "solid");
      $(this).css("border-color", "#fff");
      $(this).css("border-style", "dashed");
      color = $(this).css("background-color");
      ctx.beginPath();
      ctx.strokeStyle = color;
    });
    // link the new button with newCanvas() function
    $("#new").click(function () {
      newCanvas();
    });

    // hide help popup when clicked anywhere on screen
    $("body").click(function () {
      $("#etchHelp").fadeOut();
    });

    $("#etch").click(function () {
      if (etch) {
        etch = 0;
        $("#etch .ui-btn-text").text("Etch OFF");
        stopWatch();
      } else {
        etch = 1;
        $("#etch .ui-btn-text").text("Etch ON");
        startWatch();
      }
    });
  });

  // function to setup a new canvas for drawing
  function newCanvas() {
    //define and resize canvas
    $("#content").height($(window).height() - 90);
    var canvas = '<canvas id="canvas" width="' + $(window).width() + '" height="' + ($(window).height() - 90) + '"></canvas>';
    $("#content").html(canvas);

    // setup canvas
    ctx = document.getElementById("canvas").getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;

    // set starting point in center
    ctx.beginPath();
    x = $(window).width() / 2;
    y = ($(window).height() - 90) / 2;
    ctx.moveTo(x, y);

    // setup to trigger drawing on mouse or touch
    $("#canvas").drawTouch();
    $("#canvas").drawPointer();
    $("#canvas").drawMouse();
  }

  // prototype to	start drawing on touch using canvas moveTo and lineTo
  $.fn.drawTouch = function () {
    var start = function (e) {
      e = e.originalEvent;
      ctx.beginPath();
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY - 44;
      ctx.moveTo(x, y);
    };
    var move = function (e) {
      e.preventDefault();
      e = e.originalEvent;
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY - 44;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    $(this).on("touchstart", start);
    $(this).on("touchmove", move);
  };

  // prototype to	start drawing on pointer(microsoft ie) using canvas moveTo and lineTo
  $.fn.drawPointer = function () {
    var start = function (e) {
      e = e.originalEvent;
      ctx.beginPath();
      x = e.pageX;
      y = e.pageY - 44;
      ctx.moveTo(x, y);
    };
    var move = function (e) {
      e.preventDefault();
      e = e.originalEvent;
      x = e.pageX;
      y = e.pageY - 44;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    $(this).on("MSPointerDown", start);
    $(this).on("MSPointerMove", move);
  };

  // prototype to	start drawing on mouse using canvas moveTo and lineTo
  $.fn.drawMouse = function () {
    var clicked = 0;
    var start = function (e) {
      clicked = 1;
      ctx.beginPath();
      x = e.pageX;
      y = e.pageY - 44;
      ctx.moveTo(x, y);
    };
    var move = function (e) {
      if (clicked) {
        x = e.pageX;
        y = e.pageY - 44;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };
    var stop = function (e) {
      clicked = 0;
    };
    $(this).on("mousedown", start);
    $(this).on("mousemove", move);
    $(window).on("mouseup", stop);
  };

  // Start checking the accelerometer
  function startWatch() {
    // Update acceleration every 1 seconds
    var options = {frequency: 100};
    watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
  }

  // Stop checking the accelerometer
  function stopWatch() {
    if (watchID) {
      navigator.accelerometer.clearWatch(watchID);
      watchID = null;
    }
  }

  // onSuccess: draw line based on tilt and amount of tilt
  function onSuccess(acceleration) {
    // for debug purpose to print out accelerometer values
    var element = document.getElementById('debug');
    element.innerHTML = 'Acceleration X: ' + acceleration.x + '<br />' +
      'Acceleration Y: ' + acceleration.y + '<br />' +
      'Acceleration Z: ' + acceleration.z;

    // hide the accelerometer aka etch on/off button
    $("#etch").show();

    if (!etch) {
      $("#etchHelp").fadeIn();
      stopWatch();
      return;
    }

    // draw based on accelerometer positions
    if (acceleration.x > 2 && Math.abs(acceleration.y) < 2) {
      if (x < 3) {
        buzzDevice(1);
        x = 3;
      }
      x = x - Math.abs(acceleration.x);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (acceleration.x < -2 && Math.abs(acceleration.y) < 2) {
      if (x > $(window).width() - 3) {
        buzzDevice(2);
        x = $(window).width() - 3;
      }
      x = x + Math.abs(acceleration.x);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (acceleration.y > 2 && Math.abs(acceleration.x) < 2) {
      if (y > $(window).height() - 93) {
        buzzDevice(3);
        y = $(window).height() - 93;
      }
      y = y + Math.abs(acceleration.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (acceleration.y < -2 && Math.abs(acceleration.x) < 2) {
      if (y < 3) {
        buzzDevice(4);
        y = 3;
      }
      y = y - Math.abs(acceleration.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  // onError: Failed to get the acceleration
  function onError() {
    document.getElementById('debug').innerHTML = 'ERROR';
  }

  var position = 0;

  // vibrate and beep when edge of screen it hit while accelerometer drawing
  function buzzDevice(pos) {
    if (position !== pos) { // vibrate only once when boudary is reached at a position
      navigator.notification.vibrate(300);
      position = pos;
    }
  }

  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    },
    'touchmove' : function (e){
      e.preventDefault();
    }
  });

  Template.hello.onRendered(function () {


  });
  var isMobile;

  function isTouchDevice() {
    var el = document.createElement('div');
    el.setAttribute('ongesturestart', 'return;');
    return typeof el.ongesturestart === "function";
  }

  isMobile = isTouchDevice();
  if (window.addEventListener) {
    window.addEventListener('load', function () {
      var canvas, context, draw;

      // Touch Events handlers
      draw = {
        started: false,
        start: function (event) {

          context.beginPath();
          if (isMobile) {
            context.moveTo(
              event.targetTouches[0].pageX,
              event.targetTouches[0].pageY
            );
          } else {
            context.moveTo(
              event.pageX - this.offsetLeft,
              event.pageY - this.offsetTop
            );
          }
          this.started = true;

        },
        move: function (event) {

          if (this.started) {
            if (isMobile) {
              context.lineTo(
                event.targetTouches[0].pageX,
                event.targetTouches[0].pageY
              );
            } else {

              context.lineTo(
                event.pageX - this.offsetLeft,
                event.pageY - this.offsetTop
              );
            }
            context.stroke();
          }

        },
        end: function (event) {
          this.started = false;
        }
      };

      // Canvas & Context
      canvas = document.getElementById('pad');
      context = canvas.getContext('2d');

      // Full Window Size Canvas
      context.canvas.width = window.innerWidth;
      context.canvas.height = window.innerHeight;

      // Events
      canvas.addEventListener('touchstart', draw.start, false);
      canvas.addEventListener('touchend', draw.end, false);
      canvas.addEventListener('touchmove', draw.move, false);
      canvas.addEventListener('mousedown', draw.start, false);
      canvas.addEventListener('mousemove', draw.move, false);
      canvas.addEventListener('mouseup', draw.end, false);

    });		// Disable Page Move
    document.body.addEventListener('touchmove', function (e) {
      e.preventDefault();
    });
  }
}

