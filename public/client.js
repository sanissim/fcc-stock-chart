// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {

  var socket = io();  
  
  $(".modal").show();
  
  $.get('/quote', function(data){
    
    $(".modal").hide();
    
    var stockData = JSON.parse(data);

    drawChart(data);
    
    if (stockData[0] !== 0){
      for (var i=0; i<data.length; i++){
        $('#stocks').prepend("<div class='stock'><h5>" + stockData[i]["name"] + "</h5><div class='closebtn' id='" + stockData[i]["name"] + "'><p>x</p></div></div>");
      }
    }
    
    else {    
      $("<p id='error'>No tickers to display.</p>").hide().prependTo('#err-box').slideDown();    
    }
    
  });
  
  socket.on('new stock', function(msg){
    $("#chart").empty();
    $("#chart").html('<div class="modal"></div>')
    $(".modal").show();

    $.get('/quote', function(data){
      $('#error').remove(); 
      $("<div class='stock'><h5>" + msg + "</h5><div class='closebtn' id='" + msg + "'><p>x</p></div></div>").hide().prependTo('#stocks').slideDown();
      $(".modal").hide();
      drawChart(data);
      });
    });
  
  socket.on('delete stock', function(msg){
    
    $("#chart").empty();
    $("#chart").html('<div class="modal"></div>')
    $(".modal").show();
    
    var children = $("#stocks").children().length;
    
    if (children > 1){
      $.get('/quote', function(data){
        $('#error').remove(); 
        $("#" + msg).parent().remove();
        $(".modal").hide();
        drawChart(data);
      });
    }
    
    else {
      $("#" + msg).parent().remove();
      $(".modal").hide();
      $("<p id='error'>No tickers to display.</p>").hide().prependTo('#err-box').slideDown();
      drawChart(JSON.stringify([0,0]));
    }
    
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
