// routes/issues.js
// Handles GET /issues?language=...&topic=...&minStars=...&sort=...
// Queries GitHub's Search API for open issues labeled as beginner-friendly,

const express = require('express');
const axios = require('axios');
const router = express.Router();

const GITHUB_SEARCH_URL = 'https://api.github.com/search/issues';

// Defining labels that are going to be used in our request
const BEGINNER_LABELS = ['good first issue', 'help wanted'];

router.get('/', async (req, res) => {
  const { language, topic, minStars, sort } = req.query;

  // Build a GitHub search query string
  const labelFilter = BEGINNER_LABELS.map((label) => `label:"${label}"`).join(' OR ');
  let query = `is:issue is:open (${labelFilter})`;

  if (language) query += ` language:${language}`;
  if (minStars) query += ` stars:>=${minStars}`;
  if (topic) query += ` ${topic}`;

  console.log('[GitHub search query]', query);
  //A sort logic to only allow created, updated and comments
  const allowedSorts = ['created', 'updated', 'comments'];
  let finalSort;
  if (allowedSorts.includes(sort)) {
    finalSort = sort;
  }else {
    finalSort = undefined;
  }
//fetching responses from github with various specification
  try {
    const response = await axios.get(GITHUB_SEARCH_URL, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      params: {
        q: query,
        sort: finalSort,
        order: 'desc',
        per_page: 24,
      },
    });

    console.log('[GitHub total_count]', response.data.total_count);

    const items = response.data.items || [];

    const issues = items.map((item) => ({
      id: item.id,
      title: item.title,
      repo: item.repository_url.split('/').slice(-2).join('/'),
      repoUrl: item.repository_url.replace('api.github.com/repos', 'github.com'),
      url: item.html_url,
      snippet: (item.body || '').slice(0, 160).trim(),
      labels: (item.labels || []).map((l) => l.name),
      commentCount: item.comments,
      updatedAt: item.updated_at,
    }));

    res.json({ count: issues.length, issues });
    //catching various errors 
  } catch (error) {
    if (error.response) {
      console.error('GitHub API error:', error.response.status, error.response.data);
      const status = error.response.status;
      const message =
        status === 403
          ? 'GitHub API rate limit reached. Try again in a few minutes.'
          : status === 422
          ? 'That search combination was invalid. Try a different language or topic.'
          : 'Failed to fetch issues from GitHub.';
      return res.status(status).json({ error: message });
    } else if (error.request) {
      // Request went out but no response came back
      console.error('No response from GitHub:', error.message);
      return res.status(503).json({ error: 'GitHub API is unreachable. Try again later.' });
    } else {
      console.error('Unexpected error:', error.message);
      return res.status(500).json({ error: 'Something went wrong on our end.' });
    }
  }
});
//to make sure this code can be imported or used in other modules or files
module.exports = router;