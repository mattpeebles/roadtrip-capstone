'use strict';

// State

  //destination variables
var destinations = [];

var dates = [];

var addDestCounter = 1;

var leg = [];

var legDates = [];

var legCounter = 0;

var legData  = {
                startPoint: {geocode: {},
                            weather: {}
                           },
                endPoint: {geocode: {},
                          weather: {}
                         },
                         //FUTURE FUNCTIONALITY
               // midPoint: {geocode: {},
               //            weather: {}
               //            },

               // "point0.25": {geocode: {},
               //            weather: {}
               //           },
               // "point0.75": {geocode: {},
               //            weather: {}
               //           },
               //  "startToEnd": {distance: null,
               //                  time: null},
               //  "startTo0.25": {distance: null,
               //                  time: null },
               //  "point0.25ToMid": {distance: null,
               //                  time: null },
               //  "midTo0.75": {distance: null,
               //                  time: null },
               //  "Point0.75ToEnd": {distance: null,
               //                  time: null },
              };


  //events variables
var eventsList = [];

var viewedEvents = [];

var justViewedEvent = [];

var pageCount = 1;

var eventPages = {};



// State Manipulation Section

  // grabs all user inputted destinations and pushes
  //them to the destinations array
function getDestinations(){
  destinations = [];
  $("#destination-form .js-destination").each(function(){
    destinations.push($(this).val());
  }); //initiates initial leg of the journey
}

  // grabs first date and based on that calculates all
  //subsequent dates based on length of time user inputs
  //MAY NEED TO ADD FUNCTIONALITY TO ACCOUNT FOR DRIVE TIME
  //ALL NEED TO UPDATE HTML TO MAKE IT CLEAR HOW DATES ARE 
  //CALCULATED
function getDates(){
  dates = [];
  var datesIndex = 0;
  var startDate = document.getElementById("start-date").value;
  dates.push(startDate);
  $("#destination-form .length").each(function(){
    var dtstr = dates[datesIndex]; //grabs last date in the array to calculate next date
    var timeDate = new Date(dtstr.split("-").join("-")).getTime(); //this gets the last date's exact time in seconds
    var length = $(this).val().toLowerCase().replace(/ /g,''); //this grabs the length the user inputted
    if (length.indexOf("d") != -1){ //if user enters day or days, catches and converts to number
        var length = length.substring(0, length.indexOf("d"))
    }

    else if (length.indexOf("w") != -1){ //if user enters week or weeks, catches, converts to number, and converts to days
      var week = length.substring(0, length.indexOf("w"))
      var length = parseInt(week) * 7;
    }
    var newDate = new Date(timeDate+(length*24*60*60*1000)) //this calculates the new date based on the old date's exact time by adding the number of seconds in the length
    var isoDate = newDate.toISOString(); //this converts it to ISO8601 as eventbrite requires
    var localDate = isoDate.split('T')[0] //this removes the UTC timezone, will add it in the api call back manually
    dates.push(localDate); //this pushes the calculated date in the yyyy-mm-dd format
    datesIndex++; //this increments the dates index so the most recently pushed date becomes the last one to calculate the next leg.
  })
}

  //this function gets the leg of the journey and the dates associated with it.
  //it will always be two destinations
  //this will be called once we start navigating
