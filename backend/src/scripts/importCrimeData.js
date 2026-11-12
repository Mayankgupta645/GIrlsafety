
const fs = require("fs");
const db = require("../db/index.js");

const data = JSON.parse(fs.readFileSync("crime.json"));

data.forEach(item => {
  db.query(`
    INSERT INTO incidents(type, severity, geom, source)
    VALUES($1,$2, ST_SetSRID(ST_Point($3,$4),4326), 'CrimeDataset')
  `, ["crime", 3, item.lon, item.lat]);
});
