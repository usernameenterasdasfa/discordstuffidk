const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
// PASTE YOUR DISCORD WEBHOOK URL HERE
// In production, it is safer to use process.env.DISCORD_WEBHOOK_URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1458461417870069854/UkW4qUX8_IxjHyT5uVYq5Caeu0QObOjHKRa__CZm7x2z3IkTcPyj3UuBSeXoEFcT4TL8';

// --- MIDDLEWARE ---
// Enable CORS to allow your game (hosted on a different domain) to talk to this server
app.use(cors());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// --- ROUTES ---function sendMissionReport(score) {
    const webhookURL = "https://discord.com/api/webhooks/1458461417870069854/UkW4qUX8_IxjHyT5uVYq5Caeu0QObOjHKRa__CZm7x2z3IkTcPyj3UuBSeXoEFcT4TL8";
    
    const payload = {
        content: `**Mission Report:** Pilot scored ${score} points!`,
        username: "Space Shooter Arcade"
    };

    fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) console.error("Discord rejected the transmission:", response.status);
        else console.log("Mission report uploaded to Discord.");
    })
    .catch(error => {
        console.error("CORS BLOCK DETECTED: Browsers cannot send directly to Discord.", error);
    });
}

// usage:
sendMissionReport(1000);

// Health check endpoint to confirm server is running
app.get('/', (req, res) => {
    res.send('Space Shooter Proxy is running!');
});

/**
 * POST /api/message
 * Expects a JSON body: { "content": "Your message here" }
 */
app.post('/api/message', async (req, res) => {
    const { content } = req.body;

    // 1. Validation
    if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
        console.error('Webhook URL is not configured.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // 2. Construct the Discord Payload
        // You can customize this to use Embeds for prettier messages
        const discordPayload = {
            content: `🚀 **Space Shooter Update:** ${content}`
        };

        // 3. Send to Discord
        const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });

        // 4. Handle Discord's Response
        if (discordResponse.ok) {
            return res.status(200).json({ success: true, message: 'Message sent to Discord' });
        } else {
            // Log the actual error from Discord for debugging
            const errorText = await discordResponse.text();
            console.error('Discord API Error:', errorText);
            return res.status(discordResponse.status).json({ error: 'Failed to send message to Discord' });
        }

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
