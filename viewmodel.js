
// Google Maps Setup

var map;
var markers = [];
var prevInfo;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      // Initialize the map in Jamaica Plain, MA
      center: {lat: 42.316, lng: -71.108},
      zoom: 15
    });

    // Initialize Model
    var lm = new locationsModel();
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
    var infowindow = new google.maps.InfoWindow({
        content: info
    });
    marker.addListener('click', function() {
        infowindow.open(map, marker);
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

function locationsModel() {
    var self = this;

    // Define the observables
    self.locList = ko.observableArray([]);
    self.inputStr = ko.observable();

    // Function that runs when a location is clicked
    self.locClick = function(locList) {
        // Close existing infowindow
        if ( prevInfo ) {
            prevInfo.close();
        }
        // Refocus map to selected marker
        markers[locList.markerId].setMap(map);
        // Create and open new infowindow
        var infowindow = new google.maps.InfoWindow({
            content: locList.info
        });
        prevInfo = infowindow;
        infowindow.open(map, markers[locList.markerId]);
        // Trigger animation for selected marker
        markers[locList.markerId].setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ markers[locList.markerId].setAnimation(null); }, 1400);
    }

    // Subscription to inputStr
    self.inputStr.subscribe(function () {
        self.locList.removeAll();
        deleteMarkers();

        // if map.getBounds is not loaded yet, use static coordinates
        // otherwise, use bounds of visible map
        if (map.getBounds() === undefined) {
            var ne = "42.32612215837413,-71.09261484909058";
            var sw = "42.30587621328585,-71.12338515090943";
        } else {
            var ne = map.getBounds().getNorthEast().toString().replace("(","").replace(")","");
            var sw = map.getBounds().getSouthWest().toString().replace("(","").replace(")","");
        }

        // Foursquare API query
        fsqAPI = "https://api.foursquare.com/v2/venues/search?" +
            "client_id=TAJCYHSAH4PYSYF5GBE4UVOFHQBH0NJOG4PKW1MQGYU0ROVO&" +
            "client_secret=AIEGRSOPKRAABWIRVL2XS4BWUTESQABTLCODHC2UYHHSLV1B&" +
            "ne=" + ne +
            "&sw=" + sw +
            "&query=" + self.inputStr() +
            "&v=20170501&" +
            "m=foursquare&" +
            "intent=browse";

        // Get JSON from API result
        $.ajax({
            url: fsqAPI,
            dataType: 'json',
            success: function( result ) {
                $.each(result.response.venues, function(key, value){
                    if (value.name.toLowerCase().includes(self.inputStr().toLowerCase())) {
                        // Parse the JSON for relevant info
                        var latLng = {lat: value.location.lat, lng: value.location.lng};
                        var info = "<b>" + value.name + "</b><br>" + value.location.address;
                        // Create the new map marker
                        var markerId = addMarker(latLng, value.name, info);
                        // Store the new location to an array
                        self.locList.push({
                            locName: value.name,
                            lat: value.location.lat,
                            lng: value.location.lng,
                            markerId: markerId,
                            info: info
                        });
                    }
                })
                showMarkers();
            },
            error: function ( result ) {
                alert( "There was an error getting data from Foursquare");
            }
        })
    });
};