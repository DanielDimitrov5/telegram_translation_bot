import { TelegramClient } from "telegram"; // Importing the TelegramClient class from the "telegram" module
import { StringSession } from "telegram/sessions"; // Importing the StringSession class from the "telegram/sessions" module
import { NewMessage } from "telegram/events/NewMessage"; // Importing the NewMessage class from the "telegram/events/NewMessage" module
import * as readline from "readline"; // Importing the readline module
import axios from "axios"; // Importing the axios library
import dotenv from "dotenv"; // Importing the dotenv library for loading environment variables

// Load environment variables from .env file
dotenv.config();

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || ''); // Parsing the TELEGRAM_API_ID environment variable as a number and assigning it to the apiId variable
const apiHash = process.env.TELEGTAM_API_HASH || ''; // Assigning the value of the TELEGTAM_API_HASH environment variable to the apiHash variable
const stringSession = new StringSession(process.env.TELEGRAM_STRING_SESSION); // Creating a new instance of the StringSession class with the value of the TELEGRAM_STRING_SESSION environment variable and assigning it to the stringSession variable

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5, // Setting the number of connection retries to 5
});

// Helper function to get input from the command line
function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin, // Setting the input stream to process.stdin
        output: process.stdout, // Setting the output stream to process.stdout
    });

    return new Promise((resolve) => rl.question(query, (ans: string) => {
        rl.close();
        resolve(ans);
    }));
}

// Function to translate text using the LM Studio with relevance filtering
async function translateAndFilterText(text: string): Promise<string | null> {
    try {
        const response = await axios.post(process.env.MODEL_LM_STUDIO_REQUEST_URL || '', {
            model: process.env.MODEL_NAME || '', // Sending the MODEL_NAME environment variable as the value for the "model" property in the request payload
            messages: [
                // Defining the prompt messages for the system and user
                { role: "system", content: "You are an expert in analyzing and translating content related to the war in Ukraine and Russia. You should always translate to Bulgarian. If the input is a single word or simple phrase, return a direct translation without additional context. If the content is irrelevant, nonsensical, or unrelated, respond with 'SKIP'. After translatation you check the output for lnaguage errors and you make it sound correctly in Bulgarian." },
                { role: "user", content: text } // Sending the input text as the value for the "content" property in the user message
            ],
            temperature: 0.7, // Setting the temperature for text generation to 0.7
            max_tokens: -1, // Setting the maximum number of tokens to -1 (unlimited)
            stream: false // Setting the stream option to false
        }, {
            headers: {
                'Content-Type': 'application/json' // Setting the Content-Type header to "application/json"
            }
        });

        const translatedText = response.data.choices[0].message.content.trim(); // Extracting the translated text from the response data

        // If the response is "SKIP", return null to skip this message
        if (translatedText.toUpperCase() === "SKIP") {
            return null;
        }

        // Check if the response is too detailed for a simple input
        if (text.split(' ').length <= 3 && translatedText.split(' ').length > 10) {
            return null; // Skip if the response is overly detailed
        }

        return translatedText;
    } catch (error) {
        console.error("Translation failed:", error);
        return null; // Skip if translation fails
    }
}

async function run() {
    console.log("Loading interactive session...");

    // Start the client
    await client.start({
        phoneNumber: async () => await askQuestion("Please enter your phone number: "), // Prompting the user to enter their phone number
        password: async () => await askQuestion("Please enter your password (if you have 2FA enabled): "), // Prompting the user to enter their password
        phoneCode: async () => await askQuestion("Please enter the code you received: "), // Prompting the user to enter the code they received
        onError: (err) => console.log(err), // Handling errors during client start
    });

    console.log("You are now connected.");
    console.log("Saving session...");
    console.log(client.session.save()); // Saving the session string for later use

    // Define the destination channel where you want to forward the translated messages
    const destinationChannelUsername = process.env.TELEGRAM_CHANNEL_TARGET_HANDLE || '';

    // Define the array of channel usernames you want to listen to
    const channelUsernames = [
        '@uniannet',
        '@Pravda_Gerashchenko',
        '@truexanewsua',
        '@ukrainedefence',
        '@vanek_nikolaev',
        '@tgnews_ua',
        '@russian_ukrainian_war_bg',
        '@DeepStateUA',
        '@V_Zelenskiy_official',
        '@maximkatz',
        '@terraops'
    ];

    // Resolve the channel entities for each username with error handling
    const channels: any[] = [];
    for (const username of channelUsernames) {
        try {
            const channel = await client.getEntity(username); // Resolving the channel entity for the username
            channels.push(channel); // Adding the resolved channel entity to the channels array
        } catch (err: any) {
            console.error(`Failed to resolve ${username}: ${err.message}`);
        }
    }

    // Add an event handler for new messages in the specified channels
    client.addEventHandler(async (event) => {
        const message: any = event.message;
        
        const matchedChannel = channels.find(channel => channel.id.equals(message.peerId.channelId)); // Finding the channel that matches the message's peerId

        if (matchedChannel) {
            const originalLink = `https://t.me/${matchedChannel.username}/${message.id}`; // Constructing the original post link
            let text = message.message || "";
            if (text) {
                // Translate and filter the text
                const translatedText = await translateAndFilterText(text); // Translating and filtering the text
                if (translatedText) {
                    // Append the original post link
                    const finalText = `${translatedText}\n\n[Източник](${originalLink})`; // Constructing the final text with the translated text and the original post link

                    // Post the translated text to the destination channel
                    await client.sendMessage(destinationChannelUsername, { message: finalText }); // Sending the translated text as a message to the destination channel
                    console.log(`Forwarded translated message: "${finalText}"`);
                } else {
                    console.log("Message skipped due to irrelevance or overly detailed response for simple input.");
                }
            }
        }
    }, new NewMessage({}));

    console.log(`Bot is now listening for messages in the specified channels, filtering them, translating relevant content, and forwarding to ${destinationChannelUsername}...`);
}

run();
