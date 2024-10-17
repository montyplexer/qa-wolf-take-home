/** 
 * This script validates whether the newest 100 articles listed on Hacker News are indeed sorted by newest.
 * Test written in October 2024.
 * @author Monty
*/

/*
 * Note: I was concerned that there could be a race condition in the following scenario: 
 *  An article gets posted right as we move from the first page to the second page. Thus we end up verifying the same article twice.
 *  (Thus we end up only validating 99 of the newest articles, instead of 100).
 * However, I conducted a test:
 *  I had two tabs open pointing to "https://news.ycombinator.com/newest".
 *  I clicked "More" on one tab.
 *  I waited 10 min (plenty of time for multiple articles to be posted).
 *  I clicked "More" on the other tab.
 *  If the article list was the same on both tabs, 
 *   then navigation with the "More" button will not cause a race condition because the list will be consistent across time.
 * After conducting the procedure twice, I conclude that the list is time-invariant and will not cause a race condition.
 */

// Playwright dependencies
const { chromium } = require("playwright");
const { test, expect } = require("playwright/test");

/**
 * Test: The first 100 articles listed on Hacker News (https://news.ycombinator.com/newest) are sorted by newest.
 */
async function sortHackerNewsArticles() {
  // Open the webpage in the chromium browser
  const browser = await chromium.launch({ headless: false });
  let context = await browser.newContext();
  let page = await context.newPage();

  // Validate this many articles as part of the test. Article list may be spread across several pages
  let num_of_articles_to_validate = 100;

  // The index of the first article on a page
  let article_index = 1;

  // This is the timestamp of the most recently compared article
  let newest_timestamp = new Date();

  

  // Open the Hacker News article listing, sorted by newest, starting at article index 1
  await page.goto("https://news.ycombinator.com/newest", { waitUntil: 'domcontentloaded' });
  // Get a reference to the button that shows more articles
  // It is generally better to refer to a button by it's user-facing attributes, i.e. text instead of class name when possible
  const more_button = await page.locator('.morelink');
  // There should only be exactly one "More" button
  await expect(more_button).toHaveCount(1);

  // Continue to validate timestamps on pages until we have checked the desired number of articles
  while (article_index <= num_of_articles_to_validate) {

    // The site began to refuse my connection, so I will add randomized delay so that I am less likely to trigger refusal by mimicking more natural browsing
    await page.waitForTimeout(random_delay(200,800));

    // Navigate to next page
    await more_button.click();

    // Additional delay
    await page.waitForTimeout(random_delay(200,800));

    // If the "More" button is not present, chances are the page did not load and the site refused to load the article list
    // Since I do not control how the site is run, the best I can do is let the tester know how this test failed
    if (await more_button.count() !== 1) {
      console.log("========================================================================================");
      console.log("Test failed! Next page did not load properly, did the site refuse to load the articles?");
      console.log("========================================================================================");
      console.log("");
      console.log("[Page HTML]");
      console.log(await page.content());
      console.log("");
      process.exit(-1);
    }
    
    // Check that the needed elements for the test are loaded in and visible
    await page.waitForSelector('.age');
    await page.waitForSelector('.athing');
    await page.waitForSelector('.score');

    // Get a reference to the article table
    let article_table = await page.locator('table').locator('table').nth(1);

    // Call page-level function 
    [article_index, newest_timestamp] = await validateArticlesOnPage(article_table, article_index, num_of_articles_to_validate, newest_timestamp);
    
  }
  
  // Test has concluded successfully, we can terminate without error
  page.close();
  console.log("========================================================================================");
  console.log("Test successful! Verified " + num_of_articles_to_validate + " articles are in newest order!");
  console.log("========================================================================================");

  //return true;
  process.exit(0);
}

/**
 * Page-level function called for each new url in this test
 * @param {Locator} article_table locator pointing to table containing the articles
 * @param {int} article_index keeps track of how many articles have been validated
 * @param {int} num_of_articles_to_validate how many articles need to be validated for the entire test
 * @param {Date} newest_timestamp should be newer than any of the articles on this page
 * @returns an updated article_index and newest_timsetamp to be used for the next page
 */
async function validateArticlesOnPage(article_table, article_index, num_of_articles_to_validate, newest_timestamp) {

  // Retrieve timestamps using "age" class 
  let article_ages = await article_table.locator('.age');

  // Retrieve article titles using class "athing"
  let article_athings = await article_table.locator('.athing');
  
  // Retrieve article id using "score" class 
  let article_scores = await article_table.locator('.score');

  // There must be an equal number of links, scores, and timestamps
  let count_ages = await article_ages.count();
  let count_athings = await article_athings.count();
  let count_scores = await article_scores.count();
  if (count_ages !== count_athings || count_ages !== count_scores) {
    console.log("========================================================================================");
    console.log("Test failed! Could not get an equal number of articles and timestamps on this page!");
    console.log("========================================================================================");
    exit(-1);
  }

  // New page and progress 
  console.log("========================================================================================");
  console.log("Most recent timestamp:       " + (newest_timestamp));
  console.log("Article # start:             " + (article_index));
  console.log("Num of articles:             " + (count_athings));
  console.log("Num of timestamps:           " + (count_ages));
  console.log("Num of article IDs (score):  " + (count_scores));
  console.log("========================================================================================");
  console.log("");

  // The number of articles to check on this page is either the amount of articles loaded in or less
  let num_of_articles_to_check_on_page = Math.min(count_athings, num_of_articles_to_validate - article_index + 1);

  // Check that each article on this page is sorted by newest (using timestamp)
  for (let i = 0; i < num_of_articles_to_check_on_page; i++) {
    
    // Extract article info
    let title = await article_athings.locator('.titleline').nth(i).textContent();
    let id = ( await article_scores.nth(i).getAttribute('id') ).substring(6);
    let timestamp = new Date( await article_ages.nth(i).getAttribute('title') );
    
    // Article list page breakdown
    console.log(article_index + '. [' + timestamp + '] | ID:' + id + '\n"' + title + '"\n');

    // Compare timestamps
    console.log('Most recent: ' + newest_timestamp.toTimeString());
    console.log('Current:     ' + timestamp.toTimeString() + '\n');

    // Test fails if the current timestamp is newer than (greater than) the most recently compared article
    if (timestamp > newest_timestamp) {
      console.log("========================================================================================");
      console.log("Test failed! Articles are not in newest order!");
      console.log("========================================================================================");
      console.log("");
      process.exit(-1);
    }

    // Update timestamp
    newest_timestamp = timestamp;

    // Increment validates article count
    article_index += 1;
  }

  // Test passes for the current page
  console.log("========================================================================================");
  console.log("Successfully checked page for newest order!");
  console.log("========================================================================================");
  console.log("");

  return [article_index, newest_timestamp];
}

/**
 * Generates a value representing a delay in milliseconds.
 * @param {int} ms_min_time minimum delay time in milliseconds
 * @param {int} ms_range difference between the minimum delay time and maximum delay time in milliseconds
 * @returns a randomized number representing a delay in milliseconds 
 */
function random_delay(ms_min_time,ms_range) { return ms_min_time + Math.floor(Math.random() * ms_range); }

// Run sorting function on articles
(async () => {
  await sortHackerNewsArticles();
})();