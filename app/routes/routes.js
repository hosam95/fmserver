const data = require("../controllers/controllers.js");

module.exports = app => {

    //stop sharing location.
    app.post("/enduser/hide/:line",data.remove_enduser_location);

    //send current location.
    app.post("/enduser/:line/location",data.add_enduser_location);

    // get the endusers locations.
    app.get("/bus/:imei/users",data.get_endusers_locations);

    //Log In.
    app.post("/login", data.log_in);

    // Validate token
    app.post("/validate", data.validate_token);

    // Update password
    app.post("/updatepassword", data.update_password);

    // Get all users
    app.get("/users", data.get_users);

    // Update or add user
    app.post("/users", data.update_or_add_user);

    // Delete user
    app.delete("/users/:username", data.delete_user);

    // Create a new or update line.
    app.post("/line/:name", data.add_or_update_line);

    // Add a new bus.
    app.post("/bus/:imei", data.add_or_update_bus);

    // Set enable bus
    app.post("/bus/:imei/setactive", data.setActiveBus);

    //send out of bounds buses.
    app.get("/outofbounds", data.out_of_bounds);

    //send out of bouns history.
    app.get("/outofbounds/history", data.out_of_bounds_history);

    //Send buses location.
    app.get("/buses", data.get_buses);
    app.get("/buses/:imei", data.get_bus);

    // Send the map data.
    app.get('/lines', data.get_map);
    app.get('/lines/:name', data.get_line);

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