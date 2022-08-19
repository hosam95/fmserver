const data = require("../controllers/controllers.js");
const tickets=require("../tickets/controllers");

module.exports = app => {

    /*BUSES APIs:- */

    // add a new category.
    app.post("/category/add",data.new_category);

    //update a category.
    app.post("/category/update/:id",data.update_category);

    //delete a category.
    app.delete("/category/delete/:id",data.delete_category);

    //get categories.
    app.get("/category",data.get_categories)

    //stop sharing location.
    app.post("/enduser/hide/:line",data.remove_enduser_location);

    //send current location.
    app.post("/enduser/:line/location",data.add_enduser_location);

    // get the endusers locations.
    app.get("/bus/:imei/users",data.get_endusers_locations);
    app.get("/endusers/locations",data.get_all_endusers_locations)

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
    
    // add user
    app.post("/users/new", data.add_user);

    // Update user
    app.post("/users/:username", data.update_user);

    // Delete user
    app.delete("/users/:username", data.delete_user);

    // get user
    app.get("/users/:username", data.get_user);

    // Create a new or update line.
    app.post("/line/:name", data.add_or_update_line);

    // Add a new bus.
    app.post("/bus/:imei", data.add_or_update_bus);

    // Set enable bus
    app.post("/bus/:imei/setactive", data.setActiveBus);

    //send out of bounds buses.
    app.get("/outofbounds/current", data.out_of_bounds);

    //send out of bouns history.
    app.get("/outofbounds/history", data.out_of_bounds_history);

    //Send buses location.
    app.get("/buses", data.get_buses);
    app.get("/buses/:imei", data.get_bus);

    // Send the map data.
    app.get('/lines', data.get_map);
    app.get('/lines/:name', data.get_line);
    app.get('/lines/index/:line_index', data.get_line);

    // Delete a line with line-name.
    app.delete("/line/:name", data.remove_line);

    // Delete a bus with bus_imei.
    app.delete("/bus/:imei", data.remove_bus);

    // Update the data of a bus.
    app.put("/bus/:imei", data.update_bus);

    //upload the Bus Location.
    app.put("/bus/:imei/location", data.post_location);

    //testing api.
    app.get('/test', data.testing);

    /* // Send the database tables.
    app.get("/data", data.send_db);
    */
   /**************************************************************************************************************** */
    //TICKETS APIs:-

    //driver:
    app.post("/ticket/new",tickets.add_ticket);

    //app.get("/ticket/score",tickets.get_score);

    //admin:
    app.get("/ticket/search",tickets.get_tickets);
    app.get("/ticket/search/total",tickets.get_tickets_total);


    app.post("/driver/checkout/:driver_id",tickets.driver_checkout);

    app.get("/req/ticket/search",tickets.get_req_tickets);


    
};