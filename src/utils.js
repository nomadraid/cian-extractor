module.exports = function buildSearchURL(dealType, points) {
    area = [
        points[0].lat.toFixed(6) + '_' + points[0].lon.toFixed(6),
        points[0].lat.toFixed(6) + '_' + points[1].lon.toFixed(6),
        points[1].lat.toFixed(6) + '_' + points[1].lon.toFixed(6),
        points[1].lat.toFixed(6) + '_' + points[0].lon.toFixed(6)
    ];
    return `https://map.cian.ru/ajax/map/roundabout/?deal_type={}&engine_version=2&in_polygon[0]=` + area.join(',');
}

module.exports = function areaSplit(points) {
    center_lat = points[0].lat + (points[1].lat - points[0].lat) / 2;
    center_lon = points[0].lon + (points[1].lon - points[0].lon) / 2;
    let newAreas = [
        [
            { lat: points[0].lat, lon: points[0].lon },
            { lat: center_lat, lon: center_lon }
        ],
        [
            { lat: center_lat, lon: points[0].lon },
            { lat: points[1].lat, lon: center_lon }
        ],
        [
            { lat: center_lat, lon: center_lon },
            { lat: points[1].lat, lon: points[1].lon }
        ],
        [
            { lat: points[0].lat, lon: center_lon },
            { lat: center_lat, lon: points[1].lon }
        ]
    ];

    return newAreas;
}