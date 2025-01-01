import { google } from 'googleapis';
import express from 'express';
import open from 'open';

const app = express();
const port = 3333;

// These will need to be filled in with values from Google Cloud Console
const oauth2Client = new google.auth.OAuth2(
    'YOUR_CLIENT_ID',
    'YOUR_CLIENT_SECRET',
    `http://localhost:${port}/oauth2callback`
);

// Generate the url that will be used for authorization
const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/photoslibrary.readonly']
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\nRefresh Token:', tokens.refresh_token);
        console.log('\nAdd this refresh token to your display-config.js under apis.googlePhotos.refreshToken\n');
        res.send('Authorization successful! You can close this window.');
        setTimeout(() => process.exit(0), 1000);
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Error getting tokens');
    }
});

app.listen(port, () => {
    console.log(`\nAuthorization server running at http://localhost:${port}`);
    console.log('\nOpening browser for Google authorization...');
    open(authorizeUrl);
});
