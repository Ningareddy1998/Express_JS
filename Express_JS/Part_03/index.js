const express = require('express')
const path = require('path')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await sqlite.open({
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

// Get Single Book API
app.get('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params
  const getBookQuery = `
    SELECT
      *
    FROM
      book
    WHERE
      book_id = ${bookId};`
  const book = await db.get(getBookQuery)
  response.send(book)
})

// Add Book API
app.post('/books/', async (request, response) => {
  const bookDetails = request.query // Using query parameters instead of JSON body
  const {
    title,
    authorId,
    rating,
    ratingCount,
    reviewCount,
    description,
    pages,
    dateOfPublication,
    editionLanguage,
    price,
    onlineStores,
  } = bookDetails
  const addBookQuery = `
    INSERT INTO
      book (title, author_id, rating, rating_count, review_count, description, pages, date_of_publication, edition_language, price, online_stores)
    VALUES
      ('${title}',
      '${authorId}',
      '${rating}',
      '${ratingCount}',
      '${reviewCount}',
      '${description}',
      '${pages}',
      '${dateOfPublication}',
      '${editionLanguage}',
      '${price}',
      '${onlineStores}');`
  const dbResponse = await db.run(addBookQuery)
  const bookId = dbResponse.lastID
  response.send({bookId: bookId})
})
// Update Book API
app.put('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params
  const bookDetails = request.body // Using JSON body instead of query parameters
  const {
    title,
    authorId,
    rating,
    ratingCount,
    reviewCount,
    description,
    pages,
    dateOfPublication,
    editionLanguage,
    price,
    onlineStores,
  } = bookDetails

  const updateBookQuery = `
    UPDATE
      book
    SET
      title = ?,
      author_id = ?,
      rating = ?,
      rating_count = ?,
      review_count = ?,
      description = ?,
      pages = ?,
      date_of_publication = ?,
      edition_language = ?,
      price = ?,
      online_stores = ?
    WHERE
      book_id = ?;`

  await db.run(updateBookQuery, [
    title,
    authorId,
    rating,
    ratingCount,
    reviewCount,
    description,
    pages,
    dateOfPublication,
    editionLanguage,
    price,
    onlineStores,
    bookId,
  ])
  response.send('Book Updated Successfully')
})

// Delete Book API
app.delete('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params
  const deleteBookQuery = `
    DELETE FROM
      book
    WHERE
      book_id = '${bookId}';`
  await db.run(deleteBookQuery)
  response.send('Book Deleted Successfully')
})

// Get Author Books API
app.get('/authors/:authorId/books/', async (request, response) => {
  const {authorId} = request.params
  const getAuthorBooksQuery = `
    SELECT
      *
    FROM
      book
    WHERE
      author_id = ?;`
  const booksArray = await db.all(getAuthorBooksQuery, authorId)
  response.send(booksArray)
})

module.exports = app
