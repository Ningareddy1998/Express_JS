const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {format, isValid} = require('date-fns')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
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

const validateTodo = todo => {
  const {status, priority, category, dueDate} = todo

  const validStatus = ['TO DO', 'IN PROGRESS', 'DONE']
  const validPriority = ['HIGH', 'MEDIUM', 'LOW']
  const validCategory = ['WORK', 'HOME', 'LEARNING']

  if (status !== undefined && !validStatus.includes(status)) {
    return 'Invalid Todo Status'
  }
  if (priority !== undefined && !validPriority.includes(priority)) {
    return 'Invalid Todo Priority'
  }
  if (category !== undefined && !validCategory.includes(category)) {
    return 'Invalid Todo Category'
  }

  if (dueDate !== undefined) {
    const parsedDate = new Date(dueDate)
    if (!isValid(parsedDate)) {
      return 'Invalid Due Date'
    }
  }
  return null
}

// API 1: GET /todos/
app.get('/todos/', async (req, res) => {
  const {status, priority, search_q = '', category} = req.query

  const validationError = validateTodo({status, priority, category})
  if (validationError) {
    return res.status(400).send(validationError)
  }

  let getTodosQuery = `
    SELECT
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
    FROM
      todo
    WHERE
      todo LIKE '%${search_q}%'`

  if (status !== undefined) {
    getTodosQuery += ` AND status = '${status}'`
  }
  if (priority !== undefined) {
    getTodosQuery += ` AND priority = '${priority}'`
  }
  if (category !== undefined) {
    getTodosQuery += ` AND category = '${category}'`
  }

  const todos = await db.all(getTodosQuery)
  res.send(todos)
})

// API 2: GET /todos/:todoId/
app.get('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const getTodoQuery = `
    SELECT
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
    FROM
      todo
    WHERE
      id = ${todoId};`
  const todo = await db.get(getTodoQuery)
  if (!todo) {
    return res.status(404).send('Todo not found') // Handle the case where the todo is not found.
  }
  res.send(todo)
})

// API 3: GET /agenda/
app.get('/agenda/', async (req, res) => {
  const {date} = req.query

  const parsedDate = new Date(date)
  if (!isValid(parsedDate)) {
    return res.status(400).send('Invalid Due Date')
  }

  const formattedDate = format(parsedDate, 'yyyy-MM-dd')

  const getAgendaQuery = `
    SELECT
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
    FROM
      todo
    WHERE
      due_date = '${formattedDate}';`
  const todos = await db.all(getAgendaQuery)
  res.send(todos)
})

// API 4: POST /todos/
app.post('/todos/', async (req, res) => {
  const {id, todo, priority, status, category, dueDate} = req.body
  const validationError = validateTodo({status, priority, category, dueDate})
  if (validationError) {
    return res.status(400).send(validationError)
  }
  const formattedDueDate = format(new Date(dueDate), 'yyyy-MM-dd')

  const addTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status, category, due_date)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDueDate}');`
  await db.run(addTodoQuery)
  res.send('Todo Successfully Added')
})
// API 5: PUT /todos/:todoId/
app.put('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const {status, priority, todo, category, dueDate} = req.body

  const validationError = validateTodo({status, priority, category, dueDate})
  if (validationError) {
    return res.status(400).send(validationError)
  }

  let updateTodoQuery = `UPDATE todo SET `
  let updates = []

  if (status !== undefined) {
    updates.push(` status = '${status}'`)
  }
  if (priority !== undefined) {
    updates.push(` priority = '${priority}'`)
  }
  if (todo !== undefined) {
    updates.push(` todo = '${todo}'`)
  }
  if (category !== undefined) {
    updates.push(` category = '${category}'`)
  }
  if (dueDate !== undefined) {
    const formattedDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
    updates.push(` due_date = '${formattedDueDate}'`)
  }

  if (updates.length === 0) {
    // No updates provided
    return res.status(400).send('No fields to update')
  }

  updateTodoQuery += updates.join(', ')
  updateTodoQuery += ` WHERE id = ${todoId};`

  await db.run(updateTodoQuery)

  // Send specific messages based on updated field
  if (status) res.send('Status Updated')
  else if (priority) res.send('Priority Updated')
  else if (todo) res.send('Todo Updated')
  else if (category) res.send('Category Updated')
  else if (dueDate) res.send('Due Date Updated')
})

// API 6: DELETE /todos/:todoId/
app.delete('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`
  await db.run(deleteTodoQuery)
  res.send('Todo Deleted')
})

module.exports = app
