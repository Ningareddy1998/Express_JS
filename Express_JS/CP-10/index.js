const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API GET ACCESS TOKEN 01
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM user WHERE username=?;`
  const dbUser = await db.get(selectQuery, [username])
  if (dbUser === undefined) {
    response.status(400).send('Invalid user')
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password)
    if (isPassword) {
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'SECRET_KEY')
      response.send({jwtToken})
    } else {
      response.status(400).send('Invalid password')
    }
  }
})

// THIS IS TOKEN VERIFICATION
const authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization']
  let jwtToken
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'SECRET_KEY', (error, payload) => {
      if (error) {
        response.status(401).send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

// API GET ALL STATES 02
app.get('/states/', authenticateToken, async (request, response) => {
  const selectQuery = `SELECT * FROM state;`
  const dbQuery = await db.all(selectQuery)
  const formattedResponse = dbQuery.map(state => ({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  }))
  response.send(formattedResponse)
})

// API GET PARTICULAR STATE 03
app.get('/states/:stateId/', authenticateToken, async (request, response) => {
  const {stateId} = request.params
  const selectQuery = `SELECT * FROM state WHERE state_id='${stateId}';`
  const dbQuery = await db.get(selectQuery)
  const formattedResponse = {
    stateId: dbQuery.state_id,
    stateName: dbQuery.state_name,
    population: dbQuery.population,
  }
  response.send(formattedResponse)
})

// API POST NEW DISTRICT 04
app.post('/districts/', authenticateToken, async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const setDataQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ("${districtName}", "${stateId}", "${cases}", "${cured}", "${active}", "${deaths}");
  `
  await db.run(setDataQuery)
  response.send('District Successfully Added')
})

// API GET DISTRICT 05
app.get(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const selectQuery = `SELECT * FROM district WHERE district_id='${districtId}';`
    const dbQuery = await db.get(selectQuery)
    const formattedResponse = {
      districtId: dbQuery.district_id,
      districtName: dbQuery.district_name,
      stateId: dbQuery.state_id,
      cases: dbQuery.cases,
      cured: dbQuery.cured,
      active: dbQuery.active,
      deaths: dbQuery.deaths,
    }
    response.send(formattedResponse)
  },
)

// API DELETE DISTRICT 06
app.delete(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const deleteQuery = `DELETE FROM district WHERE district_id='${districtId}';`
    await db.run(deleteQuery)
    response.send('District Removed')
  },
)

// API PUT DISTRICT DETAILS UPDATE 07
app.put(
  '/districts/:districtId/',
  authenticateToken,
  async (request, response) => {
    const {districtId} = request.params
    const {districtName, stateId, cases, cured, active, deaths} = request.body
    const setDataQuery = `
    UPDATE district
    SET district_name = "${districtName}",
        state_id = "${stateId}",
        cases = "${cases}",
        cured = "${cured}",
        active = "${active}",
        deaths = "${deaths}"
    WHERE district_id = "${districtId}";
  `
    await db.run(setDataQuery)
    response.send('District Details Updated')
  },
)

// API GET STATS 08
app.get(
  '/states/:stateId/stats/',
  authenticateToken,
  async (request, response) => {
    const {stateId} = request.params
    const selectQuery = `
    SELECT 
      SUM(cases) as totalCases,
      SUM(cured) as totalCured,
      SUM(active) as totalActive,
      SUM(deaths) as totalDeaths
    FROM district
    WHERE state_id = ${stateId};
  `
    const dbQuery = await db.get(selectQuery)
    response.send(dbQuery)
  },
)

module.exports = app
