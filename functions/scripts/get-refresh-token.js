const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
require('dotenv').config();

const REDIRECT_URI = 'http://localhost:4000/oauth2callback';

console.log('Using Client ID:', process.env.GMAIL_CLIENT_ID);
console.log('Using Redirect URI:', REDIRECT_URI);

const oauth2Client = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send'
];

// Create a local server to receive the OAuth callback
const server = http.createServer(async (req, res) => {
  try {
    const urlObj = url.parse(req.url, true);
    console.log('Received request:', req.url);
    
    if (urlObj.pathname === '/oauth2callback') {
      const code = urlObj.query.code;
      console.log('Received code:', code ? 'Yes' : 'No');
      
      if (code) {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\nRefresh token:', tokens.refresh_token);
        
        // Send success response to browser
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Authorization successful! You can close this window and return to the terminal.');
        
        // Close the server
        server.close();
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('Authorization failed! Please try again.');
      }
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('An error occurred. Please try again.');
  }
});

server.listen(4000, () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  console.log('\nPlease visit this URL to authorize the application:');
  console.log(authUrl);
  console.log('\nWaiting for authorization...');
}); 