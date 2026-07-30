const http = require("http");

const data = JSON.stringify({
  username: "natthoff_56A7",
  password: "56A759E4F545"
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/admin/auth-debug",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => {
    body += chunk;
  });
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", body);
  });
});

req.on("error", (e) => {
  console.error("Error:", e.message);
});

req.write(data);
req.end();
