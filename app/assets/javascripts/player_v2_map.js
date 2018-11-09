$(document).on('turbolinks:load', function () {

    var map;    // Map used mainly
    var currentPos; // Current position (refreshed every 10 seconds)
    var routes; // Routes calculated

    // Notice when geolocation not supported
    if (!navigator.geolocation){
        console.log("Geolocation not supported.");
        return;
    }
    
    // Initialize map
    initMap();

    // Refresh map each 10 seconds
    setInterval(function(){
        // Set distination
        refreshPlace(false);
    },10000);

    function initMap() {
        // Google Mapsに書き出し
        map = new google.maps.Map(document.getElementById('map'));

        refreshPlace(true);
    }

    function getRemainingLength() {
        if(!routes) return;
        distances = routes.map(function (r){
            return google.maps.geometry.spherical.computeDistanceBetween(currentPos, r.start_location);
        });

        distanceToNearestPoint = Math.min.apply(null, distances);
        nearestPointIndex = distances.indexOf(distanceToNearestPoint);
        
        remainingLength = 0;
        for (i = distances.length - 1; i > nearestPointIndex; i--){
            remainingLength += routes[i].distance.value;
        }
        return remainingLength;
    }

    function refreshPlace(with_route_refresh) {
        var output = document.getElementById("result");
        
        function success(position) {
            var latitude  = position.coords.latitude;//緯度
            var longitude = position.coords.longitude;//経度
            output.innerHTML = '<p>緯度 ' + latitude + '° <br>経度 ' + longitude + '°</p>';
            // 位置情報
            currentPos = new google.maps.LatLng( latitude , longitude ) ;
            
            // マーカーの新規出力
            new google.maps.Marker( {
                map: map ,
                position: currentPos ,
            });
            map.panTo(currentPos);

            if(with_route_refresh == true){
                setDist();
            }

            console.log("REMAINING METER: " + getRemainingLength());
        };
        function error() {
            //エラーの場合
            output.innerHTML = "座標位置を取得できません";
        };

        navigator.geolocation.getCurrentPosition(success, error);//成功と失敗を判断
    };

    function setDist(){
        var directionsDisplay = new google.maps.DirectionsRenderer({
            map: map, // 描画先の地図
            draggable: true, // ドラッグ可
            preserveViewport: true // centerの座標、ズームレベルで表示
        });
        var directionsService = new google.maps.DirectionsService();
        directionsDisplay.setMap(map);

        var request = {
            origin: currentPos, // スタート地点
            destination: new google.maps.LatLng(35.712408, 139.776188), // ゴール地点
            travelMode: google.maps.DirectionsTravelMode.WALKING, // 移動手段
        };
        directionsService.route(request, function(response,status) {
            if (status === google.maps.DirectionsStatus.OK) {
                new google.maps.DirectionsRenderer({
                    map: map,
                    directions: response,
                    suppressMarkers: true // デフォルトのマーカーを削除
                });

                routes = response.routes[0].legs[0].steps;

                $routelist = $('#routelist');
                $.each(routes, function(index, value){
                    $routelist.append('<tr><td>' + value.start_location + '</td><td>' + value.maneuver + '</td><td>' + value.distance.value + '</td></tr>')
                });
            }
        });
    }
});
