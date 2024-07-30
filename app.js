// Load the necessary modules
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const session = require("express-session");
const path = require('path');

// Load the user route module
const UserRouter = require("./src/routes/users");
// Load the social route module
const SocialAuthRouter = require("./src/routes/auth");

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
// for handling form data
app.use(bodyParser.urlencoded({ extended: false }));
// Parse incoming requests with JSON payloads
app.use(bodyParser.json());


app.use(cookieParser());
app.use(
  session({
    secret: "your_secret_key", // Replace with a strong, random secret key
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: false }, // Set to true if using HTTPS in production
  })
);

app.use(passport.initialize());
app.use(passport.session());

//
require("./src/middlewares/passport-setup.js");

// Mount the Social authentication route at the "/apis/auth" path
app.use("/apis/auth", SocialAuthRouter);

// Mount the user route at the "/apis/user" path
app.use("/apis/user", UserRouter);

// Routes for handling facebook posting
app.use("/apis/facebook", require("./src/routes/facebook"));

// Routes for handling user pages relation posting
app.use("/apis/userPages", require("./src/routes/userPages"));

// Routes for handling user postings
app.use("/apis/posts", require("./src/routes/posts"));

// Routes for handling instagram posting
app.use("/apis/instagram", require("./src/routes/instagram"));

// Routes for handling twitter posting
app.use("/apis/twitter", require("./src/routes/twitter"));

// Routes for handling linkedin posting
app.use("/apis/linkedin", require("./src/routes/linkedin"));

// Start the server and listen on the specified port
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, (err) => {
  // Log an error if there was an error in server setup
  if (err) console.log("Error in server setup");

  // Log a success message with the server port number
  console.log("Server listening on Port", port);
});
