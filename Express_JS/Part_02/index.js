// Import the addDays function from date-fns
const {addDays} = require('date-fns')

// Define the date and the number of days to add
const date = new Date(2020, 1, 20) // January 20, 2020
const amount = 3

// Use the addDays function
const result = addDays(date, amount)

// Print the result
console.log(result) // Output: Thu Jan 23 2020 00:00:00
