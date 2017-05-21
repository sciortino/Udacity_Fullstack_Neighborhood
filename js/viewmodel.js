
// Google Maps Setup

var map;
var infowindow;
var locListInit = [];
var markers = [];

function mapError() {
    alert("There was an error loading from Google Maps.");
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      // Initialize the map in Jamaica Plain, MA
      center: {lat: 42.316, lng: -71.108},
      zoom: 15
    });

    infowindow = new google.maps.InfoWindow();

    // Initialize Model
    var lm = new LocationsModel();
    ko.applyBindings(lm);
    lm.inputStr('Pizza');
}

//Marker Functions below come from Google's Documentation:
//https://developers.google.com/maps/documentation/javascript/examples/marker-remove

// Adds a marker to the map and push to the array.
function addMarker(location, name, info) {
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      title: name
    });
    marker.addListener('click', function() {
        infowindow.setContent(info);
        infowindow.open(map, marker);
        // Refocus map to selected marker
        marker.setMap(map);
        // Trigger animation for selected marker
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ marker.setAnimation(null); }, 1400);
    });
    markers.push(marker);

    return markers.length - 1;
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
}

//End of Functions from Google

//Define Model

function LocationsModel() {
    var self = this;

    // Define the observables
    self.locList = ko.observableArray([]);
    self.inputStr = ko.observable();

    // Populate locList with Foursquare data

    // Set coordinates
    var ne = "42.32612215837413,-71.09261484909058";
    var sw = "42.30587621328585,-71.12338515090943";

    // Foursquare API query
    fsqAPI = "https://api.foursquare.com/v2/venues/search?" +
        "client_id=TAJCYHSAH4PYSYF5GBE4UVOFHQBH0NJOG4PKW1MQGYU0ROVO&" +
        "client_secret=AIEGRSOPKRAABWIRVL2XS4BWUTESQABTLCODHC2UYHHSLV1B&" +
        "ne=" + ne +
        "&sw=" + sw +
        "&query=Pizza" +
        "&v=20170501&" +
        "m=foursquare&" +
        "intent=browse";

    // Get JSON from API result
    $.ajax({
        url: fsqAPI,
        dataType: 'json',
        success: function( result ) {
            $.each(result.response.venues, function(key, value){
                if (value.name) {
                    // Parse the JSON for relevant info
                    var latLng = {lat: value.location.lat, lng: value.location.lng};
                    var address = value.location.address ? value.location.address : "No address provided";
                    var info = "<b>" + value.name + "</b><br>" + address;
                    // Create the new map marker
                    var markerId = addMarker(latLng, value.name, info);
                    // Store the new location to an array
                    locListInit.push({
                        locName: value.name,
                        lat: value.location.lat,
                        lng: value.location.lng,
                        markerId: markerId,
                        info: info
                    });
                }
            });

            for (var i in locListInit) {
                if ( locListInit[i] ) {
                    self.locList.push(locListInit[i]);
                }
            }
            showMarkers();
        },
        error: function ( result ) {
            alert( "There was an error getting data from Foursquare");
        }
    });

    // Function that runs when a location is clicked
    self.locClick = function(locList) {
        // Close existing infowindow
        if ( infowindow ) {
            infowindow.close();
        }
        // Refocus map to selected marker
        markers[locList.markerId].setMap(map);
        // Load and open infowindow
        infowindow.setContent(locList.info);
        infowindow.open(map, markers[locList.markerId]);
        // Trigger animation for selected marker
        markers[locList.markerId].setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ markers[locList.markerId].setAnimation(null); }, 1400);
    };

    // Subscription to inputStr
    self.inputStr.subscribe(function () {
        // Clear out observable array
        self.locList.removeAll();
        // Remove existing markers from the map
        deleteMarkers();

        // Search the observable array for matches
        for(var i in locListInit) {
            if(locListInit[i].locName) {
                if(locListInit[i].locName.toLowerCase().includes(self.inputStr().toLowerCase())) {
                    var latLng = {lat: locListInit[i].lat, lng: locListInit[i].lng};
                    // Create the new map marker
                    var markerId = addMarker(latLng, locListInit[i].locName, locListInit[i].info);
                    // Add item to viewmodel
                    self.locList.push({
                        locName: locListInit[i].locName,
                        lat: locListInit[i].lat,
                        lng: locListInit[i].lng,
                        markerId: markerId,
                        info: locListInit[i].info
                    });
                }
            }
        }
        showMarkers();
    });
}