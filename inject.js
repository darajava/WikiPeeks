$(document).ready( function() {
  $('a').mouseover(function () {
    setupPeek();
  });
});


function setupPeek() {
  var timeout = setTimeout(function() {
    alert("PEEK");
  }, 1000);
  $('a').mouseout(function() {
    clearTimeout(timeout);
  });
}
