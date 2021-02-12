let max_distance = 100;


module.exports.line_check = (name, map, stops) => {
    if (!name) {
        return false;
    }
    for (let i = 0; i < map.length; i++) {
        if (!map[i].lat) {
            return false;
        }
        if (!map[i].long) {
            return false;
        }
    }
    for (let i = 0; i < stops.length; i++) {
        if (!stops[i].name) {
            return false;
        }
        if (!stops[i].lat) {
            return false;
        }
        if (!stops[i].long) {
            return false;
        }
    }
    return true;
}

module.exports.line_is_new = (name, data) => {
    for (let i = 0; i < data.length; i++) {
        if (data[i].name == name) {
            return false;
        }
    }
    return true;
}

module.exports.bus_check = (bus_imei, line, data) => {
    if (!bus_imei) { return false; }
    if (!line) { return false; }
    if (this.line_is_new(line, data)) { return false; }
    return true;
}

module.exports.bus_is_new = (imei, buses) => {
    for (let j = 0; j < buses.length; j++) {
        if (buses[j].imei == imei) {
            return false;
        }
    }
    return true;
}

module.exports.buses_in_line = (name, buses) => {
    for (let i = 0; i < buses.length; i++) {
        if (buses[i].line == name) {
            return true;
        }
    }
    return false;
}


module.exports.bus_indx = (imei, data) => {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].buses.length; j++) {
            if (data[i].buses[j].imei == imei) {
                return { i, j };
            }
        }
    }
}

module.exports.posted_location = (imei, q, buses) => {
    if (this.bus_is_new(imei, buses)) {
        return false;
    }
    if (!q.longitude) {
        return false;
    }
    if (!q.latitude) {
        return false;
    }
    return true;
}

module.exports.in_line = (lat, long, map) => {
    for (let i = 1; i < map.length; i++) {
        if (getDistanceFromLatLonInKm(lat, long, lat + distance(map[i - 1].lat, map[i - 1].long, map[i].lat, map[i].long, lat, long), long) * 1000 < max_distance) {
            return true;
        }
    }
    return false;
}


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function distance(t1, g1, t2, g2, T, G) {
    return ((T * g1) - (T * g2) - (G * t1) + (G * t2) - (g1 * t2) + (g2 * t1)) / Math.sqrt((t1 * t1) + (t2 * t2) - (2 * t1 * t2) + (g1 * g1) + (g2 * g2) - (2 * g1 * g2));
}