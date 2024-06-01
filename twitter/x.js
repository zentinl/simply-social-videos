const path = require('path');
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require('fs').promises;
const { twitterClient } = require("./twitterClient.js");

const main = async () => {
  try {
    const tweetsDirectory = path.join(__dirname, 'tweets');
    const files = await fs.readdir(tweetsDirectory);
    if (files.length === 0) {
      throw new Error('No files in the tweets directory.');
    }

    const stats = await Promise.all(files.map(file => fs.stat(path.join(tweetsDirectory, file))));
    const newestFile = files[stats.reduce((prev, curr, i) => (curr.ctime > stats[prev].ctime) ? i : prev, 0)];

    const filePath = path.join(tweetsDirectory, newestFile);
    let tweetData;
    try {
      tweetData = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (parseError) {
      console.error('Failed to parse tweet data:', parseError);
      return;
    }

    const tweetContent = tweetData.tweet;
    const response = await twitterClient.v2.tweet(tweetContent);
    const tweetUrl = `https://twitter.com/estebs/status/${response.data.id}`;
    console.log('Tweet posted successfully. You can view it at:', tweetUrl);

    const sentTweetsDirectory = path.join(__dirname, 'sent-tweets');
    await fs.mkdir(sentTweetsDirectory, { recursive: true });

    const tweetJsonPath = path.join(sentTweetsDirectory, `${new Date().toISOString()}-tweet.json`);
    await fs.writeFile(tweetJsonPath, JSON.stringify({ tweetUrl }), 'utf8');
    console.log('Tweet URL stored successfully in tweet.json.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
