!function(ROOM_ID) {
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
  };
  setInterval(function() {
    if (q.length > 0) _doInput(q.shift());
  }, 1100);

  var sendFEN = function(s) {
    /* this is the hacky API call */
    var x = 'http://www.gilith.com/chess/diagrams/?f=' + s.replace(/\//g, '%2F') + '&s=create';
    var y = 'http://www.gilith.com/chess/diagrams/images/' + s.replace(/\//g, '_') + '.png';
    $('<iframe src="' + x + '">').appendTo('body').load(function() {
      $(this).remove();
      w.doInput('[img]' + y + '[/img]');
    });
  };

  var sendBoard = function() {
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
  };

  var sendMod = function(s) {
    w.doInput('[b]{@chess} ' + s + '[/b]');
  };

  var parseMove = function(m) {
    /* this is a basic variant, no checking yet */
    var a, b;
    [a, b] = m;
    try {
      var x = function(s) { return s.charCodeAt(0) - 'a'.charCodeAt(0) };
      var a1 = 8 - parseInt(a[1]);
      var a2 = x(a[0]);
      var b1 = 8 - parseInt(b[1]);
      var b2 = x(b[0]);
      var good = threaten_list(board, a1, a2);
      var inList = false;
      for (var i = 0; i < good.length; i++) {
        if (good[i][0] === b1 && good[i][1] === b2) {
          inList = true;
        }
      }
      if (inList) {
        board[b1][b2] = board[a1][a2];
        side[b1][b2] = side[a1][a2];
        board[a1][a2] = '';
        side[a1][a2] = -1;
      } else { w.doInput("oops invalid move"); }
    } catch (err) {
      console.error(err);
      return false;
    }
    return true;
  };

  var nextTurn = function() {
    turn = 1 - turn;
    sendBoard();
  };

  var play = function(player1, player2) {
    var t = Math.floor(Math.random() * 2);
    white = [player1, player2][t];
    black = [player2, player1][t];
    turn = 0;
    board = $.extend(true, [], START_B);
    side = $.extend(true, [], START_S);
    playing = true;
    sendMod('The game has started. It is ' + white + '\'s turn.');
    sendBoard();
  };

  var stop = function() {
    playing = false;
    sendMod('The game has ended.');
  };
  
  var counter = function(start = 1, end = 8) {
    var c = start;
    var toReturn = [];
    while (c != end) {
      toReturn.push(c);
      c++;
    }
    return toReturn;
  };

  var threaten_list = function(board, a, b) {
    var ret = [];
    var size = 8;
    if (board[a][b] === 'P') {
      if (side[a][b] === 0) {
        if (board[a - 1][b] === '') {
          ret.push([a - 1, b]);
          if (a === size - 2 && board[a - 2][b] === '') {
            ret.push([a - 2, b]);
          }
        }
        for (i = b - 1; i <= b + 1; i += 2) {
          if (0 <= i && i < size && side[a - 1][i] === 1) {
            ret.push([a - 1, i]);
          }
        }
      } else {
        if (board[a + 1][b] === '') {
          ret.push([a + 1, b]);
          if (a === 1 && board[a + 2][b] === '') {
            ret.push([a + 2, b]);
          }
        }
        for (i = b - 1; i <= b + 1; i += 2) {
          if (0 <= i && i < size && side[a + 1][i] === 0) {
            ret.push([a + 1, i]);
          }
        }
      }
    }
    if (board[a][b] === 'K') {
      for (var i = a - 1; i <= a + 1; i++) {
        for (var j = b - 1; j <= b + 1; j++) {
          if (i === a && j === b) {
            continue;
          }
          if (0 <= i && i < size && 0 <= j && j < size
                  && side[i][j] !== side[a][b]) {
            ret.push([i, j]);
          }
        }
      }
    }
    if (board[a][b] === 'N') {
      var KNIGHT_MOVES = [[1, 2], [2, 1], [-1, 2], [-2, 1],
            [1, -2], [2, -1], [-1, -2], [-2, -1]];
      for (var i = 0; i < KNIGHT_MOVES.length; i++) {
        var m = KNIGHT_MOVES[i];
        if (0 <= a + m[0] && a + m[0] < size && 0 <= b + m[1] && b + m[1] < size) {
          if (side[a][b] != side[a + m[0]][b + m[1]]) {
            ret.push([a + m[0], b + m[1]]);
          }
        }
      }
    }
    if (board[a][b] === 'R' || board[a][b] === 'Q') {
      var c = counter();
      for (var j = 0; j < c.length; j++) {
        var i = c[j];
        if (a + i >= size) {
          break;
        }
        if (side[a + i][b] === side[a][b]) {
          break;
        }
        ret.push([a + i][b]);
        if (board[a + i][b] !== ' ') {
          break;
        }
      }
      for (var j = 0; j < c.length; j++) {
        var i = c[j];
        if (a - i < 0) {
          break;
        }
        if (side[a - i][b] === side[a][b]) {
          break;
        }
        ret.push([a - i][b]);
        if (board[a - i][b] !== ' ') {
          break;
        }
      }
      for (var j = 0; j < c.length; j++) {
        var i = c[j];
        if (b + i > size) {
          break;
        }
        if (side[a][b + i] === side[a][b]) {
          break;
        }
        ret.push([a][b + i]);
        if (board[a][b + i] !== ' ') {
          break;
        }
      }
      for (var j = 0; j < c.length; j++) {
        var i = c[j];
        if (b - i > size) {
          break;
        }
        if (side[a][b - i] === side[a][b]) {
          break;
        }
        ret.push([a][b - i]);
        if (board[a][b - i] !== ' ') {
          break;
        }
      }
    }
    if (board[a][b] === 'B' || board[a][b] === 'Q') {
      var BISHOP_MOVES = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (var j = 0; j < BISHOP_MOVES.length; j++) {
        var m = BISHOP_MOVES[j];
        var c = counter();
        for (var k = 0; k < c.length; k++) {
          var i = c[k];
          var na = a + m[0] * i;
          var nb = b + m[1] * i;
          if (!(0 <= na && na < size && 0 <= nb && nb < size)) {
            break;
          }
          if (side[na][nb] === side[a][b]) {
            break;
          }
          ret.push([na, nb]);
          if (board[na][nb] !== '') {
            break;
          }
        }
      }
    }
    return ret;
  };

  var _onPluginMessage = Classroom.socket.onPluginMessage;
  Classroom.socket.onPluginMessage = function onPluginMessage(payload) {
    if (payload['room-id'] == ROOM_ID && payload.message
        && payload.message.startsWith('@chess')) {
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
  };

}(971);
