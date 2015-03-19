log = console.log.bind console
        ,"%c%s", "color:blue;font-weight:bold;"
if window then window.log = log

class PeerParty
  class Event
    constructor: (key, option={}) ->
      @Event_constructor key, false, true
      $.extend @, option
    createjs.extend Event, createjs.Event
    createjs.promote Event, "Event"
  
  constructor: (option) ->
    @option = option
    @connectionMap = {}
    
  dispatch: (key, option) =>
    @dispatchEvent new Event key, option 
    
  initConnection: (connection) =>
    connection.on 'open', =>
      broker_id = connection.peer
      log "Try to join: #{broker_id}"
      prevent = @dispatch 'before join', connection: connection
      if prevent
        log "Broker ID[#{broker_id}] is refused."
        connection.close()
        return false;
      @connectionMap[broker_id] = connection
      @dispatch 'join', connection: connection
      
    connection.on 'data', (data) =>
      @dispatch 'recive', 
        connection: connection
        data: data
      
    connection.on 'close', =>
      log "Close: #{connection.peer}"
      unless @connectionMap[connection.peer] then return
      delete @connectionMap[connection.peer]
      @dispatch 'leave', connection: connection
    
    connection.on 'error', (err)=>
      @dispatch 'error', error: err
  
  start: (complete) =>
    if complete then @on 'ready', complete
    @peer = new Peer @option
    @peer.on 'open', (broker_id) =>
      log "Peer Own Broker ID: #{broker_id}"
      @dispatch 'ready', brokerId: broker_id
    @peer.on 'error', (err) =>
      log "Error: [#{err}]"
      
  listen: =>
    log 'Listen...'
    @peer.on 'connection', (connection) =>
      log "Join request come from: #{connection.peer}"
      @initConnection connection
  
  access: (target) =>
    log "Try connect to: #{target}"
    connection = @peer.connect target
    @initConnection connection

  hold: => 
    @start => 
      @listen()
  
  join: (target) => 
    @start => 
      @access target
  
  send: (data) =>
    for broker_id, connection of @connectionMap
      log "Send to: #{connection.peer}"
      log "Data: #{data}"
      connection.send data

createjs.EventDispatcher.initialize PeerParty.prototype

if window then window.PeerParty = PeerParty

  
