'use strict';

// State
var destinations = [];

var dates = [];

var eventsList = [];

var viewedEvents = [];

var justViewedEvent = [];

var addDestCounter = 1;

var leg = [];

var legDates = [];

var legCounter = 0;

var legData  = {startPoint: {geocode: {},
                            weather: {}
                           },
               endPoint: {geocode: {},
                          weather: {}
                         },
               midPoint: {geocode: {},
                          weather: {}
                          },

               "point0.25": {geocode: {},
                          weather: {}
                         },
               "point0.75": {geocode: {},
                          weather: {}
                         },
                "startToEnd": {distance: null,
                                time: null},
                "startTo0.25": {distance: null,
                                time: null },
                "point0.25ToMid": {distance: null,
                                time: null },
                "midTo0.75": {distance: null,
                                time: null },
                "Point0.75ToEnd": {distance: null,
                                time: null },
              };

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
		var length = $(this).val() //this grabs the length the user inputted
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
}

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

  console.log((miles).toFixed(2) + " miles, and approximately " + (miles/55).toFixed(2) + " hours");
}

function calcAllDistance(){ //make this less complicated
  calcDistance(legData["startPoint"]["geocode"]["lat"], legData["startPoint"]["geocode"]["lng"], 
               legData["endPoint"]["geocode"]["lat"], legData["endPoint"]["geocode"]["lng"]);
}


// DOM Manipulation
  
  // adds new destination input area in form
function addDest(){
  $("#destination-form").on("click", "#js-addDest", function(event){
    event.preventDefault();
    var newDestForm = "<div class=\"dest-container\"><input type=\"text\" name=\"dest-" + addDestCounter + "\" id = \"destination-" + addDestCounter + "\" class=\"js-destination\" placeholder=\"Destination\" required>" + 
    "<input type=\"text\" name=\"Dest-" +addDestCounter+ "-date\" class=\"length\" placeholder=\"length of stay\" required>" + 
    "<button id=\"js-addDest\">Add Destination</button>" +
    "<button id=\"js-removeDest\">Remove Destination</button>" +
    "</div>";
    var currentParent = $(this).parent();
    $(currentParent).after(newDestForm);
		// adds autocomplete functionality to each new input
	var nPoint = "destination-" + addDestCounter;
	var newPoint = document.getElementById(nPoint);
	var autocompleteN = new google.maps.places.Autocomplete(newPoint);
	addDestCounter++;
  })
}

function removeDest(){
  $("#destination-form").on("click", "#js-removeDest", function(event){
    event.preventDefault();
    var currentParent = $(this).parent();
    $(currentParent).remove();
  })
};


