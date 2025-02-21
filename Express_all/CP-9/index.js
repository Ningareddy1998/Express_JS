const express = require('express')
const sqlite = require('sqlite')
const bcrypt = require('bcrypt')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())

let db = null
const dbPath = path.join(__dirname, 'userData.db')

const initializeDbServer = async () => {
  try {
    db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.error(`DB error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbServer()

// API 1: Register User
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  if (password.length <= 5) {
    response.status(400).send('Password is too short')
    return
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const getUserQuery = 'SELECT * FROM user WHERE username = ?;'
    const dbUser = await db.get(getUserQuery, [username])

    if (dbUser) {
      response.status(400).send('User already exists')
    } else {
      const setUserDetails =
        'INSERT INTO user (username, name, password, gender, location) VALUES (?, ?, ?, ?, ?);'
      await db.run(setUserDetails, [
        username,
        name,
        hashedPassword,
        gender,
        location,
      ])
      response.send('User created successfully')
    }
  } catch (e) {
    response.status(500).send(`Error creating user: ${e.message}`)
  }
})

// API 2: User Login
app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const selectUserQuery = 'SELECT * FROM user WHERE username = ?;'
  const dbUser = await db.get(selectUserQuery, [username])

  if (!dbUser) {
    response.status(400).send('Invalid user')
  } else {
    const isPasswordValid = await bcrypt.compare(password, dbUser.password)
    if (isPasswordValid) {
      response.status(200).send('Login success!')
    } else {
      response.status(400).send('Invalid password')
    }
  }
})

// API 3: Change Password
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const selectUserQuery = 'SELECT * FROM user WHERE username = ?;'
  const dbUser = await db.get(selectUserQuery, [username])

  if (!dbUser) {
    response.status(400).send('Invalid user')
    return
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.password)
  if (!isPasswordValid) {
    response.status(400).send('Invalid current password')
    return
  }

  if (newPassword.length <= 5) {
    response.status(400).send('Password is too short')
    return
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  const updatePasswordQuery = 'UPDATE user SET password = ? WHERE username = ?;'
  await db.run(updatePasswordQuery, [hashedPassword, username])
  response.status(200).send('Password updated')
})

module.exports = app
