const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbPath = path.join(__dirname, "twitterClone.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//api 1
app.post("/register/", async (request, response) => {
  const userDetails = request.body;
  const { username, password, name, gender } = userDetails;
  const hashedPassword = bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT * FROM user WHERE username= '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined && password.length > 6) {
    const addUserQuery = `
    INSERT INTO user(name, username, password, gender)
    VALUES ('${name}', '${username}', '${hashedPassword}', '${gender}');
    WHERE username !== '${username}'`;
    await db.run(addUserQuery);
    response.send("Successful registration of the registrant");
  } else if (password.length < 6) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//api 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username= '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = bcrypt.compare(password, dbUser.password);
    if (comparePassword === true) {
      const payLoad = { username: username };
      const jwtToken = jwt.sign(payLoad, "MY_SECRET_KEY");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

module.exports = app;
