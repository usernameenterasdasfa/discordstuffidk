const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// 1. SECURITY: Allow your game to talk to this server
app.use(cors()); 
app.use(express.json());

// 2. CONFIGURATION: Get the Webhook URL from the server's settings
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// 3. THE ROUTE: Your game will send data here
app.post('/send-score', async (req, res) => {
    // Check if the server is set up correctly
    if (!DISCORD_WEBHOOK_URL) {
        console.error("Error: DISCORD_WEBHOOK_URL is missing in environment variables.");
        return res.status(500).json({ error: "Server misconfiguration" });
    }

    // Now accepting 'difficulty' and 'color' from the game
    const { pilotName, score, difficulty, color } = req.body;

    // Basic validation
    if (!pilotName || !score) {
        return res.status(400).json({ error: "Missing pilotName or score" });
    }

    // Default to 'Normal' (Yellow) if no color is sent
    const embedColor = color || 16766720; 
    const diffText = difficulty || "NORMAL";

    // 4. FORMATTING: Create the message for Discord
    const discordPayload = {
        username: "Space Shooter Command",
        embeds: [{
            title: "🚀 Mission Report",
            color: embedColor, // Uses the color sent from the game
            fields: [
                { name: "Pilot Callsign", value: pilotName, inline: true },
                { name: "Score", value: score.toString(), inline: true },
                { name: "Difficulty", value: diffText, inline: true }
            ],
            footer: { text: "Verified by High Command" },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        // 5. FORWARDING: Send the data to Discord
        const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });

        if (discordResponse.ok) {
            res.json({ success: true, message: "Score sent to Discord!" });
        } else {
            console.error("Discord rejected the message:", discordResponse.statusText);
            res.status(500).json({ error: "Discord rejected transmission" });
        }
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: "Internal Relay Failure" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy Relay Online on port ${PORT}`);
});