// API SECTION

      //Obtaining geocodes section
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
            //updateWeatherObject();
            logEventBriteData();
            getGoogleMaps();
            calcAllDistance();
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

	function getDataFromEventBrite(callback){
    var query = {
			"location.latitude": legData["endPoint"]["geocode"]["lat"],
			"location.longitude": legData["endPoint"]["geocode"]["lng"],
			"start_date.range_start": legDates[0] + "T00:00:00",
			"start_date.range_end": legDates[1] + "T00:00:00",
			// "price": null, //future functionality
			// "categories": null, //future functionality
			token: "NYUIK7WAP7JD57IF4W4H",
		}
		$.getJSON(EVENTBRITE_BASE_URL, query, callback)
	}

	function displayEventBriteData(data){ //grabs all event data and displays first 6 events in DOM
    var events = [];
    nextPushed = 0; //next pushed is used in event navigation
    prevPushed = 0; // prev pushed is used in event navigation
    var resultHTML = ""; //will be used for DOM Manipulation
    console.log(data)
    data.events.forEach(function(item){ //pushes all items from JSON into events variable
      events.push(item);
    });
    var currentResults = events.splice(0, 6); //instantiates a new variable by grabbing and removing first 6 events in events
    currentResults.forEach(function(item){
      if (item.logo !== null){ //some events do not have logos which threw errors, this conditional catches that
        var logo = item.logo.url;
      }
      else {
        var logo = "resources/event-placeholder-logo.jpeg"; //if there is no logo, this generic image will replace it. NEED TO ADD GENERIC IMAGE
      };
      resultHTML +=   "<div class=\"total-event-container container col-sm-12 col-md-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-sm-3\">" +
                            "<a href=\"" + item.url + "\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container col-sm-8 col-sm-offset-1\">" +
                            "<div class=\"event-description-container\">" + item.description.text + 
                            "</div>" +
                          "</div>" + 
                          "<div class=\"date-time-cost-container col-sm-12\">" +
                            "<div class=\"row\">" +
                              "<div class=\"cost-container col-sm-3\">" + "UNKNOWN" + 
                              "</div>" +
                              "<div class=\"data-time-container col-sm-8 col-sm-offset-1\">" + item.start.local + 
                              "</div>" +
                            "</div>" +
                          "</div>" +
                        "</div>" +
                      "</div>";
    });
    $("#event-holder").empty() //removes any previous html in event holder
    $("#event-holder").html(resultHTML); //pushes all html from resultHTML to DOM
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
      //this is working backwords throw the array as it only triggers if user has gone through events backwards
    else if (prevPushed >=0){ //this conditional requires that that else if conditional in prevEventPage was called. looks to see if previous button has ever been pushed. if it has then next begins to pull from viewedEvents rather than eventsList -- pairs with else if statement in prevEventsPage function
      var currentResults = viewedEvents.splice(0, 6); //grabs and removes first 6 items from viewedEvents variable that prevPageEvents placed
      eventsList = eventsList.concat(justViewedEvent); //places just viewed event at end of variable where it originally was in JSON
      justViewedEvent = []; //empties justViewedEvent
      currentResults.forEach(function(item){ //justViewedEvent is now equal to the event displayed on screen
        justViewedEvent.push(item);
      })
    }

    currentResults.forEach(function(item){ //same functionality as displayEventBriteData section
      if (item.logo !== null){
        var logo = item.logo.url;
      }
      else {
        var logo = "resources/event-placeholder-logo.jpeg";
      }

      resultHTML +=   "<div class=\"total-event-container container col-sm-12 col-md-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-sm-3\">" +
                            "<a href=\"" + item.url + "\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container col-sm-8 col-sm-offset-1\">" +
                            "<div class=\"event-description-container\">" + item.description.text + 
                            "</div>" +
                          "</div>" + 
                          "<div class=\"date-time-cost-container col-sm-12\">" +
                            "<div class=\"row\">" +
                              "<div class=\"cost-container col-sm-3\">" + "UNKNOWN" + 
                              "</div>" +
                              "<div class=\"data-time-container col-sm-8 col-sm-offset-1\">" + item.start.local + 
                              "</div>" +
                            "</div>" +
                          "</div>" +
                        "</div>" +
                      "</div>";

    });
    $("#event-holder").empty();
    $("#event-holder").append(resultHTML);
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
    prevResults.forEach(function(item){ //same functionality as displayEventBriteData
      if (item.logo !== null){
        var logo = item.logo.url
      }
      else {
        var logo = "#";
      };

      resultHTML +=   "<div class=\"total-event-container container col-sm-12 col-md-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-sm-3\">" +
                            "<a href=\"" + item.url + "\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container col-sm-8 col-sm-offset-1\">" +
                            "<div class=\"event-description-container\">" + item.description.text + 
                            "</div>" +
                          "</div>" + 
                          "<div class=\"date-time-cost-container col-sm-12\">" +
                            "<div class=\"row\">" +
                              "<div class=\"cost-container col-sm-3\">" + "UNKNOWN" + 
                              "</div>" +
                              "<div class=\"data-time-container col-sm-8 col-sm-offset-1\">" + item.start.local + 
                              "</div>" +
                            "</div>" +
                          "</div>" +
                        "</div>" +
                      "</div>";
    });
    $("#event-holder").empty();
    $("#event-holder").append(resultHTML);
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


      //Open Weather API - CONTINOUSLY REFUSES MY REQUESTS. MY KEY IS CORRECT HOWEVER
// ******************************************************************
  var OPEN_WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

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
    console.log(data.results);
  }

  function updateWeatherObject(){
    var pointsArray = [legData.startPoint.geocode, legData.endPoint.geocode];
    // , legData.midPoint, legData["point0.5"], legData["point1.5"]]
    getDataFromOpenWeather(pointsArray[0], pushDataFromOpenWeather);
    getDataFromOpenWeather(pointsArray[1], pushDataFromOpenWeather)
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
  $("#js-form-submit").on("click", function(event){
    event.preventDefault();
    getDestinations();
    getDates();
    getLeg();
    updateLegDataGeocode();
  });
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

function watchEventsNavigate(){
  $("#next-events-button").on("click", function(){
    if (eventsList.length == 0){ //if eventsList has been empties by user scrolling through it, this resets everything to beginning
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

$(function(){
  autoComplete();
  watchFormSubmit();
  addDest();
  removeDest();
  watchEventsNavigate();
  watchLegsNavigate();
})