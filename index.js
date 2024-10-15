/** 
 * This script validates whether the newest 100 articles listed on Hacker News are indeed sorted by newest.
 * Test written in October 2024.
 * @author Monty
*/

// Playwright dependency
const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
  
  let num_articles_to_validate = 100;

  // If num_sorted_articles = num_articles_to_validate, the first 100 articles are sorted.
  let num_sorted_articles = 0;

  // Timestamp of the most recently compared article (which should be <= the timestamp of the next article)
  let oldest_timestamp = 0;

  let timestamps = [];

  // Open the webpage in the chromium browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News (sorted by newest)
  await page.goto("https://news.ycombinator.com/newest");

  // Get reference to article table (which is the second subtable in "hnmain")
  const article_table = await page.locator("table").locator("table").nth(1);
  const article_rows = await article_table.locator("tr");

  const article_athings = await article_table.locator(".athing")

  console.log("Num of tr's: " + (await article_rows.count()))
  console.log("Num of athing's: " + (await article_athings.count()))
  
  //article_athings.getAttribute()
  
  const more_button = page.getByText("More")
  
  /*
  for (let i = 0; i < 10; i++) {
    page.waitForTimeout(10000);
    more_button.click();
  }
  */

  // 
  /*while (num_sorted_articles < num_articles_to_validate) {
    const next_timestamp = await page.evaluate
  }*/

}

// Run sorting function on articles
(async () => {
  await sortHackerNewsArticles();
})();
