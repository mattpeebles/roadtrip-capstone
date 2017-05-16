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

var eventPages;

var resultsPerPage;



// State Manipulation Section

  // grabs all user inputted destinations and pushes
  //them to the destinations array
function getDestinations(){
  destinations = [];
  $("#destination-form .js-destination").each(function(){
    destinations.push($(this).val());
  }); //initiates initial leg of the journey
}

function startCalendar(){
  $("#start-date").datepicker();  
}

  //ensures all user inputted lengths of stay are numbers
  //used as a check in the submit form section
function checkLengthInputs(){
   var lengthDigit;
   $("#destination-form .length").each(function(){
    
    var length = $(this).val().toLowerCase().replace(/ /g,''); //this grabs the text the user inputted in the staying for input
    
    if (length.indexOf("d") != -1){ //if user enters day or days, catches and converts to number
        var length = length.substring(0, length.indexOf("d"))
    }

    else if (length.indexOf("w") != -1){ //if user enters week or weeks, catches, converts to number, and converts to days
      var length = length.substring(0, length.indexOf("w"))
    }

    if (isNaN(parseInt(length))){
      lengthDigit = false;
    }

    else{
      lengthDigit = true;
    }
  })
  return lengthDigit;
}

  //sets calendar min-date to today
  //user is unable to select dates that happened
  //before today
function preventPastDate(){
  var today = new Date();
  // yesterday.setDate(yesterday.getDate() - 1);
  today = today.toISOString().split('T')[0]
  document.getElementsByName("begin-date")[0].setAttribute('min', today);
}


  // grabs first date and based on that calculates all
  //subsequent dates based on length of time user inputs
