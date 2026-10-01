/* Shared, authenticated participant connection. Facilitator controls are server-side. */
(function(){
  var connection=null, gameId='', room='';
  function get(){if(!connection)connection=new NaivashaRace.RaceConnection(gameId);return connection;}
  window.LIVE={
    setRoom:function(game,code){gameId=game;room=code;if(!connection)connection=new NaivashaRace.RaceConnection(game);},
    connection:function(){return get();},
    isLive:function(){return get().active();},
    join:async function(name,sector){return get().join({room:room,name:name,sector:sector});},
    publish:function(payload){if(payload.state)get().publish(payload.state);},
    withdraw:function(){get().stop();},
    watchControl:function(callback){get().onReset=function(team){callback(team.generation,team);};return function(){get().onReset=function(){};};},
    resume:function(){return get().resume();}
  };
})();
