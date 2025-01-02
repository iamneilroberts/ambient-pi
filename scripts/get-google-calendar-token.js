import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import open from 'open';
import destroyer from 'server-destroy';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from the .env file in the current directory
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
    console.error(`Error: .env file not found at ${envPath}`);
    process.exit(1);
}
dotenv.config({ path: envPath });

const PORT = 4444; // Changed port number

// Replace these with your OAuth 2.0 credentials from Google Cloud Console
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${PORT}/oauth2callback`
);

async function getRefreshToken() {
    // Generate the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    // Create a temporary server to handle the OAuth2 callback
    const server = http
        .createServer(async (req, res) => {
            try {
                if (req.url.startsWith('/oauth2callback')) {
                    const qs = new URL(req.url, `http://localhost:${PORT}`)
                        .searchParams;
                    const code = qs.get('code');
                    console.log('Authorization code:', code);

                    // Now that we have the code, we can turn it into an access token.
                    const { tokens } = await oauth2Client.getToken(code);
                    console.log('\nRefresh token:', tokens.refresh_token);
                    console.log('\nAdd this refresh token to your .env file as GOOGLE_REFRESH_TOKEN');

                    res.end('Authentication successful! You can close this window.');
                    server.destroy();
                }
            } catch (e) {
                console.error('Error getting tokens:', e);
                res.end('Authentication failed! ' + e.message);
                server.destroy();
            }
        })
        .listen(PORT);

    destroyer(server);

    // Open the browser to the authorize url to start the workflow
    console.log('\nOpening browser for authorization...');
    await open(authorizeUrl);
    console.log('\nWaiting for authorization...');
}

// Check if we have the required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('\nError: Missing required environment variables!');
    console.log('\nMake sure you have set:');
    console.log('- GOOGLE_CLIENT_ID');
    console.log('- GOOGLE_CLIENT_SECRET');
    console.log('\nYou can get these from the Google Cloud Console:');
    console.log('1. Go to https://console.cloud.google.com');
    console.log('2. Create a new project or select an existing one');
    console.log('3. Enable the Google Calendar API');
    console.log('4. Go to Credentials');
    console.log('5. Create OAuth 2.0 Client ID credentials');
    console.log(`6. Add http://localhost:${PORT}/oauth2callback to the authorized redirect URIs`);
    console.log('7. Copy the client ID and client secret to your .env file');
    process.exit(1);
}

getRefreshToken().catch(console.error);
