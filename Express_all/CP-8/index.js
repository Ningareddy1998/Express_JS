const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
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

// API 1: GET /todos/
app.get('/todos/', async (request, response) => {
  let data = null
  const {status, priority, search_q} = request.query
  let getTodosQuery = 'SELECT * FROM todo'

  if (status !== undefined) {
    getTodosQuery += ` WHERE status = '${status}'`
  }

  if (priority !== undefined) {
    getTodosQuery +=
      status !== undefined
        ? ` AND priority = '${priority}'`
        : ` WHERE priority = '${priority}'`
  }

  if (search_q !== undefined) {
    getTodosQuery +=
      status !== undefined || priority !== undefined
        ? ` AND todo LIKE '%${search_q}%'`
        : ` WHERE todo LIKE '%${search_q}%'`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})
