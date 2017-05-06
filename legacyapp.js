// GoogleMaps Apikey =  AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ 

// GoogleMaps API Call

var EVENTBRITE_BASE_URL = "https://www.eventbriteapi.com/v3/events/search/"

// allows for additional destinations
function addDest(){
	var counter = 1;
	$("#destination-form").on("click", "#js-addDest", function(event){
		event.preventDefault();
		var newDestForm = "<br><input type=\"text\" name=\"dest-" + counter + "\" class=\"js-destination\" placeholder=\"Destination-" +counter+ "\"><input type=\"text\" name=\"Dest-" +counter+ "-date\" placeholder=\"length of stay\"><button id=\"js-addDest\">Add Destination</button>";
		$(this).after(newDestForm);
		counter++;
	})
};


//Route between start and end destinations

function routeDest(){
	var resultElement = "";
	$("#js-form-submit").on("click", function(event){
		event.preventDefault();
		var start = $("#start").val();
		start = start.replace(/ /g, "%20");
		var end = $("#end").val();
		end = end.replace(" ", "%20");
		resultElement += "<iframe width=\"600\" height=\"450\" frameborder=\"0\" style=\"border:0\" src=\"https://www.google.com/maps/embed/v1/directions?"+
			"origin=" + start + 
			"&destination=" + end + 
			"&key=AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ\"" +
			"allowfullscreen></iframe>";
		$("#map-holder").html(resultElement);
	})
}

function getDataFromEventBrite(callback){
	var query = {
		"location.latitude": 29.7604267, //need to determine how to get latitude of inputted city
		"location.longitude": -95.3698028, //need to determine how to get longitude
		"start_date.range_start": $("#start-date").val() + "T13:00:00",
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
	$("#js-form-submit").on("click", function(event){
		getDataFromEventBrite(displayEventBriteData);
	})
}

$(function(){ //ready function
	addDest();
	routeDest();
	logEventBriteData();
});