function getDates(){
  dates = [];
  var datesIndex = 0;
  var startDate = document.getElementById("start-date").value;
  var startDate = startDate.replace("/", "-")
  var startDate = startDate.replace("/", "-")
  dates.push(startDate);
  var fixStart = dates[0].split("-")
  dates[0] = ([fixStart[2], fixStart[0], fixStart[1]]).join("-")
  $("#destination-form .length").each(function(){
    var dtstr = dates[datesIndex]; //grabs last date in the array to calculate next date
    var timeDate = new Date(dtstr).getTime(); //this gets the last date's exact time in seconds
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
  //this will be used once weather is added to the page
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

  // adds new destination input area in form after the div
  //  which contains the buttno that was pushed
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
  //removes destination that contains the 
  //remove button
function removeDest(){
  $("#destination-form").on("click", ".js-removeDest", function(event){
    event.preventDefault();
    var currentParent = $(this).parent();
    var formParent = $(currentParent).parent();
    $(formParent).remove();
    updateDestLabel();
  })
};

  //randomizes placeholders for destination cities
  //to give users ideas of possiblities
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
      //before the other functions are run
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
            // updateWeatherObject(); //will be used in the future to update weather
            logEventBriteData();
            getGoogleMaps();
          }
  }

  function updateLegDataGeocode(){ //calls and executes Geocode API for each item in the leg array, clears geoarray so no duplicates are pushed
      leg.forEach(function(item){
        getDataFromGoogleGeocode(item, returnGeocodeData);
      });
      myGeoArray = [];
  }
// ******************************************************************


      //EventBrite API
      //Grabs and Displays Events for EndPoint at each leg
// ******************************************************************
  var EVENTBRITE_BASE_URL = "https://www.eventbriteapi.com/v3/events/search/";

  // counters that keep track of user navigation through pages
  var nextPushed = 0;
  var prevPushed = 0;

  // function that animates screen to go to the results section
  //after next event is pushed
  function goToResults(){
    $('html,body').animate({
      scrollTop: $("#event-title-page").offset().top},
      'slow');
  };


  // queries eventbrite api to obtain data about events
  //within the dates the user will be in the city
  function getDataFromEventBrite(callback){
    var query = {
      "location.latitude": legData["endPoint"]["geocode"]["lat"],
      "location.longitude": legData["endPoint"]["geocode"]["lng"],
      "start_date.range_start": legDates[0] + "T00:00:00",
      "start_date.range_end": legDates[1] + "T00:00:00",
      "location.within": 25 + "mi",
      "sort_by": "date",
      "include_all_series_instances": false,
      "categories": "103,110,113,105,104,108,107,102,109,111,114,115,116,106,117,118,119,199",
      // "price": null, //future functionality
      "page": pageCount, //this is causing an error, it should return paginated responses however
      token: "NYUIK7WAP7JD57IF4W4H",
    }
    $.getJSON(EVENTBRITE_BASE_URL, query, callback)
  }

  function displayEventBriteData(data){ //grabs all event data and displays first 6 events in DOM
    
    if(data.events.length == 0){ //if there are no events DOM displays a div that informs the user of such
     var resultEventTitleHTML =  "<div id=\"event-section-title\">" +
                          "<p id=\"event-title-header\">I'm Sorry</p>" +
                          "<p id=\"event-title-loc\">There are no events in the area during your visit</p>" +
                          "<p id=\"event-title-page\"><span class=\"glyphicon glyphicon-road\" aria-hidden=\"true\"></span></p>"
                          "</div>"
      $("#event-holder").empty()
      $("#event-section-title-container").empty();
      $("#event-section-title-container").append(resultEventTitleHTML)
      $(".event-nav-btn-container").addClass("hidden");
    }

    //if there are events to display
    //function proceeds
    else{
      var events = [];
      data.events.forEach(function(item){ //pushes all items from JSON into events variable
        events.push(item);
      });
      eventPages = data.pagination.page_count; //grabs the amount of pages that the query returned
      resultsPerPage = data.pagination.page_size //grabs the amount of results per page

      if (resultsPerPage % 6 != 0){
        var amountOfPages = Math.floor(resultsPerPage/6) + 1; //app displays 6 events. So we take resultsPerPage/6 and if there is a remainder, we add 1 additional page to it.
      }
      else{
        var amountOfPages = resultsPerPage/6;
      }
      var userPages = eventPages * amountOfPages

        //displays event header, event city, and the approximate number of event pages. Eventbrite does not guarantee the amount that is returned, so any calculation is approximate
      if (nextPushed == 0){
        var resultEventTitleHTML =  "<div id=\"event-section-title\">" +
                                  "<p id=\"event-title-header\">Events" + "</p>" +
                                  "<p id=\"event-title-loc\">" + leg[1] + "</p>" +
                                  "<p id=\"event-title-page\">Page: " + (nextPushed +1) + " of approximately " + userPages + "</p>"
                                  "</div>"
        $("#event-section-title-container").empty();
        $("#event-section-title-container").append(resultEventTitleHTML);
      }


      $("#event-holder").empty() //clears event holder div in preperation for  results
      var resultHTML = "<div class=\"row\" id=\"first-row\">"; //instantiates row
      var counter = 0; //allows control for how many results go into each row

      var currentResults = events.splice(0, 6); //instantiates a new variable by grabbing and removing first 6 events in events

      currentResults.forEach(function(item){
        if (item.logo !== null){ //some events do not have logos which threw errors, this conditional catches that
          var logo = item.logo.url;
        }
        else {
          var logo = "resources/event-placeholder-logo.jpeg"; //if there is no logo, this generic image will replace it. NEED TO ADD GENERIC IMAGE
        };

        //sets price either free or not free
        if (item.is_free == true){
          var cost = "FREE";
        }

        else {
          var cost = "PAID"
        };

        //sets description
        if (item.description.text == null){
          var descr = "Organizer has not added a description for this event"
        }

        else {
          var descr = item.description.text
        }

          //Transforms returned date into traditional
          //American date syntax
        var complexDate = (item.start.local).split("T")[0] //item.start.local has format yyyy-mm-ddThh:mm:ss, this splits the date on the T and returns the first array item
        var dateArray = complexDate.split("-")
        var year = dateArray[0]
        var month = dateArray[1]
        var day = dateArray[2]
        var americanDate = month + "/" + day + "/" + year;

        //Transforms military time to 
        //traditional 12 hour time
        var now = new Date(item.start.local)
        var hours = now.getHours()
        var minutes = now.getMinutes()
        var timeValue = "" + ((hours > 12) ? hours -12 :hours)
        timeValue += ((minutes < 10) ? ":0" : ":")  + minutes
        timeValue += (hours >= 12) ? " P.M." : " A.M."

        timeValue = ((timeValue == "0:00 A.M.") ? "Midnight" : timeValue)


        //HTML format that is pushed to the DOM
        resultHTML +=   "<div class=\"total-event-container container col-xs-12 col-sm-6\">" +
                              "<div class=\"event-title-container\">"+ item.name.text + 
                              "</div>" +
                          "<div class=\"event-container row\">" +
                           "<div class=\"logo-container col-xs-12\">" +
                              "<a href=\"" + item.url + "\" target=\"_blank\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                            "</div>" +
                            "<div class=\"information-container container col-xs-12\">" +
                              "<div class=\"event-description-container\">" + descr + 
                              "</div>" +
                              "<a href=\"" + item.url + "\" target=\"_blank\"><p class=\"info-link\">More Info</p></a>" +
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
        counter++; //keeps track of how many row items have been pushed in the row
        if (currentResults.length == 1){ //this ensures if there is only 1 event to be displayed that it is displayed appropriately
          resultHTML += "</div>";
          $("#event-holder").append(resultHTML);
        }

        else {
          if (counter == 2){ //if counter reaches two then row is done so it pushes the close div tag, pushes it to dom, and then resets everything
            resultHTML += "</div>";
            $("#event-holder").append(resultHTML);
            resultHTML = "<div class=\"row\">";
            counter = 0;
          }
        }
      });

      currentResults.forEach(function(item){ //pushes just rendered objects to a justViewed element for navigation purposes
        justViewedEvent.push(item)
      })
      $(".event-nav-btn-container").removeClass("hidden"); //allows users to navigate between events
      eventsList = events; //sets global variable eventsList to the events variable created earlier, holds all events from JSON
    }
  }

  function logEventBriteData(){
    getDataFromEventBrite(displayEventBriteData);
  }

    //below functions are used to navigate through events

  function nextEventsPage(){ //displays next 6 events in DOM, functions are almost exactly the same as in displayEventBrite Data
    var resultHTML; //creates new resultHTML variable
    
    if (resultsPerPage % 6 != 0){
      var amountOfPages = Math.floor(resultsPerPage/6) + 1;
    }
    else{
      var amountOfPages = resultsPerPage/6;
    }
    
    var userPages = eventPages * amountOfPages

    var resultEventTitleHTML =  "<div id=\"event-section-title\">" +
                                  "<p id=\"event-title-header\">Events" + "</p>" +
                                  "<p id=\"event-title-loc\">" + leg[1] + "</p>" +
                                  "<p id=\"event-title-page\">Page: " + (nextPushed +1) + " of approximately " + userPages + "</p>"
                                "</div>"
    $("#event-section-title-container").empty();
    $("#event-section-title-container").append(resultEventTitleHTML);

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
    var resultHTML = "<div class=\"row\" id=\"first-row\">";
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

      if (item.description.text == null){
        var descr = "Organizer has not added a description for this events"
      }

      else {
        var descr = item.description.text
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
      timeValue = ((timeValue == "0:00 A.M.") ? "Midnight" : timeValue)


      resultHTML +=   "<div class=\"total-event-container container col-xs-12 col-sm-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-xs-12\">" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container container col-xs-12\">" +
                            "<div class=\"event-description-container\">" + descr + 
                            "</div>" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><p class=\"info-link\">More Info</p></a>" +
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
      if (currentResults.length == 1){
        resultHTML += "</div>";
        $("#event-holder").append(resultHTML);
      }
      else {
        if (counter == 2){ //if counter reaches two then row is done so it resets everything
          resultHTML += "</div>";
          $("#event-holder").append(resultHTML);
          resultHTML = "<div class=\"row\">";
          counter = 0;
        }
      }
    });
    goToResults(); //scrolls the page section of event section title div
  }

  function prevEventsPage(){ //displays previously viewed events, again almost similar functionality to previous functions except where noted
    var resultHTML;
    
    if (resultsPerPage % 6 != 0){
      var amountOfPages = Math.floor(resultsPerPage/6) + 1;
    }
    else{
      var amountOfPages = resultsPerPage/6;
    }
    
    var userPages = eventPages * amountOfPages

    var resultEventTitleHTML =  "<div id=\"event-section-title\">" +
                                "<p id=\"event-title-header\">Events" + "</p>" +
                                "<p id=\"event-title-loc\">" + leg[1] + "</p>" +
                                "<p id=\"event-title-page\">Page: " + (nextPushed +1) + " of approximately " + userPages + "</p>"
                              "</div>"
    $("#event-section-title-container").empty();
    $("#event-section-title-container").append(resultEventTitleHTML);

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
    var resultHTML = "<div class=\"row\" id=\"first-row\">";
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

      if (item.description.text == null){
        var descr = "Organizer has not added a description for this event"
      }

      else {
        var descr = item.description.text
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
      timeValue = ((timeValue == "0:00 A.M.") ? "Midnight" : timeValue)

      resultHTML +=   "<div class=\"total-event-container container col-xs-12 col-sm-6\">" +
                            "<div class=\"event-title-container\">"+ item.name.text + 
                            "</div>" +
                        "<div class=\"event-container row\">" +
                         "<div class=\"logo-container col-xs-12\">" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><img class=\"event-logo\" src=\""+ logo + "\"></a>" +
                          "</div>" +
                          "<div class=\"information-container container col-xs-12\">" +
                            "<div class=\"event-description-container\">" + descr + 
                            "</div>" +
                            "<a href=\"" + item.url + "\" target=\"_blank\"><p class=\"info-link\">More Info</p></a>" +
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
    goToResults();
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


      //Open Weather API
      //future functionality
// // ******************************************************************
//   var OPEN_WEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

//   var weather = []; 

//   function getDataFromOpenWeather(point, callback){
//     var lat = point.lat;
//     var lon = point.lng;
//     var query = {
//       "lat": lat,
//       "lon": lon,
//       appid: "d01498adc1f04688324d55f1b9507017",
//     }
//   $.getJSON(OPEN_WEATHER_BASE_URL, query, callback)
//   }

//   function pushDataFromOpenWeather(data){
//     weather.push(data.weather[0]);
//   }

//   function updateWeatherObject(){
//     var pointsArray = [legData.startPoint, legData.endPoint];
//     // , legData.midPoint, legData["point0.5"], legData["point1.5"]]
//     pointsArray.forEach(function(point){
//       getDataFromOpenWeather(point.geocode, pushDataFromOpenWeather);
//     })
//   }
// // ******************************************************************

      //Google Maps API
// ******************************************************************
    var GOOGLE_MAPS_BASE_URL = "https://www.google.com/maps/embed/v1/directions"

    function getGoogleMaps(callback){
      
        //formats locations according to google's requirement
        //New York City, New York becomes
        //New+York+City,New+York
      var origin1 = leg[0].replace(/, /g, ",")
      var destination1 = leg[1].replace(/, /g, ",")
      var origin = origin1.replace(/ /g, "+")
      var destination = destination1.replace(/ /g, "+")

      //removes any previous map and displays
      //map on screen. Also reveals leg navigation
      //buttons
      var resultElement = "<iframe frameborder=\"0\" style=\"border:0\" src=\"https://www.google.com/maps/embed/v1/directions?"+
      "origin=" + origin + 
      "&destination=" + destination + 
      "&key=AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ\"" +
      "allowfullscreen></iframe>";
      $("#map-holder").empty();
      $("#map-holder").html(resultElement);
      
      //displays leg navigation functionality if 
      //user has inputted more than two destinations
      if (destinations.length > 2){
        $(".leg-nav-btn").removeClass("hidden")
      }
    }
// ******************************************************************



// Watch Submit

function watchFormSubmit(){
  $("#destination-form").submit(function(event){
    event.preventDefault();
    createRoadTrip();
  });

  function createRoadTrip(){ //function ensures that user has inputted required data
    var proceed = false; //locks application rendering behind this variable
    if($("#destination-form")[0].checkValidity()){ //ensures user has inputted required data in all inputs
      proceed = true;
    }
    else {
      proceed = true;
    }

    if(checkLengthInputs() === false){ //ensures checkLengthInputs did not return false, if it did, they didn't enter a viable length of stay
        proceed = false
        $("#nonDigit-alert").show(1000); 
        $("#nonDigit-alert").fadeOut(15000);
    }
    else{
        proceed = true
    }
    
    if (proceed){ //if proceed returns true application runs
      //ensures everything renders appropriately and state was not messed with prior to application being run
      nextPushed = 0;
      prevPushed = 0;
      
      eventsList = [];
      viewedEvents = [];
      justViewedEvent = [];

      getDestinations();
      getDates();
      getLeg();
      updateLegDataGeocode();

      $(".roadtrip-inputs").slideToggle("slow", function(){
        $("#begin-page-container").fadeToggle("slow", function(){
          $("#results-nav").removeClass("hidden");
          $("#footer-nav").removeClass("hidden")
          $("#results").removeClass("hidden");
        });
      })
    }
  }
};

function watchInputClick(){ //highlights all text when user clicks on an input
  $("input[type='text']").click(function () {
   $(this).select();
});

}

function watchLegsNavigate(){
  $("#next-leg-button").on("click", function(){
      //if legCounter plus 1 equals destination length -1 then the first leg is the last destination
      //this will not render appropriately, so it sets legCounter back to zero and recalls getLeg
      //this ensures that on the last leg, when user clicks next, it will restart
    if ((legCounter + 1) == (destinations.length-1)){
      legCounter = 0;
      getLeg();
      updateLegDataGeocode();
    }

    //if legCounter will not equal the last destination item, then it increments leg by 1 and recalls get Leg
    //to display next leg data
    else { 
      legCounter++;
      getLeg();
      updateLegDataGeocode();
    }
    viewedEvents = []; //this resets viewed events so that events viewed in prior city do not carry over to the next
  })

  $("#prev-leg-button").on("click", function(){
      //this allows users to viewed legs backwards if they choose
      //if legCounter will be less than zero then app is displaying 
      //first leg, so it sets legCounter to the penultimate number
      //to display the last leg
    if ((legCounter - 1) < 0){
      legCounter = (destinations.length-2)
      getLeg();
      updateLegDataGeocode();
    }

      //otherwise they have navigated through the legs
      //so decrementing legcounter will allow user
      //to see the previous leg
    else {
    legCounter--;
    getLeg();
    updateLegDataGeocode();
    }
    viewedEvents = []; //again resets viewedEvents so prior city events do not carry over to previous leg
  })
}

function watchEventsNavigate(){ //this ensures users always see events
  $(".next-events-button").on("click", function(){
    //if eventsList has been emptied by user scrolling through it, this resets everything to beginning
    //by navigating through events, 6 events are removed from eventList, when eventList is empty
    //then the events that were returned for that particular page have all been seen
    //if pageCount does not equaly eventPages then there are additional pages of events
    //to be called. This function calls them by increasing pageCount and then recalling
    //logEventBriteData
    if (eventsList.length == 0 && pageCount != eventPages){
      pageCount++
      nextPushed++
      prevPushed--
        //this function shows a loading gif while logEventBriteData is loading the data
      $("#event-holder").html("<div id =\"load-gif\"><img src=\"resources/Preloader_2.gif\"></div>").load(logEventBriteData());
    }

      //similar functionality as above except if pageCoutn == eventPages
      //then user has looked at all events in that city
      //so it resets everything as it was when the app first loaded
      //and recalls logEventBriteData.
    else if(eventsList.length == 0 && pageCount == eventPages){
      pageCount = 1;
      nextPushed = 0;
      prevPushed = 0;
      eventsList = [];
      viewedEvents = [];
        //again shows a loading gif while event data is loaded
      $("#event-holder").html("<div id =\"load-gif\"><img src=\"resources/Preloader_2.gif\"></div>").load(logEventBriteData());
    }

      //if eventsList.length does not equal zero, then there are still
      //events to be displayed in eventsList. This increments nextPushed by 1
      //to be used in nextEventsPage
    else { //increments eventnavbutton counters for use in functions 
      nextPushed++
      prevPushed--
    }

    nextEventsPage(); //uses nextPushed variable to display next events as set by previous conditional statements


    if (nextPushed == 0){ //if nextpushed equals zero then there are no previous events to show, so previous is hidden
      $(".prev-events-button").addClass("hidden")
    }

      //in any other case, previous is seen because next has been pushed
    else{
      $(".prev-events-button").removeClass("hidden")
    };
  })


  $(".prev-events-button").on("click", function(){
    prevPushed++
    nextPushed--
    prevEventsPage(); //uses prevPushed to scroll back through data
    if (nextPushed == 0){ //hides previous event if user has backed to the first events
      $(".prev-events-button").addClass("hidden")
    }
  })
}

function watchTripEdit(){ //if user wants to edit trip, this calls down the begin page with an adjusted height
  $("#edit-trip").on("click", function(){
    $("#begin-page-container").removeClass("begin-page-height-full");
    $("#begin-page-container").removeClass("begin-page-height-auto");
    $("#begin-page-container").fadeToggle("slow", function(){
      $(".roadtrip-inputs").slideToggle("slow")
      $("#results-nav").toggleClass("hidden");
      $("#footer-nav").toggleClass("hidden");
    })
  }) 
}

$(function(){
  startCalendar();
  watchInputClick();
  preventPastDate();
  randomizePlaceHolder(); //randomizes placeholder on first load
  setInterval(function(){randomizePlaceHolder()}, 5000); //randomizes placeholder every 5 seconds thereafter
  autoComplete();
  watchFormSubmit();
  addDest();
  removeDest();
  watchEventsNavigate();
  watchLegsNavigate();
  watchTripEdit();
})