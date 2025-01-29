const fs = require("fs");
const path = require("path");
require("dotenv").config();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const {sendMessage} = require("./telegramBot.js")

// --- Data storage for known tickets ---
const DATA_FILENAME = path.join(__dirname, "known_tickets.json");

// Load known tickets from JSON file as objects
function loadKnownTickets() {
    if (fs.existsSync(DATA_FILENAME)) {
        return JSON.parse(fs.readFileSync(DATA_FILENAME, "utf8"));
    }
    return [];
}

// Save known tickets to JSON file as objects
function saveKnownTickets(knownTickets) {
    fs.writeFileSync(DATA_FILENAME, JSON.stringify(knownTickets, null, 2));
}

async function checkForNewTickets(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/111.0.0.0 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "networkidle2" });
        await page.waitForNetworkIdle();

        const content = await page.content();
        const $ = cheerio.load(content);

        const foundProducts = [];
        const productSelector = ".product, .productListItem, .clubTemplateSliderProduct";
        $(productSelector).each((i, el) => {
            const homeTeam = $(el).find(".productTeamsFirstTeam > span").text().trim()
            const awayTeam = $(el).find(".productTeamsSecondTeam > span").text().trim()
            const venue = $(el).find(".productVenue").text().trim()
            const date = $(el).find(".productType").text().trim().replace(/\n\t+/g, '')
            const link = url+$(el).find(".buyProductButton").attr('href')
            const id = $(el).find(".buyProductButton").attr('id').split("_")[1]
            foundProducts.push({
                homeTeam,
                awayTeam,
                venue,
                date,
                link,
                id
            })
        });
        return foundProducts;
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

        // sendEmail(newItems);
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

