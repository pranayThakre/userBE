const http = require('http');
const querystring = require('querystring');

const port = 6003;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    // Serve the HTML form
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <form action="/user" method="post">
            <input type="text" name="username" placeholder="Enter your name" required/>
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `);
  } else if (req.method === 'POST' && req.url === '/user') {
    let body = '';

    // Collect data from POST request
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse the form data
      const parsedData = querystring.parse(body);
      const username = parsedData.username;

      // Send the response with the provided input value
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h1>Hello, ${username}!</h1>`);
    });
  } else {
    // Handle unknown routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
  }
});

// Listen to the server at port 5000
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
