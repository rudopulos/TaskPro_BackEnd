require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");
const startKeepAlive = require("./helpers/keepAlive");

const { DB_HOST, SERVER_URL } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Database connection successful. Listening on port ${port}`);
      // Start keep-alive pings to prevent Render free-tier cold starts
      startKeepAlive(SERVER_URL);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });

