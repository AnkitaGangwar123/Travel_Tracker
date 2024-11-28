import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted()
{
  const result = await db.query("SELECT country_code FROM visited_countries");
  console.log(result.rows); //Output of this is list of objects
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
// GET the Home Page  
app.get("/", async (req, res) => {
  //Write your code here.
  const countries = await checkVisisted();
  res.render("index.ejs", {total: countries.length, countries: countries});
  // db.end();
});

// Insert a new country
app.post("/add" , async(req, res) => {
  const user_input = (req.body.country);
  try
  {
    //const result = await db.query("SELECT country_code FROM countries WHERE country_name = $1", [user_input]);
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [user_input.toLowerCase()]);
    const data = result.rows[0];
    const countryCode = data.country_code;
    try
    {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
      res.redirect("/");
    }
    catch(err)
    {
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  }
  catch(err)
  {
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

