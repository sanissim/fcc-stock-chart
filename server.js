// server.js

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var request = require('request');

var yahooFinance = require('yahoo-finance');

var MongoClient = require('mongodb').MongoClient;
const dbURL = process.env.DB;

var stocks = [];

app.use(express.static('public'));

app.get("/", function (request, response) {

  stocks = [];
  MongoClient.connect(dbURL, function(err, db) {
    if (err) throw err;
    db.collection("stocks").find({}, { _id: false }).toArray(function(err, result) {
      if (err) throw err;
      
      for (var i=0; i<result.length; i++){
        let x = i;
        stocks.push(result[x]["stock"]);
      }
      
      console.log(stocks);
      response.sendFile(__dirname + '/views/index.html');
      db.close();
    });
  });
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  socket.on('new stock', function(msg){
    
    console.log('submission: ' + msg);
    
    yahooFinance.quote({
      symbol: msg,
      modules: ["summaryDetail"]  // ex: ['price', 'summaryDetail']
      
    })
    .then(function (err, snapshot) {
     
      MongoClient.connect(dbURL, function(err, db) {
        if (err) throw err;
        var myobj = {stock: msg};
        db.collection("stocks").insertOne(myobj, function(err, res) {
          if (err) throw err;
          stocks.push(msg);
          console.log("1 document inserted", stocks);
          db.close();
          io.emit('new stock', msg);
        });
      });
 
    })
    .catch(function(error){
      console.log("error handled");
      socket.emit('bad ticker', msg)
    });
    
  });
  
  socket.on('delete stock', function(msg){
  
    console.log('deletion: ' + msg);
    
    MongoClient.connect(dbURL, function(err, db) {
      if (err) throw err;
      var myquery = { stock: msg };
      db.collection("stocks").deleteOne(myquery, function(err, obj) {
        if (err) throw err;
        var index = stocks.indexOf(msg);
        if (index > -1) {
          stocks.splice(index, 1);
        }
        console.log("1 document deleted", stocks);
        db.close();
        io.emit('delete stock', msg);
      });
    });
  
  })
  
});

app.get("/quote", function (request, response) { //move this to client
  
  var stockData = [];
  var dateObj = new Date();
  var today = dateObj.toISOString();
  var yearAgo = new Date(dateObj.getTime() - 31536000000);
  var closer = [];

  if (stocks.length < 1){
    response.end(JSON.stringify([0,0]))
  };
  
  for (var z=0; z<stocks.length; z++){
    stockData.push({name:stocks[z], data: []})
  }
    
  for (var y=0; y<stocks.length; y++){
      
    let counter = y;
    let stock = stocks[counter];
  
    yahooFinance.historical({

      symbol: stock, 
      from: yearAgo.toISOString(),
      to: today,

    }, function (err, quotes) {

      if (err){
        console.log(err);
        response.end("Encountered the following error: " + err);
      }

      closer.push(counter);      
      
      for (var i=0; i<quotes.length; i++){
        
        let x = i;
        var dayClose = [Date.parse(quotes[x].date), quotes[x].close];
        stockData[counter]["data"].unshift(dayClose);
        
        if (closer.length==stocks.length & (quotes.length-1)==(stockData[closer[closer.length-1]]["data"].length-1)){
          response.end(JSON.stringify(stockData));
          console.log("Completed GET request!", x, counter, (stockData[counter]["data"].length-1));
        }
      }
    }
    )}
});    

// listen for requests
server.listen(process.env.PORT);
