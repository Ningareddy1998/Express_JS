const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'twitterClone.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// JWT Authentication Middleware
const authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return response.status(401).send('Invalid JWT Token')

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return response.status(401).send('Invalid JWT Token')
    request.user = user
    next()
  })
}

// API 1: Register
app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const userExistsQuery = `SELECT * FROM user WHERE username = ?`
  const existingUser = await db.get(userExistsQuery, [username])

  if (existingUser) {
    response.status(400).send('User already exists')
  } else if (password.length < 6) {
    response.status(400).send('Password is too short')
  } else {
    const createUserQuery = `
      INSERT INTO user (username, password, name, gender)
      VALUES (?, ?, ?, ?)
    `
    await db.run(createUserQuery, [username, hashedPassword, name, gender])
    response.send('User created successfully')
  }
})

// API 2: Login
app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  const userQuery = `SELECT * FROM user WHERE username = ?`
  const user = await db.get(userQuery, [username])

  if (!user) {
    response.status(400).send('Invalid user')
  } else {
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      response.status(400).send('Invalid password')
    } else {
      const token = jwt.sign({userId: user.user_id}, 'your_jwt_secret')
      response.send({jwtToken: token})
    }
  }
})

// API 3: Get User Feed
app.get('/user/tweets/feed/', authenticateToken, async (request, response) => {
  const {userId} = request.user
  const getFeedQuery = `
    SELECT username, tweet, date_time AS dateTime
    FROM tweet
    NATURAL JOIN user
    WHERE user_id IN (
      SELECT following_user_id
      FROM follower
      WHERE follower_user_id = ?
    )
    ORDER BY date_time DESC
    LIMIT 4
  `
  const feed = await db.all(getFeedQuery, [userId])
  response.send(feed)
})

// API 4: Get Following Users
app.get('/user/following/', authenticateToken, async (request, response) => {
  const {userId} = request.user
  const getFollowingQuery = `
    SELECT name
    FROM user
    WHERE user_id IN (
      SELECT following_user_id
      FROM follower
      WHERE follower_user_id = ?
    )
  `
  const following = await db.all(getFollowingQuery, [userId])
  response.send(following)
})

// API 5: Get Followers
app.get('/user/followers/', authenticateToken, async (request, response) => {
  const {userId} = request.user
  const getFollowersQuery = `
    SELECT name
    FROM user
    WHERE user_id IN (
      SELECT follower_user_id
      FROM follower
      WHERE following_user_id = ?
    )
  `
  const followers = await db.all(getFollowersQuery, [userId])
  response.send(followers)
})

// API 6: Get Tweet
app.get('/tweets/:tweetId/', authenticateToken, async (request, response) => {
  const {userId} = request.user
  const {tweetId} = request.params

  const validTweetQuery = `
    SELECT *
    FROM tweet
    WHERE tweet_id = ?
    AND user_id IN (
      SELECT following_user_id
      FROM follower
      WHERE follower_user_id = ?
    )
  `
  const tweet = await db.get(validTweetQuery, [tweetId, userId])

  if (!tweet) {
    response.status(401).send('Invalid Request')
  } else {
    const getTweetDetailsQuery = `
      SELECT tweet,
             (SELECT COUNT(*) FROM like WHERE tweet_id = ?) AS likes,
             (SELECT COUNT(*) FROM reply WHERE tweet_id = ?) AS replies,
             date_time AS dateTime
      FROM tweet
      WHERE tweet_id = ?
    `
    const tweetDetails = await db.get(getTweetDetailsQuery, [
      tweetId,
      tweetId,
      tweetId,
    ])
    response.send(tweetDetails)
  }
})

// API 7: Get Likes of a Tweet
app.get(
  '/tweets/:tweetId/likes/',
  authenticateToken,
  async (request, response) => {
    const {userId} = request.user
    const {tweetId} = request.params

    const validTweetQuery = `
    SELECT *
    FROM tweet
    WHERE tweet_id = ?
    AND user_id IN (
      SELECT following_user_id
      FROM follower
      WHERE follower_user_id = ?
    )
  `
    const tweet = await db.get(validTweetQuery, [tweetId, userId])

    if (!tweet) {
      response.status(401).send('Invalid Request')
    } else {
      const getLikesQuery = `
      SELECT username
      FROM like
      NATURAL JOIN user
      WHERE tweet_id = ?
    `
      const likes = await db.all(getLikesQuery, [tweetId])
      response.send({likes: likes.map(like => like.username)})
    }
  },
)

// API 8: Get Replies of a Tweet
app.get(
  '/tweets/:tweetId/replies/',
  authenticateToken,
  async (request, response) => {
    const {userId} = request.user
    const {tweetId} = request.params

    const validTweetQuery = `
    SELECT *
    FROM tweet
    WHERE tweet_id = ?
    AND user_id IN (
      SELECT following_user_id
      FROM follower
      WHERE follower_user_id = ?
    )
  `
    const tweet = await db.get(validTweetQuery, [tweetId, userId])

    if (!tweet) {
      response.status(401).send('Invalid Request')
    } else {
      const getRepliesQuery = `
      SELECT name, reply
      FROM reply
      NATURAL JOIN user
      WHERE tweet_id = ?
    `
      const replies = await db.all(getRepliesQuery, [tweetId])
      response.send({replies})
    }
  },
)

// API 9: Get User Tweets
app.get('/user/tweets/', authenticateToken, async (request, response) => {
  const {userId} = request.user
  const getUserTweetsQuery = `
    SELECT tweet,
           (SELECT COUNT(*) FROM like WHERE tweet_id = tweet.tweet_id) AS likes,
           (SELECT COUNT(*) FROM reply WHERE tweet_id = tweet.tweet_id) AS replies,
           date_time AS dateTime
    FROM tweet
    WHERE user_id = ?
  `
  const userTweets = await db.all(getUserTweetsQuery, [userId])
  response.send(userTweets)
})

// API 10: Create a Tweet
app.post('/user/tweets/', authenticateToken, async (request, response) => {
  const {userId} = request.user
  const {tweet} = request.body
  const dateTime = new Date().toISOString()

  const createTweetQuery = `
    INSERT INTO tweet (tweet, user_id, date_time)
    VALUES (?, ?, ?)
  `
  await db.run(createTweetQuery, [tweet, userId, dateTime])
  response.send('Created a Tweet')
})

// API 11: Delete a Tweet
app.delete(
  '/tweets/:tweetId/',
  authenticateToken,
  async (request, response) => {
    const {userId} = request.user
    const {tweetId} = request.params

    const tweetQuery = `
    SELECT *
    FROM tweet
    WHERE tweet_id = ?
  `
    const tweet = await db.get(tweetQuery, [tweetId])

    if (tweet.user_id !== userId) {
      response.status(401).send('Invalid Request')
    } else {
      const deleteTweetQuery = `
      DELETE FROM tweet
      WHERE tweet_id = ?
    `
      await db.run(deleteTweetQuery, [tweetId])
      response.send('Tweet Removed')
    }
  },
)

module.exports = app
