/** 
 * This script validates whether the newest 100 articles listed on Hacker News are indeed sorted by newest.
 * Test written in October 2024.
 * @author Monty
*/

// Playwright dependency
const { chromium } = require("playwright");
const { expect } = require("playwright/test");

async function sortHackerNewsArticles() {
  // Open the webpage in the chromium browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  let page = await context.newPage();

  // Validate this many articles as part of the test. Article list may be spread across several pages
  let num_of_articles_to_validate = 100;

  // The index of the first article on a page
  let article_index = 1;

  // This is the timestamp of the most recently compared article
  let newest_timestamp = new Date();

  // Get a reference to the button that shows more articles
  // It is generally better to refer to a button by it's user-facing attributes, i.e. text instead of class name when possible
  //const more_button = page.locator('.morelink');
  // There should only be exactly one "More" button
  //await expect(more_button).toHaveCount(1);
  //more_button.click();

  // Continue to validate timestamps on pages until we have checked the desired number of articles
  while (article_index < num_of_articles_to_validate) {
    console.log("Article Index: " + article_index);
    
    // Go to Hacker News (sorted by newest, starting at article_index)
    await page.goto("https://news.ycombinator.com/newest?n="+article_index, { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector('.age');

    // Call page-level function 
    [article_index, newest_timestamp] = await validateArticlesOnPage(page, article_index, num_of_articles_to_validate, newest_timestamp);
    
  }
  page.close();
  process.exit(0);
}

/* Page-level function */
async function validateArticlesOnPage(page, article_index, num_of_articles_to_validate, newest_timestamp) {

  //await page.goto("https://news.ycombinator.com/newest?n="+article_index, { waitUntil: 'domcontentloaded' });

  // Get reference to article table (which is the second subtable in "hnmain")
  //const main_table = await page.locator('table');
  let article_table = await page.locator('table').locator('table').nth(1);
  await article_table.waitFor();
  await page.waitForSelector('.age');
  await page.waitForSelector('.athing');
  await page.waitForSelector('.score');


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
    console.log("Failed to get an equal number of articles and timestamps on this page!");
    exit(-1);
  }

  console.log("================================================");
  console.log("Most recent timestamp:      " + (newest_timestamp))
  console.log("Article # start:            " + (article_index))
  console.log("Num of articles:            " + (count_athings));
  console.log("Num of timestamps:          " + (count_ages));
  console.log("Num of article IDs (score): " + (count_scores));
  console.log("================================================");

  let num_of_articles_to_check_on_page = Math.min(count_athings,num_of_articles_to_validate-article_index);

  // Check that each article on this page is sorted by newest (using timestamp)
  for (let i = 0; i < num_of_articles_to_check_on_page; i++) {
    
    // Extract article info
    let title = await article_athings.locator('.titleline').nth(i).textContent();
    let id = ( await article_scores.nth(i).getAttribute('id') ).substring(6);
    let timestamp = new Date( await article_ages.nth(i).getAttribute('title') );
    
    // DEBUGGING: Article list page breakdown
    console.log('[' + timestamp + '] | ID:' + id + '\n"' + title + '"\n');

    // DEBUGGING: Compare timestamps
    console.log('Most recent: ' + newest_timestamp.toTimeString())
    console.log('Current:     ' + timestamp.toTimeString() + '\n')

    // Test fails if the current timestamp is newer than (greater than) the most recently compared article
    if (timestamp > newest_timestamp) {
      console.log("Failed test: articles are not in newest order!");
      process.exit(-1);
    }

    // Update timestamp
    newest_timestamp = timestamp;

    // Increment validates article count
    article_index += 1;
  }

  // Test passes for the current page
  console.log("Successfully checked page for newest order!");

  return [article_index, newest_timestamp]

}

// Run sorting function on articles
(async () => {
  await sortHackerNewsArticles();
})();
