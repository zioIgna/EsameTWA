const app = require("./backend/app");
const debug = require("debug")("node-angular");
const http = require("http");

var Rx = require("rxjs/Rx");

const normalizePort = val => {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
};

const onError = error => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.Server(app);    //ho cambiato il metodo da "createServer(app)" a Server(app)

// costanti aggiunte per supporto a socket.io:
const io = require("socket.io").listen(server);
let loggedUsers = app.loggedUsers; // contiene oggetti così formati: {email: ..., connectionId: ...}
let games = app.games;
let activePlayers = app.players;    // array di stringhe (emails)
// fin qui

// variabili inserite per implementare l'espunzione di utenti non più raggiungibili
var source = Rx.Observable.interval(120000);  // observable per chiedere di confermare presenza
var hot = source.publish();
hot.connect();
// observable per eliminare chi non ha confermato la presenza
var source2 = Rx.Observable.interval(480000).map(n => { // tempo doppio della richiesta presenza
  m = findDifference();
  return m; // si restituisce il numero di utenti non confermati e la loro lista
});
var hot2 = source2.publish();
hot2.connect();
let stillLogged = [];   // ci memorizzo le mail di utenti che hanno "confermato la presenza"
function findDifference(){
  let difference = [];
  let loggedUsersEmails = loggedUsers.map(user => {
    return user.email;
  });
  loggedUsersEmails.forEach(element => {
    if(!stillLogged.includes(element)){
      difference.push(element);
    };
  });
  let exceedingUsers = difference.length;
  let stillActivePlayers = [];
  if(exceedingUsers > 0){
    console.log('Prima dello splice, i loggedUsers sono: ', loggedUsers);
    difference.forEach(element => {
      if(activePlayers.includes(element)){
        stillActivePlayers.push(element);
      };
      let index = loggedUsers.map(user => {
        return user.email;
      }).indexOf(element);
      if(index > -1){
        loggedUsers.splice(index, 1);
        console.log('Dopo lo splice, i loggedUsers sono: ', loggedUsers);
      }
    });
  };
  stillLogged = [];
  data = {num: exceedingUsers, list: stillActivePlayers};
  return data;
};

//

server.on("error", onError);
server.on("listening", onListening);
server.listen(port, function () {
    console.log('listening on port ' + port);
  }
);

