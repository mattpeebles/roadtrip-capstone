# wandery

https://mattpeebles.github.io/wandery/

 ## Table of Contents ##
	1. [Introduction](#introduction)
	1. [Screen Shots](#screen-shots)
	1. [Technology Used](#tech-used)
	1. [Future Plans](#future-plans)

**Introduction**<a name="introduction"></a>
	This application is designed to make it easier to design roadtrips with any number of stops. Users enter
	the length of time they are staying in each destination and the day they begin the roadtrip. The app then
	breaks the trip into legs of two cities each, the starting city and the destination city. In addition to a 
	google map detailing the route between the two cities, the app also provides a list of events based on the
	length of stay the user inputs. The user is able to see a short description, the date/time, the name of the 
	event, and whether or not it is free or paid. They are also able to click the logo or the view more hyperlink
	to be taken to EventBrite's website in order to read a more detailed description or purchase tickets if 
	the organizer permits.
	Of course, a user can make as many edits to the roadtrip as they please. By clicking the _edit trip_ 
	button in the nav bar, users are able to add and remove cities as they please and reorder their roadtrip. 

**Screen Shots**<a name="screen-shots"></a>
	* Landing Page
	* Edit Trip
	* Map w/o leg navigation
	* Map w/ leg navigation
	* First Event Page
	* Subsequent Event Pages

**Technology Used**<a name="tech-used"></a>
	* HTML
	* CSS
		* [Bootstrap](http://getbootstrap.com/)
	* JavaScript
	* jQuery
		* [jQueryUI](https://jqueryui.com/)
	* API Calls
		* [EventBrite](https://www.eventbrite.com/developer/v3/)
		* [Google Autocomplete](https://developers.google.com/maps/documentation/javascript/places-autocomplete)
		* [Google Geocoding](https://developers.google.com/maps/documentation/geocoding/intro)

**Future Plans**<a name="future-plans"></a>
	* to catch spelled out numbers and use them rather than throwing alert
		* https://www.npmjs.com/package/words-to-num
	* Adding weather functionality to display forecast along route