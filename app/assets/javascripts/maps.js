var map, infoWindow, pos;
var style = read_style();
var styles = {
    default: style,
    hide: style.concat([
        {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
        }
    ])
};

function initMap() {
    console.log('Debug');

    var bounds = new google.maps.LatLngBounds;
    var geocoder = new google.maps.Geocoder;
    var markerArray = [];
    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer();
    var service = new google.maps.DistanceMatrixService;

    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 35.5709605, lng: 139.63446 },
        zoom: 20,
        styles: styles['default'],
    });

    directionsDisplay.setMap(map);
    //directionsDisplay.setPanel(document.getElementById('right-panel'));
    infoWindow = new google.maps.InfoWindow;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

        console.log('lat: ', position.coords.latitude);
        console.log('lng: ', position.coords.longitude);

        infoWindow.setPosition(pos);
        infoWindow.setContent('Location found.');
        infoWindow.open(map);
        map.setCenter(pos);

    }, function () {
        handleLocationError(true, infoWindow, map.getCenter());
    });
} else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
}

new AutocompleteDirectionsHandler(map, pos);
    
var button = document.getElementById("button");
button.addEventListener('click', function () {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
});

var styleControl = document.getElementById('style-selector-control');
map.controls[google.maps.ControlPosition.TOP_LEFT].push(styleControl);

document.getElementById('hide-poi').addEventListener('click', function () {
    map.setOptions({ styles: styles['hide'] });
});

document.getElementById('show-poi').addEventListener('click', function () {
    map.setOptions({ styles: styles['default'] });
});
}

function AutocompleteDirectionsHandler(map) {
    this.map = map;
    this.originPlaceId = null;
    this.destinationPlaceId = null;
    this.travelMode = 'WALKING';
    
    var originInput = document.getElementById('start');
    var waypointInput = document.getElementById('waypoint');
    var destinationInput = document.getElementById('end');
    var buttonInput = document.getElementById('button');

    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsDisplay.setMap(map);

    var originAutocomplete = new google.maps.places.Autocomplete(
        originInput, { placeIdOnly: true });
    var originAutocomplete = new google.maps.places.Autocomplete(
        waypointInput, { placeIdOnly: true });
    var destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput, { placeIdOnly: true });

    this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
    this.setupPlaceChangedListener(originAutocomplete, 'WAYPOINT');
    this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(waypointInput);
    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);
    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(buttonInput);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function (autocomplete, mode) {
var me = this;
autocomplete.bindTo('bounds', this.map);
autocomplete.addListener('place_changed', function () {
    var place = autocomplete.getPlace();
    if (!place.place_id) {
        window.alert("Please select an option from the dropdown list.");
        return;
    }
    if (mode === 'ORIG') {
        me.originPlaceId = place.place_id;
    } else {
        me.destinationPlaceId = place.place_id;
    }
    me.route();
});
};

AutocompleteDirectionsHandler.prototype.route = function () {
if (!this.originPlaceId || !this.destinationPlaceId) {
    return;
}
var me = this;

this.directionsService.route({
    origin: { 'placeId': this.originPlaceId },
    destination: { 'placeId': this.destinationPlaceId },
    travelMode: this.travelMode
}, function (response, status) {
    if (status === 'OK') {
        me.directionsDisplay.setDirections(response);
    } else {
        window.alert('Directions request failed due to ' + status);
    }
});
};

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
var waypts = [];

if (document.getElementById('waypoint').value) {
    waypts.push({
        location: document.getElementById('waypoint').value,
        stopover: true,
    });
}

directionsService.route({
    origin: document.getElementById('start').value,
    destination: document.getElementById('end').value,
    waypoints: waypts,
    optimizeWaypoints: true,
    travelMode: 'WALKING'
}, function (response, status) {
    if (status === 'OK') {
        directionsDisplay.setDirections(response);

        var distance = 0
        var route = response.routes[0];
        var summaryPanel = document.getElementById('directions-panel');
        summaryPanel.innerHTML = '';

        if (waypts.length != 0) {
            for (var i = 0; i < route.legs.length; i++) {
                var routeSegment = i + 1;
                distance += route.legs[i].distance.value;
                //summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment + '</b><br>';
                //summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                //summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                //summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
            }
        } else {
            distance = route.legs[0].distance.value;
        }

        //summaryPanel.innerHTML += '<b>Route</b><br>';
        //summaryPanel.innerHTML += route.legs[0].start_address + ' to ';
        //summaryPanel.innerHTML += route.legs[route.legs.length - 1].end_address + '<br>';
        summaryPanel.innerHTML += '目的地まで: ' + String(parseFloat(distance / 1000, 2)) + ' km!<br><br>';
        console.log("Start:" + route.legs[0].start_address)
        console.log("End:" + route.legs[route.legs.length - 1].end_address)

        document.getElementById('distance').value = parseFloat(distance / 1000, 2)
        console.log("distance set:" + parseFloat(distance / 1000, 2))
    } else {
        window.alert('Directions request failed due to ' + status);
    }
});
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
infoWindow.setPosition(pos);
infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
infoWindow.open(map);
}