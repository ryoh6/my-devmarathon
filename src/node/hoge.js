const express = require("express");
const app = express();
const port = 4183;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});
