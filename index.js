import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/test", (req, res) => {
  res.send("Test");
});

app.get("/test2", (req, res) => {
  res.send("Test2");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
