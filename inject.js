var wikiResponse = false;

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
  }, 1000);

  $('a').mouseout(function() {
    clearTimeout(timeout);
    hidePeek(elem);
    wikiResponse = false;
  });
}

function showPeek(elem) {
  elem.addClass('wikitip');
  elem.append('<span class="wikiinfo"><span class="wikititle"></span><span class="wikitext"></span></span>');
}

function hidePeek(elem) {
  elem.removeClass('wikitip');
  elem.find('.wikiinfo').remove();
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
      console.log(wikiResponse);
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
