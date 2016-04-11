'use strict';
var ROOM_ID = 971;
var white = 'fz0718';
var black = 'eygmath';

function sendFEN(s) {
  x = 'http://www.gilith.com/chess/diagrams/?f=' + s.replace(/\//g, '%2F') + '&s=create';
  y = 'http://www.gilith.com/chess/diagrams/images/' + s.replace(/\//g, '_') + '.png';
  $('<iframe src="' + x + '">').appendTo('body').load(function() {
    $(this).remove();
    App.getWindow(971).doInput('[img]' + y + '[/img]');
  });
}