function getLeg(){
  leg = [destinations[legCounter], destinations[legCounter + 1]];
  legDates = [dates[legCounter], dates[legCounter +1]];
  
    var dateArray0 = legDates[0].split("-")
    var year0 = dateArray0[0]
    var month0 = dateArray0[1]
    var day0 = dateArray0[2]
    var americanDateLeg0 = month0 + "/" + day0 + "/" + year0;

    var dateArray1 = legDates[1].split("-")
    var year1 = dateArray1[0]
    var month1 = dateArray1[1]
    var day1 = dateArray1[2]
    var americanDateLeg1 = month1 + "/" + day1 + "/" + year1;



  var resultLegTitleHTML = "<div id=\"leg-title\">" +
                      "<p><span class=\"bold\">Destination:</span> " + leg[1] + "</p>"+
                      "<p><span class=\"bold\">Dates: </span>" + americanDateLeg0 + " to " + americanDateLeg1 + "</p>"
                    "</div>"
  $("#leg-title-container").empty();
  $("#leg-title-container").append(resultLegTitleHTML);

  var resultEventTitleHTML =  "<div id=\"event-title\">" +
                              "<p id=\"event-title-header\">Events" + "</p>" +
                              "<p id=\"event-title-loc\">" + leg[1] + "</p>" +
                              "</div>"
  $("#event-title-container").empty();
  $("#event-title-container").append(resultEventTitleHTML);
}

  //provides the formula to calculate the rough distance between two different geocoordinates 
  //this is extraneous right now. may be useful when I do weather
  //between points to give the user context about the distance
  //between the weather calls i.e. you'll have rain for approximately
  //the first 30 miles of your journey
function calcDistance(lat1, lon1, lat2, lon2){
  var R = 6371; 
  var φ1 = lat1 * (Math.PI / 180);
  var φ2 = lat2 * (Math.PI / 180);
  var Δφ = (lat2-lat1) * (Math.PI / 180);
  var Δλ = (lon2-lon1) * (Math.PI / 180);

  var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  var d = R * c;

  var miles = d * 0.621371
}

  //this calculates the distance between two different geocoordinates
function calcAllDistance(){ //make this less complicated
  calcDistance(legData["startPoint"]["geocode"]["lat"], legData["startPoint"]["geocode"]["lng"], 
               legData["endPoint"]["geocode"]["lat"], legData["endPoint"]["geocode"]["lng"]);
}


// DOM Manipulation
var destIds = [];
  
  //creates label for each new destination and ensures that the
  //label has the proper order each time
function updateDestLabel(){
  destIds.forEach(function(item){ //loops through all destIDs which consists of "destination-x" where x is a number 
    var jqueryItem = "#" + item //initiates variable to use destIDs in jquery
    var parentDiv = $(jqueryItem).parent() //grabs the parent of the label which is the city-input div
    var parentContainer = $(parentDiv).parent(); //grabs the parent of the city-input div which is the dest-container div
    var location = $(parentContainer).index(this); //calculates it's position in relation to its siblings
    var tarLabel = "#label-" + item; //creates new label text
    $(tarLabel).text(''); //removes prior label text if it existed
    $(tarLabel).text("Sight " + (location)); //sets label to it's current location. Because the start position will always be at position 1, we account for that by subtracting 1
  })
}

  // adds new destination input area in form
function addDest(){
  $("#destination-form").on("click", ".js-addDest", function(event){
    event.preventDefault();
    var newDestForm = "<div class=\"dest-container row\">"+
                        "<div class=\"city-input col-xs-4\">" +
                          "<label id=\"label-destination-" + addDestCounter + "\"></label>"+
                          "<input type=\"text\" name=\"dest-" + addDestCounter + "\" id = \"destination-" + addDestCounter + "\" class=\"js-destination\" placeholder=\"Destination\" required>" + 
                        "</div>" +
                        "<div class=\"date-input col-xs-5\">" +
                          "<label>Staying For</label>" +
                          "<input type=\"text\" name=\"Dest-" + addDestCounter + "-date\" class=\"length\" id=\"length-destination-" + addDestCounter + "\" placeholder=\"3 days\" required>" + 
                        "</div>" +
                        "<div class=\"dest-nav-button col-xs-3\">" +
                          "<div class=\"btn js-addDest\"><span class=\"glyphicon glyphicon-plus\" aria-hidden=\"true\"></span></div>" +
                          "<div class=\"btn js-removeDest\"><span class=\"glyphicon glyphicon-minus\" aria-hidden=\"true\"></div>" +
                        "</div>" +
                      "</div>";
    var destId = "destination-" + addDestCounter;
    destIds.push(destId);
    var currentParent = $(this).parent();
    var formParent = $(currentParent).parent();
    $(formParent).after(newDestForm);
    // adds autocomplete functionality to each new input
  var nPoint = "destination-" + addDestCounter;
  var newPoint = document.getElementById(nPoint);
  var autocompleteN = new google.maps.places.Autocomplete(newPoint);
  addDestCounter++;
  updateDestLabel();
  randomizePlaceHolder();
  })
}

  //allows users to remove destination
