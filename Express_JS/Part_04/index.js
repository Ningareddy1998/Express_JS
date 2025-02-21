const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})
const bcrypt = require('bcrypt')
//CREATE USER API
app.post('/users/', async (request, response) => {
  const userDetails = request.body
  const {username, name, password, gender, location} = userDetails
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user 
  WHERE username="${username}";`
  const resultOfUserQuery = await db.get(selectUserQuery)

  if (resultOfUserQuery === undefined) {
    //CREATE USER DATA

    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`
    await db.run(createUserQuery)
    response.send('User Data in taken')
  } else {
    //SEND RESPONSE AS USERNAME IS ALREDY EXITS
    response.status(400)
    response.send('User name and deatils exits')
  }
})

//LOGIN API
app.post('/login/', async (request, response) => {
  const userDetails1 = request.body
  const {username, password} = userDetails1
  const selectUserQuery = `SELECT * FROM user 
  WHERE username="${username}";`

  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    //USER DID NOT REGISTER PLEASE REGISTER
    response.status(400)
    response.send('User didi not register plase register')
  } else {
    //COMAPARE USERNMAE AN HASED PASSWORD;
    const isPassword = await bcrypt.compare(password, dbUser.password)

    if (isPassword) {
      response.send('Login Sucess')
    } else {
      response.status(400)
      response.send('Invalid PassWord')
    }
  }
})
