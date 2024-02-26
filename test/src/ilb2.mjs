import puppeteer from "puppeteer";
import express from "express";
import { expect } from "chai";
import { URL } from 'url';
const app = express();

// helper functions to start/stop server before/after tests
let server = null;
const startServer = () => {
    const __dirname = new URL('.', import.meta.url).pathname;
    app.use(express.static(__dirname + '/../../docs'));
    server = app.listen(8080);
};
const stopServer = () => {
    server.close();
};

// puppeteer options
const opts = {
    headless: true,
    timeout: 2000
};

// helper functions for pupeteer
const isElementVisible = async (page, cssSelector) => {
    let visible = true;
    await page.waitForSelector(cssSelector, { visible: true })
        .catch(() => {
            visible = false;
        });
    return visible;
};

const isElementNotVisible = async (page, cssSelector) => {
    let visible = false;
    await page.waitForSelector(cssSelector, { visible: false })
        .catch(() => {
            visible = true;
        });
    return visible;
};

describe('imagelightbox', function () {

    let browser;
    let page;

    before(async function () {
        startServer();
        browser = await puppeteer.launch(opts);
        page = await browser.newPage();
    });

    beforeEach(async function () {
        page = await browser.newPage();
        await page.goto('http://localhost:8080',{ waitUntil: "load" });
    });

    afterEach(async function () {
        await page.close();
    });

    after(async function () {
        await browser.close();
        stopServer();
    });
});
