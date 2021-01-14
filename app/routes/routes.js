const data = require("../controllers/controllers.js");

module.exports = app => {
   
    //Send the Bus Location.
    app.put("/location", data.post_location);

    // Send the map data.
    app.get('/map', data.get_map);

    // Create a new line.
    app.post("/addline", data.add_line);

    // Ad a new bus.
    app.post("/addbus", data.add_bus);
  

    // Delete a line with line-name.
    app.delete("/deleteline", data.remove_line);

    // Delete a bus with bus_imei.
    app.delete("/deletebus", data.remove_bus);

    // Update the data of a bus.
    app.put("/update", data.update_bus);   
  
    /* // Send the database tables.
    app.get("/data", data.send_db);
   */
  
  };