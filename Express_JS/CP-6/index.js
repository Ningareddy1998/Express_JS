const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB error is ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertSnakeToCamel = obj => {
  const newObj = {}
  for (const key in obj) {
    const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    )
    newObj[camelCaseKey] = obj[key]
  }
  return newObj
}

// API 1: Get All States
app.get('/states/', async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray.map(convertSnakeToCamel))
})

// API 2: Get State by ID
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(convertSnakeToCamel(state))
})

// API 3: Create a District
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const createDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
  `
  await db.run(createDistrictQuery)
  response.send('District Successfully Added')
})

// API 4: Get District by ID
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(convertSnakeToCamel(district))
})

// API 5: Delete District by ID
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// API 6: Update District by ID
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
    UPDATE district
    SET district_name = '${districtName}', state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths}
    WHERE district_id = ${districtId};
  `
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// API 7: Get State Statistics by ID
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
    SELECT
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};
  `
  const stats = await db.get(getStateStatsQuery)
  response.send(convertSnakeToCamel(stats))
})

// API 8: Get State Name of a District by ID
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT state.state_name AS stateName
    FROM district
    JOIN state ON district.state_id = state.state_id
    WHERE district.district_id = ${districtId};
  `
  const stateName = await db.get(getStateNameQuery)
  response.send(convertSnakeToCamel(stateName))
})

module.exports = app
