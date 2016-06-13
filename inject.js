var wikiResponse = false;
var shadow = null;

$(document).ready( function() {
  peekElem = 
  $('a').mouseover(function () {
    setupPeek($(this));
  });
});

function isArticleLink(link) {
  if (!link.startsWith('/wiki/'))
    return false;
  // We don't want any `Talk:` pages etc
  // Also if we're gonna be using this dirty hack, we gotta include 2001: A Space Odyssey...
  if (link.indexOf(':') > -1 && link.indexOf('2001:') == -1)
    return false;
  return true;
}

function setupPeek(elem) {
  if (!isArticleLink(elem.attr('href')))
    return;
  elem.removeAttr('title');
  
  // Get the data we need and stuff it into a HTML element as quick as we can
  fetchPeek(elem.attr('href'));
  
  var timeout = setTimeout(function() {
    showPeek(elem);
  }, 500);

  $('a').mouseout(function() {
    clearTimeout(timeout);
    hidePeek(elem);
    wikiResponse = false;
  });
}

function showPeek(elem) {
  if (wikiResponse === false)
    return false;
  
  elem.append('<span class="wikitip"></span>')
  // Insert node after the body so that it will always be on top
  $('body').after('<div id="wikipeek-host"></div>');

  // Using DOM shadowing cause I'm just fucking 1337 like that...
  // ...also this is the way Google made their dictionary extension
  var shadow = $('#wikipeek-host')[0].createShadowRoot();
  shadow.innerHTML = `
    <style>
      .wikiinfo{
          background: rgba(245, 245, 255, 0.96);
          border-radius: 5px;
          border: 1px solid #ccc;
          bottom: 26px;
          color: black;
          content: attr(title);
          left: 20%;
          padding: 18px;
          position: absolute;
          width: 480px;
      }

      .wikiinfo .wikititle{
          font-family: "Linux Libertine",Georgia,Times,serif;
          line-height: 1.3;
          margin-bottom: 14px;
          padding: 0;
          padding-bottom: 7px;
          width: 100%;
          border-bottom: 1px solid #aaa;
          font-size: 22px;
      }

      .wikiinfo .wikitext{
          max-height: 140px;
          font-size: 12px;
          overflow: hidden;
      }
    </style>
    <span class="wikiinfo">
      <div class="wikititle">${wikiResponse[0]}</div>
      <div class="wikitext">${wikiResponse[1]}</div>
    </span>`;

    $('#wikipeek-host').css({ 
      position: "absolute",
      marginLeft: 0, marginTop: 0,
      top: elem.offset().top + 20, left: elem.offset().left
    });

    // Sucks, but it seems to be difficult to find the width of shadow elements
    // This is the width of the tooltip + the padding
    var tipWidth = 518;
    var offscreenRight = $('#wikipeek-host').offset().left + tipWidth;
    var screenWidth = $(window).width();
console.log($('#wikipeek-host').outerWidth());
console.log(offscreenRight);
console.log(screenWidth);
    if (offscreenRight > screenWidth) {
      $('#wikipeek-host').css('left', $('#wikipeek-host').offset().left - (offscreenRight - screenWidth));
    }
}

function hidePeek(elem) {
  elem.removeClass('wikitip');
  $('#wikipeek-host').remove();
}

function fetchPeek(link) {
  page = link.replace('/wiki/', '');
  $.ajax({
    type: "GET",
    // Make this work for whatever language you're currently on
    // TODO
    url: 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=' + page + '&callback=?&redirects=1',
    contentType: "application/json; charset=utf-8", 
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
      wikiResponse = [JSON.flatten(data)['title'], JSON.flatten(data)['extract']];
    },
    error: function (errorMessage) {
    }
  });
}

// Adapted from http://stackoverflow.com/q/19098797
JSON.flatten = function(data) {
  var result = {};
  function recurse (cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
    for(var i=0, l=cur.length; i<l; i++)
      recurse(cur[i], prop + "[" + i + "]");
    if (l == 0)
      result[prop] = [];
    } else {
      var isEmpty = true;
    for (var p in cur) {
      isEmpty = false;
      recurse(cur[p], p);
    }
    if (isEmpty && prop)
      result[prop] = {};
    }
  }
  recurse(data, "");
  return result;
}
