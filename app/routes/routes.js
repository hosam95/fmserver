const data = require("../controllers/controllers.js");

module.exports = app => {
    //Log In.
    app.post("/login", data.log_in);

    // Validate token
    app.post("/validate", data.validate_token);

    // Create a new or update line.
    app.post("/line/:name", data.add_or_update_line);

    // Ad a new bus.
    app.post("/bus/:imei", data.add_or_update_bus);

    //send out of bounds buses.
    app.get("/outofbounds", data.out_of_bounds);

    //send out of bouns history.
    app.get("/outofbounds/history", data.out_of_bounds_history);

    //Send buses location.
    app.get("/buses", data.get_buses);

    // Send the map data.
    app.get('/lines', data.get_map);

    // Delete a line with line-name.
    app.delete("/line/:name", data.remove_line);

    // Delete a bus with bus_imei.
    app.delete("/bus/:imei", data.remove_bus);

    // Update the data of a bus.
    app.put("/bus/:imei", data.update_bus);

    //upload the Bus Location.
    app.put("/bus/:imei/location", data.post_location);

    /* // Send the database tables.
    app.get("/data", data.send_db);
   */

};