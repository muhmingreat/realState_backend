// test-dns.js
const dns = require("dns");

dns.lookup("cluster0.1xjgkpg.mongodb.net", (err, address) => {
  if (err) console.error("DNS Lookup failed:", err);
  else console.log("Resolved:", address);
});
