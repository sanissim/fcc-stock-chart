// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {

  var socket = io();  
  
  $.get('/quote', function(data){
    
    var stockData = JSON.parse(data);

    drawChart(data);
        
    for (var i=0; i<data.length; i++){

      $('#stocks').prepend("<div class='stock'><h5>" + stockData[i]["name"] + "</h5><div class='closebtn' id='" + stockData[i]["name"] + "'><p>x</p></div></div>");

    }
    
  });
  
  socket.on('new stock', function(msg){
    $("<div class='stock'><h5>" + msg + "</h5><div class='closebtn' id='" + msg + "'><p>x</p></div></div>").hide().prependTo('#stocks').slideDown();
    $.get('/quote', function(data){
      drawChart(data);
      });
    });
  
  socket.on('delete stock', function(msg){
    $("#" + msg).parent().remove();
    $.get('/quote', function(data){
      drawChart(data);
    });
  });
  
  socket.on('bad ticker', function(msg){
    $("<p id='error'>Could not find data for this ticker.</p>").hide().prependTo('#err-box').slideDown();
  });
  
  $('form').submit(function(event) {
    
    event.preventDefault();
    var symbol = $('#entry').val();
    $('#error').remove() 

    if (symbol!==""){
      socket.emit('new stock', symbol);
      $('#entry').val('');
    }
    
    else {
    $("<p id='error'>Field cannot be empty.</p>").hide().prependTo('#err-box').slideDown();

    }
    
  });
  
  $('body').on('click', ".closebtn", function(){
    $('#error').remove(); 
    var id = $(this).attr("id");
    socket.emit('delete stock', id);
  })
  
  function drawChart(data){
    
      Highcharts.stockChart('chart', {
            
            credits: {
              enabled: false
            },
            responsive: {
            },
            chart: {
                spacingBottom: 3,
            },      
            rangeSelector: {
                selected: 1
            },
            title: {
                text: 'Stock Price Over Time'
            },
            tooltip: {
                    valueDecimals: 2
                },
            series: JSON.parse(data)
        });
  }
  
});
