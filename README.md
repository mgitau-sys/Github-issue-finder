# Github Issue Finder

Helps beginners find approachable, well-labeled open-source issues to make
their first contribution to 

## Why this exists
Getting started with contributing to open source code on github is harder than it should be 
because the beginner friendly issues with various labels are scattered across millions of
repositories that are not related. And its so hard to browse exactly what you want to work
on and thats what this app is solving. Search once and filter by language, topic and get a 
well arranged list of issues one can go and contribute right away.

**Demo video:** https://www.loom.com/share/738538e894594d6c8563a0f64f3190a0
**Link to deployed website:** https://3.92.185.125/
## Features

- Search open GitHub issues labeled as beginner-friendly
- Filter by programming language, keyword, and minimum stars
- Sort by most recently updated, newest, or most discussed
- Clear loading, empty, and error states
- API credentials kept server-side only — never exposed to the browser

## Tech stack

- Backend: Node.js, Express, Axios
- Frontend: Plain HTML, CSS, and JavaScript (no framework, no build step)


## APIs used

**[GitHub REST API — Search Issues and Pull Requests](https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-issues-and-pull-requests)**

All event data in this app comes directly from GitHub's Search API,
maintained and provided free of charge by GitHub, Inc. Full credit to
GitHub and its API team for making this data publicly accessible.
Reference docs used throughout development:
- [Search API overview](https://docs.github.com/en/rest/search)
- [Searching issues and pull requests (query syntax)](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

## Libraries used

- [Express] — web server and routing
- [Axios] — HTTP client for calling the GitHub API
- [dotenv] — loads environment variables from `.env`

## Running it locally

**1. Clone the repository and install dependencies:**
```bash
git clone <your-repo-url>
cd Github-issue-finder
npm install
```

**2. Get a GitHub personal access token:**
Go to GitHub and generate a basic fine-grained token 

**3. Set up your environment file:**
```bash
cp .env.example .env
```
Then open `.env` and add your token:
```
GITHUB_TOKEN=your_actual_token_here
```

**4. Start the app:**
```bash
npm start
```

**5. Open it in your browser:**
```
http://localhost:3000
```

## Deploying to Web01, Web02, and Lb01

This app is deployed across two application servers (**Web01**, **Web02**)
running NGINX as a reverse proxy, behind a load balancer (**Lb01**)
running **HAProxy** with HTTPS termination, which distributes incoming
traffic between them using round-robin balancing.

### 1. Set up each app server (repeat on both Web01 and Web02)

Install Node.js and PM2 (to keep the app running in the background and
restart it automatically if it crashes or the server reboots):
```bash
sudo apt update
sudo apt install -y nodejs npm
sudo npm install -g pm2
```

Get the code onto the server and install dependencies:
```bash
git clone <your-repo-url> Github-issue-finder
cd Github-issue-finder
npm install
```

Set environment variables directly on the server (never committed to
the repo):
```bash
cp .env.example .env
nano .env   # add your actual GITHUB_TOKEN
```

Start the app with PM2 and enable it to survive reboots:
```bash
pm2 start server.js --name good-first-issue-finder
pm2 save
pm2 startup   
```

Install NGINX and configure it as a reverse proxy, forwarding public
port 80 to the app running on port 3000:
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/default
```
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
```bash
sudo nginx -t #to confirm if the configuration is valid
sudo systemctl reload nginx
```

### 2. Load balancer (lb01)
I had already configured it in previous projects to distribute traffic between the 2 web servers
It redirects incoming HTTP (port 80)
to HTTPS (port 443, TLS-terminated at the load balancer), then forwards
requests to a backend that round-robins between Web01 and Web02 on
port 80:
```
frontend http_incoming
    bind *:80
    redirect scheme https code 301

frontend https_incoming
    bind *:443 ssl crt /etc/ssl/private/haproxy.pem
    default_backend http_outgoing

backend http_outgoing
    balance roundrobin
    server web-01 <WEB01_IP>:80 check
    server web-02 <WEB02_IP>:80 check
```
### 3. Verifying the load balancer works
```
use curl -skI <lbo1 address>
```
```
Example output confirming traffic is split across both servers:
```
X-Served-By: web-01
X-Served-By: web-02
X-Served-By: web-01
X-Served-By: web-02
X-Served-By: web-01
X-Served-By: web-02
```

## Security notes

- The GitHub token lives only in `.env` locally`. It is never sent to the browser or
  included in any frontend file.
- `.env` is excluded from version control via `.gitignore` so it can
  never end up in the public repository by accident.


## Future improvements

- Cache recent searches briefly to reduce API calls 
- Let users bookmark issues they're interested in
