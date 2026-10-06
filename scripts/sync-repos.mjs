// Lists the owner's repos tagged with TOPIC (public and private) and writes repos.json.
// Needs env: GH_TOKEN (PAT that can read the repos' metadata), GH_USER, TOPIC (optional).
import { writeFileSync } from 'node:fs';

const token = process.env.GH_TOKEN;
const user = process.env.GH_USER;
const topic = process.env.TOPIC || 'portfolio';
if (!token || !user) { console.error('GH_TOKEN and GH_USER required'); process.exit(1); }

const items = [];
for (let page = 1; ; page++) {
  const res = await fetch(`https://api.github.com/user/repos?affiliation=owner&per_page=100&page=${page}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
  const batch = await res.json();
  items.push(...batch);
  if (batch.length < 100) break;
}

const out = items
  .filter(r => r.owner.login.toLowerCase() === user.toLowerCase() && !r.fork && !r.archived && (r.topics || []).includes(topic))
  .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
  .map(r => ({
    full_name: r.full_name, name: r.name, description: r.description, language: r.language,
    topics: r.topics, homepage: r.homepage, html_url: r.html_url, private: r.private, fork: false
  }));

writeFileSync('repos.json', JSON.stringify({ items: out }, null, 2) + '\n');
console.log(`wrote ${out.length} repos`);
