# Ticket Scraper & Notifier

This Node.js application periodically checks for new Olympiacos basketball and football tickets on [Ticketmaster Greece](https://www.ticketmaster.gr/). If new tickets are found, it sends Telegram notifications to a specified group/channel. It also keeps track of previously found tickets locally to avoid duplicate alerts.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

1. **Scrapes Ticketmaster** for Olympiacos basketball and football ticket availability.
2. **Parses the HTML** using [Cheerio](https://cheerio.js.org/).
3. **Stores known tickets** in a local JSON file (`known_tickets.json`).
4. **Sends notifications** via Telegram when new tickets appear.
5. **Runs on a schedule** (default: checks every 5 minutes).

---

## Features

- **Automated Scraping**: Uses [Puppeteer](https://github.com/puppeteer/puppeteer) to navigate and load pages.
- **Smart Detection**: Compares newly found tickets with previously stored tickets to avoid duplicate notifications.
- **Telegram Integration**: Sends messages with details (teams, venue, date) and a direct link to purchase the tickets.
- **Easy Configuration**: Frequency of checks and Telegram credentials are configurable via environment variables.

---

## Requirements

- **Node.js** (v14+ recommended)
- **npm** or **yarn**
- A [Telegram Bot API key](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and a Telegram group/channel to post messages.

---

## Installation

1. **Clone this repository**:
   ```bash
   git clone https://github.com/<your-username>/ticket-scraper.git
   cd ticket-scraper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

---

## Configuration

Create a `.env` file in the project root (same directory as `ticketScraper.js` and `telegramBot.js`) with the following variables:

```bash
TELEGRAM_BOT_API_KEY=your_telegram_bot_api_key
TELEGRAM_GROUP_ID=your_telegram_group_id
SEARCH_FREQUENCY=5
```

Where:
- **TELEGRAM_BOT_API_KEY**: The API token for your Telegram bot.
- **TELEGRAM_GROUP_ID**: The integer (or string) ID of the Telegram group/channel where messages will be sent.
    - If sending to a private group, you need to invite the bot to the group and [retrieve the chat ID](https://core.telegram.org/bots#6-botfather).
- **SEARCH_FREQUENCY**: The interval (in minutes) at which the scraper runs. Default: `5`.

Make sure your `.env` file is included in your `.gitignore` to keep your credentials private.

---

## Usage

1. **Start the scraper**:
   ```bash
   npm start
   ```
   or
   ```bash
   node ticketScraper.js
   ```

2. The script will:
    - Immediately perform a check upon launch.
    - Schedule subsequent checks based on the `SEARCH_FREQUENCY` environment variable (default: every 5 minutes).

3. **Check the console output** to see if any new tickets were found or if no new tickets were detected.

### Data Persistence

- **known_tickets.json**:
    - Stores the IDs of previously found tickets to prevent duplicate notifications.
    - Automatically updated each time new tickets are discovered.

---

## File Structure

```bash
ticket-scraper/
├── .env                  # Environment variables
├── known_tickets.json    # Stored ticket data (auto-created/updated)
├── package.json          # Project metadata and scripts
├── README.md             # This readme file
├── telegramBot.js        # Telegram bot logic
└── ticketScraper.js      # Main script for scraping and scheduling
```

### Key Files

- **ticketScraper.js**
    - Handles the scraping logic using Puppeteer and Cheerio.
    - Compares new and known tickets, triggers Telegram alerts if new tickets appear.
    - Schedules the scraping process based on `SEARCH_FREQUENCY`.

- **telegramBot.js**
    - Configures and starts the Telegram bot.
    - Exports a `sendMessage(ticket)` function used by `ticketScraper.js` to send messages to a group/channel.

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check [issues page](../../issues/) if you want to contribute.

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/my-feature`.
3. Make your changes and commit them: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Create a pull request.

---

## License

This project is open source and available under the [MIT License](LICENSE). Feel free to use, modify, and distribute as you see fit.