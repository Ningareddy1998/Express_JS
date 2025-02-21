Middleware functions
Multiple Middleware functions
Logger Middleware Implementation
Defining a Middleware Function
Logger Middleware Function
Get Books API with Logger Middleware
Authenticate Token Middleware
Get Books API with Authenticate Token Middleware
Passing data from Authenticate Token Middleware
Get User Profile API with Authenticate Token Middleware
1. Middleware functions
Middleware is a special kind of function in Express JS which accepts the request from

the user (or)
the previous middleware
After processing the request the middleware function

sends the response to another middleware (or)
calls the API Handler (or)
sends response to the user
JAVASCRIPT
Example

JAVASCRIPT
It is a built-in middleware function it recognizes the incoming request object as a JSON object, parses it, and then calls handler in every API call

1.1 Multiple Middleware functions
We can pass multiple middleware functions

JAVASCRIPT
2. Logger Middleware Implementation
2.1 Defining a Middleware Function
JAVASCRIPT
2.2 Logger Middleware Function
JAVASCRIPT
The next parameter is a function passed by Express JS which, when invoked, executes the next succeeding function

2.3 Get Books API with Logger Middleware
 
JAVASCRIPT
Expand
3. Authenticate Token Middleware
In Authenticate Token Middleware we will verify the JWT Token

 
JAVASCRIPT
Expand
4. Get Books API with Authenticate Token Middleware
Let's Pass Authenticate Token Middleware to Get Books API

 
JAVASCRIPT
Expand
5. Passing data from Authenticate Token Middleware
We cannot directly pass data to the next handler, but we can send data through the request object

 
JAVASCRIPT
Expand
6. Get User Profile API with Authenticate Token Middleware
We can access request variable from the request object

