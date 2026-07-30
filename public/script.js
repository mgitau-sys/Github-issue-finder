// Wires up the search form to our own /issues route, then renders the
// results as cards

const form = document.getElementById('searchForm');
const languageSelect = document.getElementById('language');
const topicInput = document.getElementById('topic');
const minStarsSelect = document.getElementById('minStars');
const sortSelect = document.getElementById('sort');
const statusBar = document.getElementById('statusBar');
const resultsGrid = document.getElementById('resultsGrid');

async function fetchIssues({ language, topic, minStars, sort }) {
  const params = new URLSearchParams();
  if (language) params.append('language', language);
  if (topic) params.append('topic', topic);
  if (minStars) params.append('minStars', minStars);
  if (sort) params.append('sort', sort);

  const response = await fetch(`/issues?${params.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return response.json(); // { count, issues }
}
// converting the display of dates to how long ago it was updated
function timeAgo(dateString) {
  const difference = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));// converting milliseconds to days
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);// converts days to months
  return `${months} month${months === 1 ? '' : 's'} ago`;//add s if its more than one month
}
//
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderEmptyState(message) {
  resultsGrid.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderIssues(issues) {
  if (issues.length === 0) {
    renderEmptyState('No issues matched those filters. Try a broader language or drop the star minimum.');
    return;
  }

  resultsGrid.innerHTML = issues
    .map((issue) => {
      const labels = issue.labels
        .slice(0, 3)
        .map((label) => `<span class="label-pill">${escapeHtml(label)}</span>`)
        .join('');

      return `
        <a class="issue-card" href="${issue.url}" target="_blank" rel="noopener noreferrer">
          <span class="card-repo">${escapeHtml(issue.repo)}</span>
          <p class="card-title">${escapeHtml(issue.title)}</p>
          <p class="card-snippet">${escapeHtml(issue.snippet)}${issue.snippet.length >= 160 ? '…' : ''}</p>
          <div class="card-labels">${labels}</div>
          <div class="card-meta">
            <span>${issue.commentCount} comment${issue.commentCount === 1 ? '' : 's'}</span>
            <span class="amber">updated ${timeAgo(issue.updatedAt)}</span>
          </div>
        </a>
      `;
    })
    .join('');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const filters = {
    language: languageSelect.value,
    topic: topicInput.value.trim(),
    minStars: minStarsSelect.value,
    sort: sortSelect.value,
  };

  statusBar.classList.remove('error');
  statusBar.textContent = 'Searching…';
  resultsGrid.innerHTML = '';

  try {
    const { count, issues } = await fetchIssues(filters);
    statusBar.textContent = `${count} issue${count === 1 ? '' : 's'} found.`;
    renderIssues(issues);
  } catch (err) {
    statusBar.classList.add('error');
    statusBar.textContent = err.message || 'Something went wrong. Try again.';
    renderEmptyState('Nothing to show — the search hit an error above.');
  }
});