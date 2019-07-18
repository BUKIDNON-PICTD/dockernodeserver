var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.post('/', function (req, res) {
  io.emit('message', {
    clientid: "SERVER",
    message: "OLA!"
  });
  res.send('Got a POST request');
})

let connectedClients = { };
var numClients = 0;
let clientList = []; 

io.on('connection', function(socket){
  var addedClient = false;
  // console.log('a user connected');
  socket.on('message', (data) => {
    console.log("message from " + data.clientid +" : "+ data.message);
  });

  socket.on('clientcheckin', function(clientid){
    if (addedClient) return;

    socket.clientid=clientid;
    ++numClients;
    addedClient = true;
    connectedClients = addClient(connectedClients,socket);
    clientList.push(clientid);
    console.log(socket.clientid + ' is ONLINE');
    socket.emit('login', {
      numClients: numClients
    });

    socket.broadcast.emit('clientonline', {
      clientList: clientList,
      clientname: socket.clientid,
      numClients: numClients
    });
  });

  socket.on('disconnect', () => {
    if (addedClient) {
      --numClients;
      console.log(socket.clientid + ' is OFFLINE');
      clientsConnected = removeClient(connectedClients, socket.clientid);
      clientList.splice( clientList.indexOf(socket.clientid), 1 );
      socket.broadcast.emit('clientoffline', {
        clientList: clientList,
        clientid: socket.clientid,
        numClients: numClients
      });
    }
  });
});


http.listen(process.env.PORT || 9000, process.env.IP || "0.0.0.0", function(){
  var addr = http.address();
  console.log("Running Panganud Server at ", addr.address + ":" + addr.port);
});

function addClient(clientList, socket){
  let newList = Object.assign({}, clientList)
  newList[socket.clientid] = socket
  return newList
}

function removeClient(clientList, clientid){
  let newList = Object.assign({}, clientList)
  delete newList[clientid]
  return newList
}