const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// 1. SECURITY: Allow your game to talk to this server
app.use(cors()); 
app.use(express.json());

// 2. CONFIGURATION: Get the Webhook URLs from Render's "Environment Variables"
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SHOP_WEBHOOK_URL = process.env.SHOP_WEBHOOK_URL;

// --- ROUTE 1: SEND HIGH SCORES ---
app.post('/send-score', async (req, res) => {
    // Check if the Score Webhook is set
    if (!DISCORD_WEBHOOK_URL) {
        console.error("Error: DISCORD_WEBHOOK_URL is missing.");
        return res.status(500).json({ error: "Server misconfiguration" });
    }

    const { pilotName, score, difficulty, color } = req.body;

    if (!pilotName || !score) {
        return res.status(400).json({ error: "Missing pilotName or score" });
    }

    // Default to 'Normal' (Yellow) if no color sent
    const embedColor = color || 16766720; 
    const diffText = difficulty || "NORMAL";

    const discordPayload = {
        username: "Space Shooter Command",
        embeds: [{
            title: "🚀 Mission Report",
            color: embedColor,
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

// --- ROUTE 2: SEND SHOP PURCHASES ---
app.post('/send-shop', async (req, res) => {
    // If the Shop Webhook isn't set, we just log it and ignore (don't crash)
    if (!SHOP_WEBHOOK_URL) {
        console.log("Shop webhook not configured, skipping message.");
        return res.json({ success: false, message: "No Shop Webhook Configured" });
    }

    const { pilotName, item, level, cost } = req.body;

    const payload = {
        username: "Black Market Dealer",
        embeds: [{
            title: "🛒 New Purchase",
            color: 16761035, // Bright Pink for Shop
            description: `**${pilotName}** just upgraded their ship!`,
            fields: [
                { name: "Upgrade", value: item, inline: true },
                { name: "New Level", value: level.toString(), inline: true },
                { name: "Cost", value: `${cost} Coins`, inline: true }
            ],
            footer: { text: "Space Shooter Armory" },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        const discordResponse = await fetch(SHOP_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (discordResponse.ok) {
            res.json({ success: true });
        } else {
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
