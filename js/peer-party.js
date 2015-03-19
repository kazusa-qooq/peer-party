// Generated by CoffeeScript 1.7.1
var PeerParty, log,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

log = console.log.bind(console, "%c%s", "color:blue;font-weight:bold;");

if (window) {
  window.log = log;
}

PeerParty = (function() {
  var Event;

  Event = (function() {
    function Event(key, option) {
      if (option == null) {
        option = {};
      }
      this.Event_constructor(key, false, true);
      $.extend(this, option);
    }

    createjs.extend(Event, createjs.Event);

    createjs.promote(Event, "Event");

    return Event;

  })();

  function PeerParty(option) {
    this.send = __bind(this.send, this);
    this.join = __bind(this.join, this);
    this.hold = __bind(this.hold, this);
    this.access = __bind(this.access, this);
    this.listen = __bind(this.listen, this);
    this.start = __bind(this.start, this);
    this.initConnection = __bind(this.initConnection, this);
    this.dispatch = __bind(this.dispatch, this);
    this.option = option;
    this.connectionMap = {};
  }

  PeerParty.prototype.dispatch = function(key, option) {
    return this.dispatchEvent(new Event(key, option));
  };

  PeerParty.prototype.initConnection = function(connection) {
    connection.on('open', (function(_this) {
      return function() {
        var broker_id, prevent;
        broker_id = connection.peer;
        log("Try to join: " + broker_id);
        prevent = _this.dispatch('before join', {
          connection: connection
        });
        if (prevent) {
          log("Broker ID[" + broker_id + "] is refused.");
          connection.close();
          return false;
        }
        _this.connectionMap[broker_id] = connection;
        return _this.dispatch('join', {
          connection: connection
        });
      };
    })(this));
    connection.on('data', (function(_this) {
      return function(data) {
        return _this.dispatch('recive', {
          connection: connection,
          data: data
        });
      };
    })(this));
    connection.on('close', (function(_this) {
      return function() {
        log("Close: " + connection.peer);
        if (!_this.connectionMap[connection.peer]) {
          return;
        }
        delete _this.connectionMap[connection.peer];
        return _this.dispatch('leave', {
          connection: connection
        });
      };
    })(this));
    return connection.on('error', (function(_this) {
      return function(err) {
        return _this.dispatch('error', {
          error: err
        });
      };
    })(this));
  };

  PeerParty.prototype.start = function(complete) {
    if (complete) {
      this.on('ready', complete);
    }
    this.peer = new Peer(this.option);
    this.peer.on('open', (function(_this) {
      return function(broker_id) {
        log("Peer Own Broker ID: " + broker_id);
        return _this.dispatch('ready', {
          brokerId: broker_id
        });
      };
    })(this));
    return this.peer.on('error', (function(_this) {
      return function(err) {
        return log("Error: [" + err + "]");
      };
    })(this));
  };

  PeerParty.prototype.listen = function() {
    log('Listen...');
    return this.peer.on('connection', (function(_this) {
      return function(connection) {
        log("Join request come from: " + connection.peer);
        return _this.initConnection(connection);
      };
    })(this));
  };

  PeerParty.prototype.access = function(target) {
    var connection;
    log("Try connect to: " + target);
    connection = this.peer.connect(target);
    return this.initConnection(connection);
  };

  PeerParty.prototype.hold = function() {
    return this.start((function(_this) {
      return function() {
        return _this.listen();
      };
    })(this));
  };

  PeerParty.prototype.join = function(target) {
    return this.start((function(_this) {
      return function() {
        return _this.access(target);
      };
    })(this));
  };

  PeerParty.prototype.send = function(data) {
    var broker_id, connection, _ref, _results;
    _ref = this.connectionMap;
    _results = [];
    for (broker_id in _ref) {
      connection = _ref[broker_id];
      log("Send to: " + connection.peer);
      log("Data: " + data);
      _results.push(connection.send(data));
    }
    return _results;
  };

  return PeerParty;

})();

createjs.EventDispatcher.initialize(PeerParty.prototype);

if (window) {
  window.PeerParty = PeerParty;
}