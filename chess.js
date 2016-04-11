(function(ROOM_ID) {
  'use strict';
  var START_B = [['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
                 ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                 ['' , '' , '' , '' , '' , '' , '' , '' ],
                 ['' , '' , '' , '' , '' , '' , '' , '' ],
                 ['' , '' , '' , '' , '' , '' , '' , '' ],
                 ['' , '' , '' , '' , '' , '' , '' , '' ],
                 ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                 ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']];
  var START_S = [[1, 1, 1, 1, 1, 1, 1, 1],
                 [1, 1, 1, 1, 1, 1, 1, 1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [0, 0, 0, 0, 0, 0, 0, 0],
                 [0, 0, 0, 0, 0, 0, 0, 0]];

  var white;
  var black;
  var turn;
  var board;
  var side;
  var playing;

  var q = [];
  var w = App.getWindow(ROOM_ID);

  var _doInput = w.doInput;
  w.doInput = function doInput(s) {
    q.push(s);
  }
  setInterval(function() {
    if (q.length > 0) _doInput(q.shift());
  }, 1100);

  var _onPluginMessage = Classroom.socket.onPluginMessage;
  Classroom.socket.onPluginMessage = function(payload) {
    if (payload.message && payload.message.startsWith('@chess')) {
      var x = payload.message.split(' ');
      if (playing) {
        if ((payload.speaker === white || payload.speaker === black)
            && x[1] === 'stop') {
          stop();
        }
        else if ((payload.speaker === white && turn === 0) ||
            (payload.speaker === black && turn === 1)) {
          var r = parseMove(x.slice(1));
          if (r) {
            nextTurn();
          }
        }
        else {
          console.log('WRONG TURN OR ACTION: ' + payload.speaker);
        }
      }
      else {
        if (x[1] === 'play' && x[2]) {
          play(payload.speaker, x[2]);
        }
      }
    }
    _onPluginMessage(payload);
  }

  function sendFEN(s) {
    var x = 'http://www.gilith.com/chess/diagrams/?f=' + s.replace(/\//g, '%2F') + '&s=create';
    var y = 'http://www.gilith.com/chess/diagrams/images/' + s.replace(/\//g, '_') + '.png';
    $('<iframe src="' + x + '">').appendTo('body').load(function() {
      $(this).remove();
      w.doInput('[img]' + y + '[/img]');
    });
  }

  function sendBoard() {
    var fen = [];
    for (var i = 0; i < 8; ++i) {
      var c = [];
      var t = 0;
      for (var j = 0; j < 8; ++j) {
        if (board[i][j]) {
          if (t) {
            c.push(t); 
            t = 0;
          }
          c.push(side[i][j] ? board[i][j].toLowerCase() : board[i][j]);
        }
        else {
          ++t;
        }
      }
      if (t) c.push(t);
      fen.push(c.join(''));
    }
    sendFEN(fen.join('/'));
  }

  function sendMod(s) {
    w.doInput('[b]{@chess} ' + s + '[/b]');
  }

  function parseMove(m) {
    /* this is a basic variant, no checking yet */
    var a, b;
    [a, b] = m;
    try {
      var x = function(s) { return s.charCodeAt(0) - 'a'.charCodeAt(0) }
      var a1 = 8 - parseInt(a[1]);
      var a2 = x(a[0]);
      var b1 = 8 - parseInt(b[1]);
      var b2 = x(b[0]);
      board[b1][b2] = board[a1][a2];
      side[b1][b2] = side[a1][a2];
      board[a1][a2] = '';
      side[a1][a2] = -1;
    }
    catch (err) {
      console.error(err);
      return false;
    }
    return true;
  }

  function nextTurn() {
    turn = 1 - turn;
    sendBoard();
  }

  function play(player1, player2) {
    var t = Math.floor(Math.random() * 2);
    white = [player1, player2][t];
    black = [player2, player1][t];
    turn = 0;
    board = $.extend(true, [], START_B);
    side = $.extend(true, [], START_S);
    playing = true;
    sendMod('The game has started. It is ' + white + '\'s turn.');
    sendBoard();
  }

  function stop() {
    playing = false;
    sendMod('The game has ended.');
  }

})(971);
