// GoogleMaps Apikey =  AIzaSyCMCPU7PyFM8_7KihOTm3T_cfitx-494cQ 

// GoogleMaps API Call

// allows for additional destinations
function addDest(){
	var counter = 1;
	$("#destination-form").on("click", "#js-addDest", function(event){
		event.preventDefault();
		var newDestForm = "<br><input type=\"text\" name=\"dest-" + counter + "\" placeholder=\"Destination-" +counter+ "\"><input type=\"text\" name=\"Dest-" +counter+ "-date\" placeholder=\"length of stay\"><button id=\"js-addDest\">Add Destination</button>";
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

$(function(){ //ready function
	addDest();
	routeDest();
});