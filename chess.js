!function(ROOM_ID) {
  'use strict';
  //               0    1    2    3    4    5    6    7
  var START_B = [['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'], // 0
                 ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // 1
                 ['' , '' , '' , '' , '' , '' , '' , '' ], // 2
                 ['' , '' , '' , '' , '' , '' , '' , '' ], // 3
                 ['' , '' , '' , '' , '' , '' , '' , '' ], // 4
                 ['' , '' , '' , '' , '' , '' , '' , '' ], // 5
                 ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // 6
                 ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']]; // 7
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
  var black_can_castle;
  var white_can_castle;

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

  var threaten_list = function(a, b) {
    var ret = [];
    if (board[a][b] === 'P') {
      if (side[a][b] === 0) {
        if (board[a - 1][b] === '') {
          ret.push([a - 1, b]);
          if (a === 8 - 2 && board[a - 2][b] === '') {
            ret.push([a - 2, b]);
          }
        }
        for (i = b - 1; i <= b + 1; i += 2) {
          if (0 <= i && i < 8 && side[a - 1][i] === 1) {
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
          if (0 <= i && i < 8 && side[a + 1][i] === 0) {
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
          if (0 <= i && i < 8 && 0 <= j && j < 8
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
        if (0 <= a + m[0] && a + m[0] < 8 && 0 <= b + m[1] && b + m[1] < 8) {
          if (side[a][b] != side[a + m[0]][b + m[1]]) {
            ret.push([a + m[0], b + m[1]]);
          }
        }
      }
    }
    if (board[a][b] === 'R' || board[a][b] === 'Q') {
      for (var i = 1; i <= 8; i++) {
        if (a + i >= 8) {
          break;
        }
        if (side[a + i][b] === side[a][b]) {
          break;
        }
        ret.push([a + i, b]);
        if (board[a + i][b]) {
          break;
        }
      }
      for (var i = 1; i <= 8; i++) {
        if (a - i < 0) {
          break;
        }
        if (side[a - i][b] === side[a][b]) {
          break;
        }
        ret.push([a - i, b]);
        if (board[a - i][b]) {
          break;
        }
      }
      for (var i = 1; i <= 8; i++) {
        if (b + i >= 8) {
          break;
        }
        if (side[a][b + i] === side[a][b]) {
          break;
        }
        ret.push([a, b + i]);
        if (board[a][b + i]) {
          break;
        }
      }
      for (var i = 1; i <= 8; i++) {
        if (b - i < 0) {
          break;
        }
        if (side[a][b - i] === side[a][b]) {
          break;
        }
        ret.push([a, b - i]);
        if (board[a][b - i]) {
          break;
        }
      }
    }
    if (board[a][b] === 'B' || board[a][b] === 'Q') {
      var BISHOP_MOVES = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (var j = 0; j < BISHOP_MOVES.length; j++) {
        var m = BISHOP_MOVES[j];
        for (var i = 1; i <= 8; i++) {
          var na = a + m[0] * i;
          var nb = b + m[1] * i;
          if (!(0 <= na && na < 8 && 0 <= nb && nb < 8)) {
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

  var parseMove = function(m) {
    /* this is a basic variant, no checking yet */
    var a, b;
    [a, b] = m;

    if (a.length != 2 || b.length != 2) {
      sendMod('Your move is not on a legal square. Please try again.');
      return false;
    }
    var x = function(s) { return s.charCodeAt(0) - 'a'.charCodeAt(0) };
    var a1 = 8 - parseInt(a[1]);
    var a2 = x(a[0]);
    var b1 = 8 - parseInt(b[1]);
    var b2 = x(b[0]);

    if (a1 < 0 || b1 < 0 || a1 >= 8 || b1 >= 8
        || a2 < 0 || b2 < 0 || a2 >= 8 || b2 >= 8) {
      sendMod('Your move is not on a legal square. Please try again.');
      return false;
    }

    if (turn != side[a1][a2]) {
      sendMod('You cannot move your opponent\'s pieces. Please try again.');
      return false;
    }

    if (turn == 0 && white_can_castle){ // white castle
      if(a1 == 7 && a2 == 4){
        if(b1 == 7 && b2 == 6 && // white kingside castle
          board[7][7] == 'R' && board[7][6] == '' && board[7][5] == ''){
            board[7][6] = 'K'; side[7][6] = 0;
            board[7][5] = 'R'; side[7][5] = 0;
            board[7][4] = ''; side[7][4] = -1;
            board[7][8] = ''; side[7][8] = -1;
            white_can_castle = false;
            return true;
        }
        if(b1 == 7 && b2 == 2 && // white queenside castle
          board[7][0] == 'R' && board[7][1] == '' &&
          board[7][2] == '' && board[7][3] == ''){
            board[7][2] = 'K'; side[7][2] = 0;
            board[7][3] = 'R'; side[7][3] = 0;
            board[7][0] = ''; side[7][0] = -1;
            board[7][4] = ''; side[7][4] = -1;
            white_can_castle = false;
            return true;
        }
      }
    }

    if (turn == 0 && black_can_castle){ // black castle
      if(a1 == 0 && a2 == 4){
        if(b1 == 0 && b2 == 6 && // black kingside castle
          board[0][7] == 'R' && board[0][6] == '' && board[0][5] == ''){
            board[0][6] = 'K'; side[0][6] = 1;
            board[0][5] = 'R'; side[0][5] = 1;
            board[0][4] = ''; side[0][4] = -1;
            board[0][8] = ''; side[0][8] = -1;
            black_can_castle = false;
            return true;
        }
        if(b1 == 0 && b2 == 2 && // black queenside castle
          board[0][0] == 'R' && board[0][1] == '' &&
          board[0][2] == '' && board[0][3] == ''){
            board[0][2] = 'K'; side[0][2] = 1;
            board[0][3] = 'R'; side[0][3] = 1;
            board[0][0] = ''; side[0][0] = -1;
            board[0][1] = ''; side[0][1] = -1;
            board[0][4] = ''; side[0][4] = -1;
            black_can_castle = false;
            return true;
        }
      }
    }

    /* basic check that you can move the piece there by chess rules */
    var good = threaten_list(a1, a2);
    var inList = false;
    for (var i = 0; i < good.length; i++) {
      if (good[i][0] === b1 && good[i][1] === b2) {
        inList = true;
        break;
      }
    }
    if (!inList) {
      sendMod('That is an invalid move. Please try again.');
      return false;
    }

    board[b1][b2] = board[a1][a2];
    side[b1][b2] = side[a1][a2];
    board[a1][a2] = '';
    side[a1][a2] = -1;

    if (board[b1][b2] == 'P' && (b1 == 0 || b1 == 7)) {
      board[b1][b2] = 'Q';
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
    black_can_castle = true;
    white_can_castle = true;
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
