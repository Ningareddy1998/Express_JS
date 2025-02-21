//------------------------------------------------------------------//
const express = require('express')
const app = express()
app.use(express.json())

//-------------------------------------------------------------------//
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketTeam.db')

// Utility functions to convert snake_case to camelCase
const toCamelCase = str => {
  return str.replace(/_([a-z])/g, (match, group1) => group1.toUpperCase())
}

const convertKeysToCamelCase = obj => {
  const newObj = {}
  for (const key in obj) {
    const camelCaseKey = toCamelCase(key)
    newObj[camelCaseKey] = obj[key]
  }
  return newObj
}

//------------------------------------------------------------------//
let db = null
const initializeDbAndServer = async () => {
  try {
    db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

//----------------------------------------------------
///GET PLAYERS API//

app.get('/players/', async (request, response) => {
  try {
    const getAllPlayers = `SELECT * FROM cricket_team;`
    const allPlayerDetails = await db.all(getAllPlayers)
    const camelCasePlayerDetails = allPlayerDetails.map(convertKeysToCamelCase)
    response.send(camelCasePlayerDetails)
  } catch (e) {
    response.status(500).send({error: e.message})
  }
})

//----------------------------------------------------
///POST API//
app.post('/players/', async (request, response) => {
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails
  const addPlayerQuery = `
    INSERT INTO cricket_team (
    player_name, 
    jersey_number, 
    role) 
    VALUES (
    ?,
    ?,
    ?);`
  try {
    const dbResponse = await db.run(addPlayerQuery, [
      playerName,
      jerseyNumber,
      role,
    ])
    response.send('Player Added to Team')
  } catch (e) {
    response.status(500).send({error: e.message})
  }
})

//--------------------------------------------------------------------
//GET PLAYER DETAILS API//

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetails = `SELECT * FROM cricket_team WHERE player_id = ?;`
  try {
    const playerDetails = await db.get(getPlayerDetails, playerId)
    const camelCasePlayerDetails = convertKeysToCamelCase(playerDetails)
    response.send(camelCasePlayerDetails)
  } catch (e) {
    response.status(500).send({error: e.message})
  }
})

//--------------------------------------------------------------------
//PUT API

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const updatePlayer = request.body
  const {playerName, jerseyNumber, role} = updatePlayer
  const putPlayerDetails = `UPDATE cricket_team
  SET player_name = ?,
      jersey_number = ?,
      role = ?
  WHERE player_id = ?;`
  try {
    await db.run(putPlayerDetails, [playerName, jerseyNumber, role, playerId])
    response.send('Player Details Updated')
  } catch (e) {
    response.status(500).send({error: e.message})
  }
})

//----------------------------------------------------------
//DELETE API

app.delete('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const deletePlayer = `DELETE FROM cricket_team WHERE player_id = ?;`
  try {
    await db.run(deletePlayer, playerId)
    response.send('Player Removed')
  } catch (e) {
    response.status(500).send({error: e.message})
  }
})

module.exports = app
