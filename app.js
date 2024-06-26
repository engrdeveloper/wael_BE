const express = require('express')
const app = express()
const dotenv = require('dotenv')
const bodyParser = require('body-parser');
const UserRouter = require('./src/routes/users')
const {port} = require('./src/config/index')
const cors = require('cors')

dotenv.config({})

app.use(cors({
    origin: "*"
}))

app.use(bodyParser.json());

app.use("/apis/user", UserRouter);

app.listen(port, (err) => {
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", port);
})