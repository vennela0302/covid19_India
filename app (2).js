const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

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
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DbError:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.use(express.json());

const stateObjectDbResponse = (DbObject) => {
  return {
    stateId: DbObject.state_id,
    stateName: DbObject.state_name,
    population: DbObject.population,
  };
};
const distObjectDbResponse = (DbObject) => {
  return {
    districtId: DbObject.district_id,
    districtName: DbObject.district_name,
    stateId: DbObject.state_id,
    cases: DbObject.cases,
    cured: DbObject.cured,
    active: DbObject.active,
    deaths: DbObject.deaths,
  };
};
//API 1

app.get("/states/", async (req, res) => {
  const getAllStatesQuery = `
    SELECT * FROM state ORDER BY state_id`;
  const getStates = await db.all(getAllStatesQuery);
  res.send(getStates.map((eachState) => stateObjectDbResponse(eachState)));
});

// API 2

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId}`;
  const getState = await db.get(getStateQuery);
  res.send(stateObjectDbResponse(getState));
});

// API 3

app.post("/districts/", async (req, res) => {
  const distDetails = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = distDetails;
  const DistDetailsQuery = `
  INSERT INTO district (district_name, state_id, cases,cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, ${cases},${cured}, ${active}, ${deaths})`;

  const dbResponse = await db.run(DistDetailsQuery);
  const districtId = dbResponse.lastId;
  res.send("District Successfully Added");
});

// API 4

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistDetailsQuery = `
    SELECT * FROM district WHERE district_id = ${districtId}`;
  const getDistDetails = await db.get(getDistDetailsQuery);
  res.send(distObjectDbResponse(getDistDetails));
});

// API 5
app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistQuery = `
    DELETE FROM district WHERE district_id = ${districtId}`;
  await db.run(deleteDistQuery);
  res.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const distDetails = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = distDetails;
  const updateDistQuery = `
    UPDATE district 
    SET 
    district_name = '${districtName}',
state_id = ${stateId},
cases = ${cases},
cured=${cured},
active=${active},
deaths=${deaths}
     WHERE district_id = ${districtId} `;
  await db.run(updateDistQuery);

  res.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const getStatisticsQuery = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM district
    WHERE state_id = ${stateId} `;
  const Stats = await db.get(getStatisticsQuery);
  res.send({
    totalCases: Stats["SUM(cases)"],
    totalCured: Stats["SUM(cured)"],
    totalActive: Stats["SUM(active)"],
    totalDeaths: Stats["SUM(deaths)"],
  });
});

// API 8
app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId} `;
  const getDistrictId = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
  SELECT state_name as stateName FROM state WHERE state_id = ${getDistrictId.state_id}`;
  const getStateName = await db.get(getStateNameQuery);
  res.send(getStateName);
});
module.exports = app;
