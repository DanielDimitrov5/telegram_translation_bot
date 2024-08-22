# Telegram Translation and Filtering Bot

This Telegram bot listens to specific channels, translates relevant messages into Bulgarian, and forwards the translated messages to a target channel. It uses a language model running in LM Studio to filter out irrelevant or nonsensical content.

## Features

- **Translation**: Translates messages from various Telegram channels into Bulgarian.
- **Content Filtering**: Skips irrelevant, nonsensical, or unrelated messages based on the model's analysis.
- **Automatic Forwarding**: Forwards the translated and filtered messages to a specified Telegram channel.
- **Environment Variables**: Uses environment variables for configuration, keeping sensitive data secure.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed.
- **Telegram API**: You need a Telegram API ID, API Hash, and a string session.
- **LM Studio**: The bot relies on a language model running in LM Studio to process and filter messages.
- **Dotenv**: Environment variables are managed through a `.env` file.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/DanielDimitrov5/telegram_translation_bot.git
   cd your-repo-name
   npm install
    ```

2. **Create a `.env` File**:
- Set up the environment variables in a `.env` file. Take a look at the `.env.example` file for reference.

3. **Run the Bot**:
   ```bash
   npm run build
   npm start

   OR

   npm run dev
   ```

## Usage
- The bot will listen to a list of predefined Telegram channels, translate messages into Bulgarian, and post the relevant content to a specified channel.
- If the content is irrelevant or nonsensical, the bot will skip the message and not post it.

## Customization
- You can modify the array of channels to listen to in the `channelUsernames` variable.
- You can modify the model's behavior by modifying the prompts in the axios request.

## Contributing
- Contributions are welcome! Feel free to open an issue or submit a pull request if you have any improvements or bug fixes.