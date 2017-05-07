'use strict';

// State
var destinations = [];

var dates = [];

var addDestCounter = 1;

var leg = [];

var legDates = [];

var autocompleteArray = [];

var legCounter = 0;

var legData  = {startPoint: {geocode: {latitude: null,
                                      longitude: null},
                            weather: {}
                           },
               endPoint: {geocode: {latitude: null,
                                    longitude: null},
                          weather: {}
                         },
               midPoint: {geocode: {latitude: null,
                                    longitude: null},
                          weather: {}
                          },

               "point0.5": {geocode: {latitude: null,
                                    longitude: null},
                          weather: {}
                         },
               "point1.5": {geocode: {latitude: null,
                                    longitude: null},
                          weather: {}
                         },
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
          legData["startPoint"]["geocode"] = myGeoArray[0];
          legData["endPoint"]["geocode"] = myGeoArray[1];
  }

  function updateLegDataGeocode(){ //calls and executes Geocode API for each item in the leg array, clears geoarray so no duplicates are pushed
      myGeoArray=[];
      leg.forEach(function(item){
        getDataFromGoogleGeocode(item, returnGeocodeData);
      });
  }
// ******************************************************************


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

    	//Obtaining Events for EndPoint
	// ******************************************************************
	var EVENTBRITE_BASE_URL = "https://www.eventbriteapi.com/v3/events/search/"

	function getDataFromEventBrite(callback){
		var query = {
			"location.latitude": legData.endPoint.geocode.lat,
			"location.longitude": legData.endPoint.geocode.lng,
			"start_date.range_start": $("#start-date").val() + "T00:00:00",
			// "start_data.range-end": 
			token: "NYUIK7WAP7JD57IF4W4H",
		}
		$.getJSON(EVENTBRITE_BASE_URL, query, callback)
	}

	function displayEventBriteData(data){
		data.events.forEach(function(item){
			console.log(item);
		})
	}

	function logEventBriteData(){
		getDataFromEventBrite(displayEventBriteData);
	}
	// ******************************************************************

  //Google Autocomplete API Section
  //NEED TO DETERMINE HOW TO ADD FUNCTIONALITY
  //TO NEW DESTINATIONS
var begin = document.getElementById("start");
var end = document.getElementById("end")

var autocompleteBegin = new google.maps.places.Autocomplete(begin)
var autocompleteEnd = new google.maps.places.Autocomplete(end)


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
  watchFormSubmit();
  addDest();
})