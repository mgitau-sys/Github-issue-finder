// server.js
// Entry point. Loads environment variables, sets up Express, serves the
// static frontend, and mounts the /issues API route.

require('dotenv').config();
const express = require('express');
const path = require('path');
const issuesRouter = require('./routes/issues');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GITHUB_TOKEN) {
  console.warn(
    '  GITHUB_TOKEN is not set.Add your personal access token to .env.'
  );
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/issues', issuesRouter);

app.listen(PORT, () => {
  console.log(`Good First Issue Finder running at http://localhost:${PORT}`);
});