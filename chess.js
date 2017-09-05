/* Code for a chess game bot in the AoPS Classroom.
 * Authors: Eric Zhang and Jason Chen
 */

;(function(ROOM_ID) {
  'use strict';
  /*               0    1    2    3    4    5    6    7          */
  var START_B = [['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],  /* 0 */
                 ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  /* 1 */
                 ['' , '' , '' , '' , '' , '' , '' , '' ],  /* 2 */
                 ['' , '' , '' , '' , '' , '' , '' , '' ],  /* 3 */
                 ['' , '' , '' , '' , '' , '' , '' , '' ],  /* 4 */
                 ['' , '' , '' , '' , '' , '' , '' , '' ],  /* 5 */
                 ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  /* 6 */
                 ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']]; /* 7 */
  var START_S = [[ 1,  1,  1,  1,  1,  1,  1,  1],
                 [ 1,  1,  1,  1,  1,  1,  1,  1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [-1, -1, -1, -1, -1, -1, -1, -1],
                 [ 0,  0,  0,  0,  0,  0,  0,  0],
                 [ 0,  0,  0,  0,  0,  0,  0,  0]];

  var white, black;
  var turn;
  var board;
  var side;
  var playing;
  var black_can_castle, white_can_castle;
  var moved_white_rook, moved_black_rook;

  var q = [];
  var w = App.getWindow(ROOM_ID);

  var _doInput = w.doInput;
  w.doInput = function doInput(s) {
    q.push(s);
  };
  setInterval(function() {
    if (q.length === 0) return;
    var unique_str = q.shift();
    unique_str += '[color=transparent]' + new Date().toLocaleTimeString() + '[/color]';
    _doInput(unique_str);
  }, 1100);

  var sendFEN = function(s) {
    /* Hacky API call to an online FEN -> chess diagram service. */
    var poslink = 'http://www.gilith.com/chess/diagrams/?f=' + s.replace(/\//g, '%2F') + '&s=create';
    var imglink = 'http://www.gilith.com/chess/diagrams/images/' + s.replace(/\//g, '_') + '.png';
    $('<iframe src="' + poslink + '">').appendTo('body').load(function() {
      $(this).remove();
      w.doInput('[img]' + imglink + '[/img]');
    });
  };

  var sendBoard = function() {
    var fen = [];
    for (let i = 0; i < 8; ++i) {
      var c = [];
      var t = 0;
      for (let j = 0; j < 8; ++j) {
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
    w.doInput('[color=black][b]{@chess}[/b] ' + s + '[/color]');
  };

  var inBoard = function(a, b) {
    return 0 <= a && a < 8 && 0 <= b && b < 8;
  };

  var threatenList = function(a, b) {
    var ret = [];

    if (board[a][b] === 'P') {
      if (side[a][b] === 0) {
        if (board[a - 1][b] === '') {
          ret.push([a - 1, b]);
          if (a === 8 - 2 && board[a - 2][b] === '') {
            ret.push([a - 2, b]);
          }
        }
        for (let i = b - 1; i <= b + 1; i += 2) {
          if (0 <= i && i < 8 && side[a - 1][i] === 1) {
            ret.push([a - 1, i]);
          }
        }
      }
      else {
        if (board[a + 1][b] === '') {
          ret.push([a + 1, b]);
          if (a === 1 && board[a + 2][b] === '') {
            ret.push([a + 2, b]);
          }
        }
        for (let i = b - 1; i <= b + 1; i += 2) {
          if (0 <= i && i < 8 && side[a + 1][i] === 0) {
            ret.push([a + 1, i]);
          }
        }
      }
    }

    if (board[a][b] === 'K') {
      for (let i = a - 1; i <= a + 1; i++) {
        for (let j = b - 1; j <= b + 1; j++) {
          if (i === a && j === b) continue;
          if (inBoard(i, j) && side[i][j] !== side[a][b]) {
            ret.push([i, j]);
          }
        }
      }
    }

    if (board[a][b] === 'N') {
      var KNIGHT_MOVES = [[1, 2], [2, 1], [-1, 2], [-2, 1],
                          [1, -2], [2, -1], [-1, -2], [-2, -1]];
      for (let i = 0; i < KNIGHT_MOVES.length; i++) {
        let m = KNIGHT_MOVES[i];
        if (inBoard(a + m[0], b + m[1])) {
          if (side[a][b] != side[a + m[0]][b + m[1]]) {
            ret.push([a + m[0], b + m[1]]);
          }
        }
      }
    }

    if (board[a][b] === 'R' || board[a][b] === 'Q') {
      var ROOK_MOVES = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (let j = 0; j < ROOK_MOVES.length; j++) {
        let m = ROOK_MOVES[j];
        for (let i = 1; i <= 8; i++) {
          let na = a + m[0] * i;
          let nb = b + m[1] * i;
          if (!inBoard(na, nb)) break;
          if (side[na][nb] === side[a][b]) break;
          ret.push([na, nb]);
          if (board[na][nb] !== '') break;
        }
      }
    }

    if (board[a][b] === 'B' || board[a][b] === 'Q') {
      var BISHOP_MOVES = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (let j = 0; j < BISHOP_MOVES.length; j++) {
        let m = BISHOP_MOVES[j];
        for (let i = 1; i <= 8; i++) {
          let na = a + m[0] * i;
          let nb = b + m[1] * i;
          if (!inBoard(na, nb)) break;
          if (side[na][nb] === side[a][b]) break;
          ret.push([na, nb]);
          if (board[na][nb] !== '') break;
        }
      }
    }

    return ret;
  };

  var isThreatened = function(a, b) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (side[i][j] != turn) {
          var threatened = false;
          for (let x of threatenList(i, j)) {
            if (x[0] === a && x[1] === b) {
              threatened = true;
            }
          }
          if (threatened) {
            return true;
          }
        }
      }
    }
    return false;
  };

  var parseSquare = function(square) {
    /* Example of usage: parseSquare('a7') -> [1, 0] */
    var squareRegex = /^[a-h][1-8]$/;
    if (squareRegex.test(square)) {
      var i = 8 - parseInt(square[1]);
      var j = square.charCodeAt(0) - 'a'.charCodeAt(0);
      return [i, j];
    }
    else {
      return undefined;
    }
  };

  var parseMove = function(m) {
    /* Example of usage: parseMove(['a7', 'a6']) -> [[1, 0], [2, 0]] */
    if (m.length != 2) return undefined;
    var a = parseSquare(m[0]);
    var b = parseSquare(m[1]);
    if (a && b) return [a, b];
    else return undefined;
  };

  var doMove = function(move) {
    move = parseMove(move);
    if (!move) {
      sendMod('Your move is not on a legal square. Please try again.');
      return false;
    }

    var [[a1, a2], [b1, b2]] = move;

    if (!inBoard(a1, b1) || !inBoard(a2, b2)) {
      sendMod('Your move is not on a legal square. Please try again.');
      return false;
    }

    if (turn != side[a1][a2]) {
      sendMod('You cannot move your opponent\'s piece. Please try again.');
      return false;
    }

    /* White castle */
    if (turn === 0 && white_can_castle) {
      if (a1 === 7 && a2 === 4 && board[7][4] === 'K' && side[7][4] === 0) {
        /* White kingside castle */
        if (!moved_white_rook[0] && b1 === 7 && b2 === 6 &&
            board[7][7] === 'R' && board[7][6] === '' && board[7][5] === '') {
          if (!isThreatened(7, 4) && !isThreatened(7, 5) && !isThreatened(7, 6)) {
            board[7][6] = 'K'; side[7][6] = 0;
            board[7][5] = 'R'; side[7][5] = 0;
            board[7][4] = ''; side[7][4] = -1;
            board[7][7] = ''; side[7][7] = -1;
            white_can_castle = false;
            return true;
          }
        }
        /* White queenside castle */
        if (!moved_white_rook[1] && b1 === 7 && b2 === 2 &&
            board[7][0] === 'R' && board[7][1] === '' &&
            board[7][2] === '' && board[7][3] === '') {
          if (!isThreatened(7, 4) && !isThreatened(7, 3) && !isThreatened(7, 2)) {
            board[7][2] = 'K'; side[7][2] = 0;
            board[7][3] = 'R'; side[7][3] = 0;
            board[7][0] = ''; side[7][0] = -1;
            board[7][4] = ''; side[7][4] = -1;
            white_can_castle = false;
            return true;
          }
        }
      }
    }

    /* Black castle */
    if (turn === 1 && black_can_castle) {
      if (a1 === 0 && a2 === 4 && board[0][4] === 'K' && side[0][4] === 1) {
        /* Black kingside castle */
        if (!moved_black_rook[0] && b1 === 0 && b2 === 6 &&
            board[0][7] === 'R' && board[0][6] === '' && board[0][5] === '') {
          if (!isThreatened(0, 4) && !isThreatened(0, 5) && !isThreatened(0, 6)) {
            board[0][6] = 'K'; side[0][6] = 1;
            board[0][5] = 'R'; side[0][5] = 1;
            board[0][4] = ''; side[0][4] = -1;
            board[0][7] = ''; side[0][7] = -1;
            black_can_castle = false;
            return true;
          }
        }
        /* Black queenside castle */
        if (!moved_black_rook[1] && b1 === 0 && b2 === 2 &&
            board[0][0] === 'R' && board[0][1] === '' &&
            board[0][2] === '' && board[0][3] === '') {
          if (!isThreatened(0, 4) && !isThreatened(0, 3) && !isThreatened(0, 2)) {
            board[0][2] = 'K'; side[0][2] = 1;
            board[0][3] = 'R'; side[0][3] = 1;
            board[0][0] = ''; side[0][0] = -1;
            board[0][4] = ''; side[0][4] = -1;
            black_can_castle = false;
            return true;
          }
        }
      }
    }

    /* Check that you can move the piece in that direction via. basic chess rules */
    var good = threatenList(a1, a2);
    var inList = false;
    for (let i = 0; i < good.length; i++) {
      if (good[i][0] === b1 && good[i][1] === b2) {
        inList = true;
        break;
      }
    }
    if (!inList) {
      sendMod('That is an invalid move. Please try again.');
      return false;
    }

    /* Make the move */
    var prev = board[b1][b2];
    var prev_side = side[b1][b2];

    board[b1][b2] = board[a1][a2];
    side[b1][b2] = side[a1][a2];
    board[a1][a2] = '';
    side[a1][a2] = -1;

    /* Make sure that we don't aren't in check after the move */
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        /* Find our king */
        if (board[i][j] != 'K' || side[i][j] != turn)
          continue;

        if (isThreatened(i, j)) {
          board[a1][a2] = board[b1][b2];
          side[a1][a2] = side[b1][b2];
          board[b1][b2] = prev;
          side[b1][b2] = prev_side;
          sendMod('You cannot move yourself into check. Please try again.');
          return false;
        }
      }
    }

    /* State updates after the move has been finalized */
    if (board[b1][b2] === 'K') {
      if (turn === 0) white_can_castle = false;
      if (turn === 1) black_can_castle = false;
    }

    if (a2 === 7 && a1 == 7) moved_white_rook[0] = true;
    if (a2 === 0 && a1 == 7) moved_white_rook[1] = true;
    if (a2 === 7 && a1 == 0) moved_black_rook[0] = true;
    if (a2 === 0 && a1 == 0) moved_black_rook[1] = true;

    if (board[b1][b2] === 'P' && (b1 === 0 || b1 === 7)) {
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
    moved_white_rook = [false, false];
    moved_black_rook = [false, false];
    board = $.extend(true, [], START_B);
    side = $.extend(true, [], START_S);
    playing = true;
    sendMod('The game has started. It is ' + white + '\'s turn.');
    sendBoard();
  };

  var stop = function(winner) {
    playing = false;
    sendMod('The game has ended.');
    if (winner) {
      sendMod('Congrats to the winner, [u]' + winner + '[/u].');
    }
  };

  var _onPluginMessage = Classroom.socket.onPluginMessage;
  Classroom.socket.onPluginMessage = function onPluginMessage(payload) {
    if (payload['room-id'] == ROOM_ID && payload.message &&
        payload.message.startsWith('@chess')) {
      var x = payload.message.split('<')[0].split(' ');
      if (playing) {
        var speakerId = -1;
        if (payload.speaker === white) speakerId = 0;
        if (payload.speaker === black && (speakerId === -1 || turn === 1)) speakerId = 1;

        if (speakerId === -1) {
          sendMod(payload.speaker + ' is not currently playing and cannot make a move.');
        }
        else {
          if (x[1] === 'stop') {
            stop();
          }
          else if (speakerId === turn) {
            var move = x.slice(1);
            if (doMove(move)) {
              nextTurn();
            }
          }
          else {
            sendMod('Usage when playing: @chess e2 e4; @chess stop.');
          }
        }
      }
      else {
        if (x[1] === 'play' && x[2]) {
          play(payload.speaker, x[2]);
        }
        else {
          sendMod('Usage: @chess play <username>.');
        }
      }
    }
    _onPluginMessage(payload);
  };

})(prompt('What room ID to use?').toLowerCase());
