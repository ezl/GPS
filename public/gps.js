// Thanks for the distance function, http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
var rad = function(x) {
	return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
	var R = 6378137; // Earth’s mean radius in meter
	var dLat = rad(p2.lat() - p1.lat());
	var dLong = rad(p2.lng() - p1.lng());
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
		Math.sin(dLong / 2) * Math.sin(dLong / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d; // returns the distance in meter
};

function initialize() {
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(-.397, 150.644)
	};
	var map = new google.maps.Map(document.getElementById('map'),mapOptions);
	var bounds = new google.maps.LatLngBounds();
	var plotLocationsLines = function(result) {

		// First just push all the points into an array
		var locations = [];
		_.each(result.locations, function(location){
			var location = new google.maps.LatLng(location.latitude, location.longitude);
			locations.push(location);
			bounds.extend(location);
		});
		map.fitBounds(bounds);

		// Use a ghetto cheap rule for crafting a "heat map"
		// Fat lines if you're moving slowly, thin lines if you're moving fast
		// High opacity if you're moving slowly, translucent if you're moving fast

		// First just order all the distances
		var distances = []
		for (i = 0; i < locations.length - 1; i++) {
			distances.push(getDistance(locations[i+1], locations[i]));
		}
		distances.sort();

		// OK, lets draw some line segments
		for (i = 0; i < locations.length - 1; i++) {
			var segment = [
				locations[i+1],
				locations[i]
			];
			distance = getDistance(locations[i+1], locations[i]);
			console.log( 1 + ((1 - (_.sortedIndex(distances, distance) / distances.length)) * 100) / 9);
			var path = new google.maps.Polyline({
				path: segment,
				geodesic: true,
				strokeColor: '#900',
				strokeOpacity: .3 + (1 - (_.sortedIndex(distances, distance) / distances.length)) * 0.5, // values between .3 and .8, linear
				strokeWeight: 5 + ((1 - (_.sortedIndex(distances, distance) / distances.length)) * 100) / 2, // 5px min, 55 px max. no logic there, just tinkered
			});
			path.setMap(map);
		}
	};
	var plotLocationsMarkers = function(result) {
		var locations = [];
		_.each(result.locations, function(location){
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(location.latitude, location.longitude),
				map: map,
				title: location.provider
			});
			bounds.extend(marker.position);
		});
		map.fitBounds(bounds);
	};
	var plotLocations = plotLocationsLines;
	$.ajax({
		url: 'get_gps',
		data: {
			numberOfPoints: 10000
		},
		dataType: 'json',
		success: plotLocations,
	});
}

google.maps.event.addDomListener(window, 'load', initialize);