io.on('connection', function (socket) {
    const myId = socket.id; // aggiunto per implementare un collegamento utente-connessione
    let myServerBattle;   // per verificare se un utente si è disconnesso durante una battaglia
    console.log("Socket connected: " + myId);   // aggiunto per implementare un collegamento utente-connessione
    console.log("USER CONNECTED...");
    socket.on('logged user', function (datiConnessione){
        loggedUsers.push(datiConnessione);
        stillLogged.push(datiConnessione.email);  // per segnalare la presenza se loggato dopo il segnale
        io.emit('logged user', loggedUsers);
        io.to(myId).emit('private msg', {msg: 'this is for you ' + myId});  // comando di prova
        io.to(myId).emit('say hi');

        var subscription0 = hot.subscribe(
          x => console.log('Observer 1: onNext: %s', x),
          e => console.log('Observer 1: onError: %s', e),
          () => console.log('Observer 1: onCompleted')
        );
        
        var subscription1 = hot.subscribe(
          x => io.to(myId).emit('say hi')
        );

        var subscription2 = hot2.subscribe(
          x => {
            console.log('Rilevati  ' + x.num + ' exceedingUsers');
            if(x.num > 0){
              io.to(myId).emit('logged user', loggedUsers);
              x.list.forEach(element => io.to(myId).emit('abandoned battle', element));
            }
          },
          e => console.log('Error from the server: ', e),
          () => console.log('Values completed')
        );

    });

    socket.on('greetings', function (data){
      console.log(data + ' è ancora connesso');
      if(!stillLogged.includes(data)){
        stillLogged.push(data);
      }
      console.log('Questi utenti hanno confermato la presenza: ' + stillLogged);
    });

    socket.on('disconnect', function () {
      userDisconnect1();
      console.log('user disconnected');
    });

    socket.on('disconnect', function (){    // aggiunto per implementare un collegamento utente-connessione
        console.log("Socket disconnected: " +  myId);   // aggiunto per implementare un collegamento utente-connessione
    });

    socket.on('user loggedOut', function (datiConnessione) {
      userDisconnect1();
      console.log('user disconnected (loggedOut)');
    });

    socket.on('back to overview', function () {
      userAbandonedBattle();
      console.log('user has just abandoned battle');
    });

    socket.on('confirm abandoned battle', function (myBattle) {
      console.log('myBattle === myServerBattle: ' + JSON.stringify(myBattle) === JSON.stringify(myServerBattle));
      if(JSON.stringify(myBattle) === JSON.stringify(myServerBattle)) {
        myServerBattle = undefined;
      };
      userDisconnect2(myBattle);
    });

    socket.on('new user', function (obj) {
        console.log(obj.message);
        io.emit('new user', obj);
    });

    socket.on('deleted user', function (obj){
        console.log(obj.message);
        io.emit('deleted user');
    });

    socket.on('user updated', function (obj){
        console.log(obj.message);
        io.emit('user updated');
    });

    socket.on('new msg', function (obj){
        console.log(obj.message);
        io.emit('new msg');
    });

    socket.on('new game', function(email){
      games.push(email);
      io.emit('new game', games);
    });

    socket.on('start battle', function(players){
      activePlayers.push.apply(activePlayers, players.nowPlaying);
      myServerBattle = players.nowPlaying;
      console.log('ora questa è myServerBattle: ' + myServerBattle);
      const newCurrPlayer = Math.floor(Math.random() * 2);
      const updatedPlayers = {nowPlaying: players.nowPlaying, activePlayers: activePlayers, currPlayer: newCurrPlayer};
      io.emit('start battle', updatedPlayers);
    });

    socket.on('push myServerBattle', function(myBattle){  // forse questo non serve: già fatto in 'start battle' (?)
      myServerBattle = myBattle;
      console.log('ho appena pushato ' + myBattle + ' in myServerBattle: ' + myServerBattle);
    });

    socket.on('new ship', function (coordinates) {
      console.log('è stata posizionata una nave con queste coordinate: ' + JSON.stringify(coordinates));
      io.emit('new ship', coordinates);
    });

    socket.on('navy positioned', function(myBattle){
      io.emit('navy positioned', myBattle);
    });

    socket.on('hit', function (obj) {
      socket.broadcast.emit('hit', obj);
    });

    socket.on('miss', function(obj){
      socket.broadcast.emit('miss', obj);
    });

    socket.on('endGame', function (myBattle) {
      let myBattleCopy = [...myBattle];
      console.log('myBattle === myServerBattle: ' + JSON.stringify(myBattle) === JSON.stringify(myServerBattle));
      if(JSON.stringify(myBattle) === JSON.stringify(myServerBattle)) {
        myServerBattle = undefined;
      }
      const lunghezza = myBattleCopy.length;
      for (let i = 0; i < lunghezza; i++) {
        let val = myBattleCopy.pop();
        let index = activePlayers.indexOf(val);
        if (index > -1) {
          activePlayers.splice(index, 1);
        };
      };
      console.log('ora questi sono gli activePlayers: ' + activePlayers);
      let index = games.indexOf(myBattle[0]);
      games.splice(index, 1); // così elimino dall'elenco dei games il nome del "propositore" della partita terminata
      console.log('ora questi sono i games: ' + games);
      const updatedPlayers = { myBattle: myBattle, activePlayers: activePlayers, games: games};
      io.emit('endGame', updatedPlayers);
    });

    socket.on('switch player', function (myBattle) {
      socket.broadcast.emit('switch player', myBattle);
    });


    function userDisconnect1(){  // elimino da loggedUsers l'utente e verifico se stava giocando una partita
      let mySelf = loggedUsers.find(obj => obj.connectionId == myId);
      if(mySelf){
        loggedUsers.splice(loggedUsers.map(function(element) {return element.connectionId}).indexOf(myId), 1);
        io.emit('logged user', loggedUsers);
        // se utente stava giocando una partita (non terminata) avviso tutti gli utenti per rintracciare l'altro
        // giocatore della stessa partita: sarà lui a far partire la comunicazione che una partita è stata interrotta
        // e indicherà quali utenti eliminare dagli active players
        if(activePlayers.includes(mySelf.email)){
          console.log('Chi ha abbandonato stava giocando');
          io.emit('abandoned battle', mySelf.email);
        }
      }
    }

    function userAbandonedBattle(){
      let mySelf = loggedUsers.find(obj => obj.connectionId == myId);
      if(mySelf){
        // se utente stava giocando una partita (non terminata) avviso tutti gli utenti per rintracciare l'altro
        // giocatore della stessa partita: sarà lui a far partire la comunicazione che una partita è stata interrotta
        // e indicherà quali utenti eliminare dagli active players ma non lo elimino dai loggedPlayers!
        if(activePlayers.includes(mySelf.email)){
          console.log('Chi ha abbandonato stava giocando');
          io.emit('abandoned battle', mySelf.email);
        }
      }
    }

    function userDisconnect2(battle){
      console.log('fighterDisconnect triggered');
      let myBattleCopy = [...battle];
      const lunghezza = myBattleCopy.length;
      for (let i = 0; i < lunghezza; i++) {
        let val = myBattleCopy.pop();
        let index = activePlayers.indexOf(val);
        if (index > -1) {
          activePlayers.splice(index, 1);
        };
      };
      console.log('ora questi sono gli activePlayers: ' + activePlayers);
      console.log('ora questi sono i games: ' + games);
      const updatedPlayers = { myBattle: battle, activePlayers: activePlayers, games: games, playerDisconnected: true};
      io.emit('endGame', updatedPlayers);
      console.log('ora myServerBattle = ' + myServerBattle);
      myServerBattle = undefined;
      console.log('ora myServerBattle = ' + myServerBattle);
      io.emit('logged user', loggedUsers);
    };

});
