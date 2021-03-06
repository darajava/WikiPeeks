var wikiResponse = null;
var shadow = null;
var locale = document.location.href.match(/:\/\/(.*)\.wikipedia/i)[1];

$(document).ready( function() {
  peekElem = $('a').mouseover(function () {
    setupPeek($(this));
  });
});

function isArticleLink(link) {
  if (!link.startsWith('/wiki/'))
    return false;
  // don't show peek for main page
  if (link.indexOf('Main_Page') != -1)
    return false;
  // don't show peek for current page
  if (window.location.href.indexOf(link) != -1)
    return false;

  // don't show peeks for any of the wikipedia namespaces but article
  // https://en.wikipedia.org/wiki/Wikipedia:Namespace 
  var namespaces = [
    'talk',
    'user',
    'wikipedia',
    'file',
    'mediawiki',
    'template',
    'help',
    'category',
    'portal',
    'book',
    'draft',
    'education_program',
    'timedtext',
    'module',
    'gadget',
    'gadget_definition',
    'topic',
    'special',
    'media'
  ];

  for (var i = 0; i < namespaces.length; i++){
    if (link.toLowerCase().startsWith('/wiki/' + namespaces[i] + ":"))
      return false;
    if (link.toLowerCase().startsWith('/wiki/' + namespaces[i] + "_talk:"))
      return false;
  }

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
    wikiResponse = null;
  });
}

function showPeek(elem) {
  // don't bother if we don't have a response or one of title/description
  if (wikiResponse === null)
    return false;
  if (wikiResponse[0].length == 0)
    return false;
  if (wikiResponse[1].length == 0)
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
          background: rgba(246, 246, 246, 0.945);
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          border: 1px solid #ccc;
          bottom: 26px;
          color: black;
          content: attr(title);
          left: 20%;
          padding: 18px;
          position: absolute;
          width: 480px;
          z-index: 1000;
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
          display: -webkit-box;
          -webkit-line-clamp: 10;
          -webkit-box-orient: vertical; 
      }
    </style>
    <span class="wikiinfo">
      <div class="wikititle">${wikiResponse[0]}</div>
      <div class="wikitext">${wikiResponse[1]}</div>
    </span>`;

    var padding = 20;

    $('#wikipeek-host').css({ 
      position: "absolute",
      marginLeft: 0, marginTop: 0,
      top: elem.offset().top + padding, left: elem.offset().left
    });

    // Sucks, but it seems to be difficult to find the size of shadow elements
    var tipWidth = 518;
    var maxTipHeight = 226;
    
    var offscreenRight = $('#wikipeek-host').offset().left + tipWidth;
    var screenWidth = $(window).width();
    
    if (offscreenRight > screenWidth) {
      $('#wikipeek-host').css('left', $('#wikipeek-host').offset().left - (offscreenRight - screenWidth + padding));
    }
    if (maxTipHeight + document.body.scrollTop > $('#wikipeek-host').offset().top) {
      $('#wikipeek-host').css('top', $('#wikipeek-host').offset().top + maxTipHeight + elem.height() + padding);
    }
}

function hidePeek(elem) {
  elem.removeClass('wikitip');
  $('#wikipeek-host').remove();
}

function fetchPeek(link) {
  page = link.replace('/wiki/', '').replace(/#.*/, '');
  $.ajax({
    type: "GET",
    url: 'https://' + locale + '.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=' + page + '&callback=?&redirects=1',
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
