// State
var destinations = [];

var addDestCounter = 1;

var leg = [];

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

               "0.5point": {geocode: {latitude: null,
                                    longitude: null},
                          weather: {}
                         },
               "1.5point": {geocode: {latitude: null,
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
  })
  getLeg(); //initiates initial leg of the journey
}

  //this function gets the leg of the journey.
  //it will always be two destinations
  //this will be called once we start navigating
function getLeg(){
  leg = [destinations[legCounter], destinations[legCounter + 1]];
}

  //Obtaining geocodes section
  var GOOGLE_GEOCODE_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
  var myGeoArray = []; //holds coordinates that geocode returns

function getDataFromGoogleGeocode(address, callback){
    var query = {
      "address": address,
      key: "AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ",
    };
    $.getJSON(GOOGLE_GEOCODE_BASE_URL, query, callback)
}

function returnGeocodeData(data){
      myGeoArray.push(data.results[0]["geometry"]["location"]);
        legData["startPoint"]["geocode"] = myGeoArray[0];
        legData["endPoint"]["geocode"] = myGeoArray[1];
}

function updateLegDataGeocode(){
    myGeoArray=[];
    leg.forEach(function(item){
      getDataFromGoogleGeocode(item, returnGeocodeData);
    });
}


// DOM Manipulation
  // adds new destination input area in form
function addDest(){
  $("#destination-form").on("click", "#js-addDest", function(event){
    event.preventDefault();
    var newDestForm = "<br><input type=\"text\" name=\"dest-" + addDestCounter + "\" id = \"destination-" + addDestCounter + "\" class=\"js-destination\" placeholder=\"Destination\">" + 
    "<input type=\"text\" name=\"Dest-" +addDestCounter+ "-date\" placeholder=\"length of stay\">" + 
    "<button id=\"js-addDest\">Add Destination</button>";
    $(this).after(newDestForm);
    addAutoComplete();
    addDestCounter++;
  })
}

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
    updateLegDataGeocode();
    console.log(myGeoArray)
  });
}

$(function(){
  watchFormSubmit();
  addDest();
})