module.exports = (request, response) => {
  response.setHeader('Content-Type', 'text/html');
  response.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Telegram Bot Status</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .status {
            color: #2ecc71;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Telegram Bot Status</h1>
          <p class="status">✅ Bot is running!</p>
          <p>Last checked: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
}; 