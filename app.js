'use strict';

// State
var destinations = [];

var dates = [];

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

  console.log(miles + "miles");
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
    var newDestForm = "<br><input type=\"text\" name=\"dest-" + addDestCounter + "\" id = \"destination-" + addDestCounter + "\" class=\"js-destination\" placeholder=\"Destination\">" + 
    "<input type=\"text\" name=\"Dest-" +addDestCounter+ "-date\" class=\"length\" placeholder=\"length of stay\">" + 
    "<button id=\"js-addDest\">Add Destination</button>";
    $(this).after(newDestForm);
		// adds autocomplete functionality to each new input
	var nPoint = "destination-" + addDestCounter;
	var newPoint = document.getElementById(nPoint);
	var autocompleteN = new google.maps.places.Autocomplete(newPoint);
	addDestCounter++;
  })
}


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
	var EVENTBRITE_BASE_URL = "https://www.eventbriteapi.com/v3/events/search/"

	function getDataFromEventBrite(callback){
    var query = {
			"location.latitude": legData["endPoint"]["geocode"]["lat"],
			"location.longitude": legData["endPoint"]["geocode"]["lng"],
			"start_date.range_start": legDates[legCounter] + "T00:00:00",
			"start_date.range_end": legDates[legCounter + 1] + "T00:00:00",
			"price": null, //future functionality
			"categories": null, //future functionality
			token: "NYUIK7WAP7JD57IF4W4H",
		}
		$.getJSON(EVENTBRITE_BASE_URL, query, callback)
	}

	function displayEventBriteData(data){
		// data.events.forEach(function(item){
			console.log(data) //need to format html in order to push it on screen. Will require fairly complex
        //css in order to make everything render. Need to research on what i actually want to appear
        //probably logo, date of event, price, name, location, short description, and a link to 
        //eventbrite. maybe determine how to get a referral link in it as well.
		// })
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
      var origin1 = leg[legCounter].replace(/, /g, ",")
      var destination1 = leg[legCounter+1].replace(/, /g, ",")
      var origin = origin1.replace(/ /g, "+")
      var destination = destination1.replace(/ /g, "+")

      var resultElement = "<iframe width=\"600\" height=\"450\" frameborder=\"0\" style=\"border:0\" src=\"https://www.google.com/maps/embed/v1/directions?"+
      "origin=" + origin + 
      "&destination=" + destination + 
      "&key=AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ\"" +
      "allowfullscreen></iframe>";
      $("#map-holder").html(resultElement);
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
    logEventBriteData();
  });
}

$(function(){
  autoComplete();
  watchFormSubmit();
  addDest();
})