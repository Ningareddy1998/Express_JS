const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
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

// API 1: Get All Players
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(player => ({
      playerId: player.player_id,
      playerName: player.player_name,
    })),
  )
})

// API 2: Get Player by ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const player = await db.get(getPlayerQuery)
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  })
})

// API 3: Update Player by ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};
  `
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// API 4: Get Match by ID
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const match = await db.get(getMatchQuery)
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  })
})

// API 5: Get All Matches of a Player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
    SELECT match_details.match_id, match_details.match, match_details.year
    FROM player_match_score
    JOIN match_details ON player_match_score.match_id = match_details.match_id
    WHERE player_match_score.player_id = ${playerId};
  `
  const matches = await db.all(getPlayerMatchesQuery)
  response.send(
    matches.map(match => ({
      matchId: match.match_id,
      match: match.match,
      year: match.year,
    })),
  )
})

// API 6: Get All Players of a Match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
    SELECT player_details.player_id, player_details.player_name
    FROM player_match_score
    JOIN player_details ON player_match_score.player_id = player_details.player_id
    WHERE player_match_score.match_id = ${matchId};
  `
  const players = await db.all(getMatchPlayersQuery)
  response.send(
    players.map(player => ({
      playerId: player.player_id,
      playerName: player.player_name,
    })),
  )
})

// API 7: Get Player Statistics
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerStatsQuery = `
    SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
    FROM player_match_score
    JOIN player_details ON player_match_score.player_id = player_details.player_id
    WHERE player_details.player_id = ${playerId};
  `
  const playerStats = await db.get(getPlayerStatsQuery)
  response.send(playerStats)
})

module.exports = app
