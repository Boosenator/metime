const https = require("https");
const fs = require("fs");
const path = require("path");

const url =
  "https://cdn.pixabay.com/video/2024/02/01/199089-908798043_tiny.mp4";
const dest = "/vercel/share/v0-project/public/images/hero-reel.mp4";

fs.mkdirSync(path.dirname(dest), { recursive: true });

const file = fs.createWriteStream(dest);

function download(u) {
  https
    .get(u, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location);
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const stats = fs.statSync(dest);
        console.log("Downloaded hero-reel.mp4 (" + (stats.size / 1024 / 1024).toFixed(1) + " MB)");
      });
    })
    .on("error", (err) => {
      console.error("Download failed:", err.message);
    });
}

download(url);
