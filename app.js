// Load the necessary modules
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

// Load the user route module
const UserRouter = require("./src/routes/users");

// Load the port number from the config file
const { port } = require("./src/config/index");

// Load the cors module
const cors = require("cors");

// Load the environment variables from the .env file
dotenv.config({});

// Enable CORS for all origins
app.use(
  cors({
    origin: "*",
  })
);

// Parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Mount the user route at the "/apis/user" path
app.use("/apis/user", UserRouter);

// Start the server and listen on the specified port
app.listen(port, (err) => {
  // Log an error if there was an error in server setup
  if (err) console.log("Error in server setup");

  // Log a success message with the server port number
  console.log("Server listening on Port", port);
});