function removeDest(){
  $("#destination-form").on("click", ".js-removeDest", function(event){
    event.preventDefault();
    var currentParent = $(this).parent();
    var formParent = $(currentParent).parent();
    $(formParent).remove();
    updateDestLabel();
  })
};

  //changes placeholder for destination cities

function randomizePlaceHolder(){
    var cities = ["San Antonio", "Austin", "Seattle", "Portland", "New York", "Chicago", "Atlanta", "San Francisco", "DC", "Vancouver", "Detroit", "Miami", "St. Louis", "Memphis", "Kansas City", "Santa Fe", "Fargo", "New Orleans", "Las Vegas"]
    var days = ["1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "7 days", "8 days", "9 days", "10 days", "11 days", "12 days", "13 days", "14 days", "15 days", "16 days", "17 days", "18 days", "19 days", "20 days", "21 days", "1 week", "2 weeks", "3 weeks"]
    var city1 = cities.splice(Math.floor(Math.random()*cities.length), 1);
    var city2 = cities.splice(Math.floor(Math.random()*cities.length), 1);
    $("#start").attr("placeholder", city1);
    $("#end").attr("placeholder", city2);
    var day = days.splice(Math.floor(Math.random()*days.length), 1);
    $("#end-length").attr("placeholder", day);

    destIds.forEach(function(item){
      var city = cities.splice(Math.floor(Math.random()*cities.length), 1);
      var dayLength = days.splice(Math.floor(Math.random()*days.length), 1);
      var jqueryItem = "#" + item;
      var jqueryLength = "#length-" + item
      $(jqueryItem).attr("placeholder", city)
      $(jqueryLength).attr("placeholder", dayLength)
      cities.push(city[0])
    })
    cities.push(city1[0]);
    cities.push(city2[0]);
}

// API SECTION

      //Obtaining geocodes section 
      //All other apis require the data that this section
      //gathers. As such, all other api calls are made within this
      //section to ensure that the data is in it's proper place
      //before the other calls are run
// ******************************************************************
  var GOOGLE_GEOCODE_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
  var myGeoArray = []; //holds coordinates that geocode returns

  function getDataFromGoogleGeocode(address, callback){ //gets JSON for addresses
      var query = {
        "address": address,
        key: "AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ",
      };
      $.getJSON(GOOGLE_GEOCODE_BASE_URL, query, callback)
  }

  function returnGeocodeData(data){ //pushes coodinates to myGeoArray and provides directions on where to put the coordinates depending on index
        myGeoArray.push(data.results[0]["geometry"]["location"]);
          if (myGeoArray.length == 1){
            legData["startPoint"]["geocode"]["lat"] = myGeoArray[0].lat;
            legData["startPoint"]["geocode"]["lng"] = myGeoArray[0].lng;
          }
          else if (myGeoArray.length == 2){
            legData["endPoint"]["geocode"]["lat"] = myGeoArray[1].lat;
            legData["endPoint"]["geocode"]["lng"] = myGeoArray[1].lng;
            updateWeatherObject(); //weather api refuses all of my requests
            logEventBriteData();
            getGoogleMaps();
          }
  }

  function updateLegDataGeocode(){ //calls and executes Geocode API for each item in the leg array, clears geoarray so no duplicates are pushed
      myGeoArray=[];
      leg.forEach(function(item){
        getDataFromGoogleGeocode(item, returnGeocodeData);
      });
  }
// ******************************************************************


      //EventBrite API
      //Calculates Events for EndPoint at each leg
// ******************************************************************
  var EVENTBRITE_BASE_URL = "https://www.eventbriteapi.com/v3/events/search/";

  var nextPushed = 0;
  var prevPushed = 0;

  function goToResults(){
    $('html,body').animate({
      scrollTop: $("#event-holder").offset().top},
      'slow');
  };

  function getDataFromEventBrite(callback){
    var query = {
      "location.latitude": legData["endPoint"]["geocode"]["lat"],
      "location.longitude": legData["endPoint"]["geocode"]["lng"],
      "start_date.range_start": legDates[0] + "T00:00:00",
      "start_date.range_end": legDates[1] + "T00:00:00",
      "location.within": 25 + "mi",
      // "price": null, //future functionality
      // "categories": null, //future functionality
      // "page_number": pageCount, //this is causing an error, it should return paginated responses however
      token: "NYUIK7WAP7JD57IF4W4H",
    }
    $.getJSON(EVENTBRITE_BASE_URL, query, callback)
  }

  function displayEventBriteData(data){ //grabs all event data and displays first 6 events in DOM
    var events = [];
    nextPushed = 0; //next pushed is used in event navigation
    prevPushed = 0; // prev pushed is used in event navigation
    data.events.forEach(function(item){ //pushes all items from JSON into events variable
      events.push(item);
    });
    eventPages = data.pagination;
    var currentResults = events.splice(0, 6); //instantiates a new variable by grabbing and removing first 6 events in events
    
    $("#event-holder").empty()
    var resultHTML = "<div class=\"row\">";
    var counter = 0; //allows control for how many results go into each row

    currentResults.forEach(function(item){
      if (item.logo !== null){ //some events do not have logos which threw errors, this conditional catches that
        var logo = item.logo.url;
      }
      else {
        var logo = "resources/event-placeholder-logo.jpeg"; //if there is no logo, this generic image will replace it. NEED TO ADD GENERIC IMAGE
      };
      if (item.is_free == true){
        var cost = "FREE";
      }

      else {
        var cost = "PAID"
      };

      var complexDate = (item.start.local).split("T")[0]
      var dateArray = complexDate.split("-")
      var year = dateArray[0]
      var month = dateArray[1]
      var day = dateArray[2]
      var americanDate = month + "/" + day + "/" + year;


      var time = (item.start.local).split("T")[1]
      var now = new Date(item.start.local)
      var hours = now.getHours()
      var minutes = now.getMinutes()
      var timeValue = "" + ((hours >12) ? hours -12 :hours)
      timeValue += ((minutes < 10) ? ":0" : ":")  + minutes
      timeValue += (hours >= 12) ? " P.M." : " A.M."


      resultHTML +=   "<div class=\"total-event-container container col-xs-12 col-sm-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-xs-12\">" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container container col-xs-12\">" +
                            "<div class=\"event-description-container\">" + item.description.text + 
                            "</div>" +
                          "</div>" + 
                          "<div class=\"date-time-cost-container col-xs-12\">" +
                            "<div class=\"row\">" +
                              "<div class=\"cost-container col-xs-4\">" + cost + 
                              "</div>" +
                              "<div class=\"date-time-container col-xs-8\">" + americanDate + " " + timeValue + 
                              "</div>" +
                            "</div>" +
                          "</div>" +
                        "</div>" +
                      "</div>";
      counter++;
      if (counter == 2){ //if counter reaches two then row is done so it resets everything
        resultHTML += "</div>";
        $("#event-holder").append(resultHTML);
        resultHTML = "<div class=\"row\">";
        counter = 0;
      }
    });
    currentResults.forEach(function(item){ //pushes just rendered objects to a justViewed element for navigation purposes
      justViewedEvent.push(item)
    })
    $(".event-nav-btn").removeClass("hidden");
    eventsList = events; //sets global variable eventsList to the events variable created earlier, holds all events from JSON
  }


  function nextEventsPage(){ //displays next 6 events in DOM
    var resultHTML = "";
    if (prevPushed<0){ //this conditional is dominant over the if statement in prevEventsPage. looks to see if previous button has ever been pushed. if it hasn't then only next has so it pulls events from eventsList rather that viewedEvents -- pairs with if statement in prevEventsPage function
      var currentResults = eventsList.splice(0, 6) //grabs and removes first 6 events from events variable. the ones displayed in DOM are only in justViewed variable
      viewedEvents = justViewedEvent.concat(viewedEvents); //moves justViewed items to viewedEvents. viewedEvents holds all previously viewed events, used for backwards navigation
      justViewedEvent = []; //empties justViewed events in preparation to refill it with events that are currently displayed
      currentResults.forEach(function(item){ //justViewedEvent is now equal to the events displayed on the dom
        justViewedEvent.push(item);
      });
    }

      //this is working backwords through the array as it only triggers if user has gone through events backwards
    else if (prevPushed >=0){ //this conditional requires that that else if conditional in prevEventPage was called. looks to see if previous button has ever been pushed. if it has then next begins to pull from viewedEvents rather than eventsList -- pairs with else if statement in prevEventsPage function
      var currentResults = viewedEvents.splice(0, 6); //grabs and removes first 6 items from viewedEvents variable that prevPageEvents placed
      eventsList = eventsList.concat(justViewedEvent); //places just viewed event at end of variable where it originally was in JSON
      justViewedEvent = []; //empties justViewedEvent
      currentResults.forEach(function(item){ //justViewedEvent is now equal to the event displayed on screen
        justViewedEvent.push(item);
      })
    }

    $("#event-holder").empty()
    var resultHTML = "<div class=\"row\">";
    var counter = 0; //allows control for how many results go into each row

    currentResults.forEach(function(item){ //same functionality as displayEventBriteData section
      if (item.logo !== null){
        var logo = item.logo.url;
      }
      else {
        var logo = "resources/event-placeholder-logo.jpeg";
      }

      if (item.is_free == true){
        var cost = "FREE";
      }

      else {
        var cost = "PAID"
      }

      var complexDate = (item.start.local).split("T")[0]
      var dateArray = complexDate.split("-")
      var year = dateArray[0]
      var month = dateArray[1]
      var day = dateArray[2]
      var americanDate = month + "/" + day + "/" + year;


      var time = (item.start.local).split("T")[1]
      var now = new Date(item.start.local)
      var hours = now.getHours()
      var minutes = now.getMinutes()
      var timeValue = "" + ((hours >12) ? hours -12 :hours)
      timeValue += ((minutes < 10) ? ":0" : ":")  + minutes
      timeValue += (hours >= 12) ? " P.M." : " A.M."

      resultHTML +=   "<div class=\"total-event-container container col-xs-12 col-sm-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-xs-12\">" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container container col-xs-12\">" +
                            "<div class=\"event-description-container\">" + item.description.text + 
                            "</div>" +
                          "</div>" + 
                          "<div class=\"date-time-cost-container col-xs-12\">" +
                            "<div class=\"row\">" +
                              "<div class=\"cost-container col-xs-4\">" + cost + 
                              "</div>" +
                              "<div class=\"date-time-container col-xs-8\">" + americanDate + " " + timeValue + 
                              "</div>" +
                            "</div>" +
                          "</div>" +
                        "</div>" +
                      "</div>";
      counter++;
      if (counter == 2){ //if counter reaches two then row is done so it resets everything
        resultHTML += "</div>";
        $("#event-holder").append(resultHTML);
        resultHTML = "<div class=\"row\">";
        counter = 0;
      }
    });
    $("#event-holder").empty();
    $("#event-holder").append(resultHTML);
    goToResults();
  }

  function prevEventsPage(){ //displays previously viewed events on screen,
    var resultHTML = "";
    if (nextPushed >= 0){ //this conditional requires that the if statement in nextEventsPage was called; triggers if next button has ever been pushed when prevEventsPage is called
      var prevResults = viewedEvents.splice(0, 6); //grabs and removes first 6 items from viewedEvents var that nextEventPage function put
      eventsList = justViewedEvent.concat(eventsList); //places justViewedEvent at beginning of eventsList. This ensures var is in same order as it was in JSON
      justViewedEvent = []; //empties justViewedEvent var
      prevResults.forEach(function(item){ //events on screen are now in JustViewedEvent var
        justViewedEvent.push(item);
      })
    }

    else if (nextPushed<0){ //displays last 6 events in JSON -> this conditional is Dominant over else if in nextPage
      var prevResults = eventsList.splice(eventsList.length - 6) //grabs and removes last 6 events from JSON
      viewedEvents = justViewedEvent.concat(viewedEvents); //placed just viewed event at beginning of viewed events because the next page function works throught it from front to back
      justViewedEvent = []; //empties justViewedEvent var
      prevResults.forEach(function(item){//events on screen are now in justViewedEvent var
        justViewedEvent.push(item);
      })
    }

    $("#event-holder").empty()
    var resultHTML = "<div class=\"row\">";
    var counter = 0; //allows control for how many results go into each row

    prevResults.forEach(function(item){ //same functionality as displayEventBriteData
      if (item.logo !== null){
        var logo = item.logo.url
      }
      else {
        var logo = "#";
      };

      if (item.is_free == true){
        var cost = "FREE";
      }
      else {
        var cost = "PAID"
      };

      var complexDate = (item.start.local).split("T")[0]
      var dateArray = complexDate.split("-")
      var year = dateArray[0]
      var month = dateArray[1]
      var day = dateArray[2]
      var americanDate = month + "/" + day + "/" + year;


      var time = (item.start.local).split("T")[1]
      var now = new Date(item.start.local)
      var hours = now.getHours()
      var minutes = now.getMinutes()
      var timeValue = "" + ((hours >12) ? hours -12 :hours)
      timeValue += ((minutes < 10) ? ":0" : ":")  + minutes
      timeValue += (hours >= 12) ? " P.M." : " A.M."

      resultHTML +=   "<div class=\"total-event-container container col-xs-12 col-sm-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-xs-12\">" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container container col-xs-12\">" +
                            "<div class=\"event-description-container\">" + item.description.text + 
                            "</div>" +
                          "</div>" + 
                          "<div class=\"date-time-cost-container col-xs-12\">" +
                            "<div class=\"row\">" +
                              "<div class=\"cost-container col-xs-4\">" + cost + 
                              "</div>" +
                              "<div class=\"date-time-container col-xs-8\">" + americanDate + " " + timeValue + 
                              "</div>" +
                            "</div>" +
                          "</div>" +
                        "</div>" +
                      "</div>";
      counter++;
      if (counter == 2){ //if counter reaches two then row is done so it resets everything
        resultHTML += "</div>";
        $("#event-holder").append(resultHTML);
        resultHTML = "<div class=\"row\">";
        counter = 0;
      }
    });
    $("#event-holder").empty();
    $("#event-holder").append(resultHTML);
    goToResults();
  }

  function logEventBriteData(){
    getDataFromEventBrite(displayEventBriteData);
  }
// ******************************************************************


      //Google Autocomplete API Section
// ******************************************************************
    function autoComplete(){
      var begin = document.getElementById("start");
      var end = document.getElementById("end")
      var autocompleteBegin = new google.maps.places.Autocomplete(begin)
      var autocompleteEnd = new google.maps.places.Autocomplete(end)
    }
// ******************************************************************


      //Open Weather API - CONTINOUSLY REFUSES MY REQUESTS. LIKELY WILL REPLACE WITH DIFFERENT API
// ******************************************************************
  var OPEN_WEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

  var weather = []; 

  function getDataFromOpenWeather(point, callback){
    var lat = point.lat;
    var lon = point.lng;
    var query = {
      "lat": lat,
      "lon": lon,
      appid: "d01498adc1f04688324d55f1b9507017",
    }
  $.getJSON(OPEN_WEATHER_BASE_URL, query, callback)
  }

  function pushDataFromOpenWeather(data){
    weather.push(data.weather[0]);
  }

  function updateWeatherObject(){
    var pointsArray = [legData.startPoint, legData.endPoint];
    // , legData.midPoint, legData["point0.5"], legData["point1.5"]]
    pointsArray.forEach(function(point){
      getDataFromOpenWeather(point.geocode, pushDataFromOpenWeather);
    })
  }

// ******************************************************************

      //Google Maps API
// ******************************************************************
    var GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps/embed/v1/directions"

    function getGoogleMaps(callback){
      var origin1 = leg[0].replace(/, /g, ",")
      var destination1 = leg[1].replace(/, /g, ",")
      var origin = origin1.replace(/ /g, "+")
      var destination = destination1.replace(/ /g, "+")

      var resultElement = "<iframe frameborder=\"0\" style=\"border:0\" src=\"https://www.google.com/maps/embed/v1/directions?"+
      "origin=" + origin + 
      "&destination=" + destination + 
      "&key=AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ\"" +
      "allowfullscreen></iframe>";
      $("#map-holder").empty();
      $("#map-holder").html(resultElement);
      $(".leg-nav-btn").removeClass("hidden")
    }
// ******************************************************************



// Watch Submit

function watchFormSubmit(){
  $("#destination-form").submit(function(event){
    event.preventDefault();
    createRoadTrip();
  });

  function createRoadTrip(){ //function ensures that user is alerted of required tags
    var proceed = false; //locks application rendering behind this variable
    if($("#destination-form")[0].checkValidity){
      if($("#destination-form")[0].checkValidity()){
        proceed = true
      }
    }
    else {
      proceed = true
    }
    if (proceed){ //if proceed returns true application runs
      $(".roadtrip-inputs").slideToggle("slow", function(){
        $("#roadtrip-begin-page").slideToggle("slow", function(){
          $("#results-nav").toggleClass("hidden");
        });
      })
      getDestinations();
      getDates();
      getLeg();
      updateLegDataGeocode();
    }
  }
}

function watchLegsNavigate(){
  $("#next-leg-button").on("click", function(){
    if ((legCounter + 1) == (destinations.length-1)){
      legCounter = 0;
      getLeg();
      updateLegDataGeocode();
    }
    else { 
      legCounter++;
      getLeg();
      updateLegDataGeocode();
    }
    viewedEvents = [];
  })

  $("#prev-leg-button").on("click", function(){
    if ((legCounter - 1) < 0){
      legCounter = (destinations.length-2)
      getLeg();
      updateLegDataGeocode();
    }
    else {
    legCounter--;
    getLeg();
    updateLegDataGeocode();
    }
    viewedEvents = [];
  })
}

function watchEventsNavigate(){ //this ensures users always see events
  $("#next-events-button").on("click", function(){
    if (eventsList.length == 0){ //if eventsList has been emptied by user scrolling through it, this resets everything to beginning
      // pageCount++; //feature for when pagination is working in eventbrite api call
      logEventBriteData();
    }
    else { //increments eventnavbutton counters for use in functions 
      nextPushed++
      prevPushed--
    }
    event.preventDefault();
    nextEventsPage();
  })

  $("#prev-events-button").on("click", function(){
    if (eventsList.length == 0){ //this function is exactly function above but focused on the previous button
      logEventBriteData();
    }
    else {
      prevPushed++
      nextPushed--
    }
    event.preventDefault();
    prevEventsPage();
  })
}

function watchTripEdit(){
  $("#edit-trip").on("click", function(){
    $("#roadtrip-begin-page").slideToggle("slow", function(){
      $(".roadtrip-inputs").slideToggle("slow")
      $("#results-nav").toggleClass("hidden");
    })
  }) 
}

$(function(){
  randomizePlaceHolder()
  setInterval(function(){randomizePlaceHolder()}, 5000);
  autoComplete();
  watchFormSubmit();
  addDest();
  removeDest();
  watchEventsNavigate();
  watchLegsNavigate();
  watchTripEdit();
})