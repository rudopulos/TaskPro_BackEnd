/**
 * keepAlive.js
 * Sends a periodic self-ping to prevent Render.com free tier from spinning down.
 * The free tier sleeps after ~15 minutes of inactivity.
 * This pings the server every 14 minutes to keep it warm.
 */

const https = require("https");
const http = require("http");

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

function startKeepAlive(serverUrl) {
  if (!serverUrl) {
    console.warn(
      "[KeepAlive] SERVER_URL not set — skipping keep-alive pings."
    );
    return;
  }

  const isHttps = serverUrl.startsWith("https");
  const lib = isHttps ? https : http;
  const pingUrl = `${serverUrl.replace(/\/$/, "")}/health`;

  const ping = () => {
    lib
      .get(pingUrl, (res) => {
        console.log(
          `[KeepAlive] Pinged ${pingUrl} — status: ${res.statusCode}`
        );
      })
      .on("error", (err) => {
        console.warn(`[KeepAlive] Ping failed: ${err.message}`);
      });
  };

  // Wait 1 minute after startup before first ping
  setTimeout(() => {
    ping();
    setInterval(ping, PING_INTERVAL_MS);
  }, 60 * 1000);

  console.log(
    `[KeepAlive] Scheduled keep-alive pings every 14 minutes → ${pingUrl}`
  );
}

module.exports = startKeepAlive;
