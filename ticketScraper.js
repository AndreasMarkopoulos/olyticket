const fs = require("fs");
const path = require("path");
require("dotenv").config();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const {sendMessage} = require("./telegramBot.js")

let queueStates = {}; // Object to track queue state for each URL

// --- Data storage for known tickets ---
// Using /app/data if your Docker container's working directory is /app
const DATA_DIRECTORY = path.join(__dirname, "data");
const DATA_FILENAME = path.join(DATA_DIRECTORY, "known_tickets.json");

// Load known tickets from JSON file as objects
function loadKnownTickets() {
    if (fs.existsSync(DATA_FILENAME)) {
        return  JSON.parse(fs.readFileSync(DATA_FILENAME, "utf8"));
    }
    return [];
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Save known tickets to JSON file as objects
function saveKnownTickets(knownTickets) {
    console.log("Saving known_tickets.json to:", DATA_FILENAME);
    fs.writeFileSync(DATA_FILENAME, JSON.stringify(knownTickets, null, 2));
}

async function checkForNewTickets(url) {
    console.log("Opening browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--disable-extensions",
            "--disable-background-networking",
            "--disable-sync",
            "--disable-default-apps",
            "--disable-features=TranslateUI",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
        ],
    });

    try {
        await delay(1000);
        const page = await browser.newPage();
        await delay(2000);
        console.log(`Navigating to URL: ${url}`);

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/111.0.0.0 Safari/537.36"
        );

        // Go to the page
        await page.goto(url, { waitUntil: "domcontentloaded" });

        // Check if the page redirects to a queue
        const currentUrl = page.url();
        if (currentUrl.includes("queue-it") || currentUrl.includes("waitingroom")) {
            if (!queueStates[url]) {
                console.log(`Queue detected for ${url}! Sending alert...`);
                await sendMessage({
                    text: `🚨 Queue detected on Ticketmaster! 🚨\nNew tickets may be releasing soon.\n🔗 [Join Queue](${currentUrl})`
                });
                queueStates[url] = true; // Mark queue as active for this URL
            } else {
                console.log(`Queue still active for ${url}. No duplicate message sent.`);
            }

            await browser.close();
            return []; // Stop scraping since we're in a queue
        }

        // If no queue detected but was previously active, reset state
        if (queueStates[url]) {
            console.log(`Queue is no longer active for ${url}. Resetting state.`);
            delete queueStates[url]; // Remove queue state for this URL
        }

        await page.waitForNetworkIdle();
        const content = await page.content();
        const $ = cheerio.load(content);

        const foundProducts = [];
        const productSelector = ".product, .productListItem, .clubTemplateSliderProduct";

        $(productSelector).each((i, el) => {
            const homeTeam = $(el).find(".productTeamsFirstTeam > span").text().trim();
            const awayTeam = $(el).find(".productTeamsSecondTeam > span").text().trim();
            const venue = $(el).find(".productVenue").text().trim();
            const date = $(el).find(".productType").text().trim().replace(/\n\t+/g, '');
            const link = url + $(el).find(".buyProductButton").attr('href');
            const id = $(el).find(".buyProductButton").attr('id')?.split("_")[1] || `unknown-${i}`;

            foundProducts.push({
                homeTeam,
                awayTeam,
                venue,
                date,
                link,
                id
            });
        });

        return foundProducts;
    } catch (error) {
        console.error("Scraping error:", error);
        return [];
    } finally {
        await browser.close();
    }
}

async function main() {
    const knownTickets = loadKnownTickets();

    const basketballUrl = "https://www.ticketmaster.gr/osfpbc/";
    const footballUrl = "https://www.ticketmaster.gr/olympiacos/";

    const [basketballResults, footballResults] = await Promise.all([
        checkForNewTickets(basketballUrl),
        checkForNewTickets(footballUrl),
    ]);

    const currentProducts = [...basketballResults, ...footballResults];

    const newItems = currentProducts.filter(
        (newTicket) =>
            !knownTickets.some(
                (knownTicket) =>
                    newTicket.id === knownTicket.id
            )
    );

    if (newItems.length > 0) {
        const updatedKnown = [...knownTickets, ...newItems];
        saveKnownTickets(updatedKnown);
        for(const ticket of newItems) {
            sendMessage(ticket)
        }

        console.log("New tickets detected and message sent.");
    } else {
        console.log("No new tickets. Checked at " + new Date().toLocaleString());
    }
}

// Schedule the checks (run once immediately, then at the configured interval)
(async function scheduleCheck() {
    const defaultFrequencyMinutes = 5;
    const frequencyMinutes = parseInt(process.env.SEARCH_FREQUENCY || defaultFrequencyMinutes, 10) || defaultFrequencyMinutes;
    const intervalMs = frequencyMinutes * 60 * 1000; // Convert minutes to milliseconds

    console.log(`Ticket check frequency set to ${frequencyMinutes} minute(s).`);

    try {
        await main();
    } catch (error) {
        console.error("Error occurred during the initial check:", error);
    }

    setInterval(async () => {
        try {
            await main();
        } catch (error) {
            console.error("Error occurred during a scheduled check:", error);
        }
    }, intervalMs);
})();

