// ==UserScript==
// @name         Redmine: Get API Key
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Get API key from user
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js
// ==/UserScript==

let API_KEY = GM_getValue('apiKey');
if (!API_KEY) {
      API_KEY = prompt('Please enter your API key:');
      if (API_KEY) GM_setValue('apiKey', API_KEY);
}


/////////////////////////////////Add start and due dates////////////////////////////////
const REDMINE_URL = 'http://redmine.cmbu-engineering.diasemi.com';

async function getSubtasks(issueKey) {
      const taskId = issueKey.replace("issue-", "");
      const url = `${REDMINE_URL}/issues/${taskId}.json?include=children`;

      try {
            const response = await fetch(url, {
                  headers: {
                        "X-Redmine-API-Key": API_KEY
                  }
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            if (data.issue.children) {
                  // console.log("Subtasks:", data.issue.children);
                  return data.issue.children;
            } else {
                  // console.log("No subtasks found.");
                  return [];
            }
      } catch (error) {
            console.error("Error fetching subtasks:", error);
      }
}

async function getIssueProperty(issueKey, key) {
      const issueId = issueKey.replace("issue-", "");

      try {
            const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?include=children?key=${API_KEY}`);
            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            const issueData = data.issue;
            return issueData.hasOwnProperty(key) ? issueData[key] : null;
      } catch (error) {
            console.error("Error fetching issue:", error);
            return null;
      }
}

async function updateIssueProperty(issueKey, jsonKey, value) {

      const issueId = issueKey.replace("issue-", "");
      // Prepare the data to send to the Redmine API
      const requestData = {
            issue: {
                  [jsonKey]: value // New due date to set
            }
      };

      try {
            const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`, {
                  method: 'PUT',
                  headers: {
                        'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestData) // Send data as JSON
            });

            if (response.ok) {
                  const data = await response.json();
                  console.log("Start date updated successfully:", data);
            } else {
                  console.error("Error updating start date:", response.statusText);
            }
      } catch (error) {
            console.error("Network or request error:", error);
      }
}

/////////////////////////////////Add button to set default values for Impl part//////////////

async function getIssueData(issueKey) {
      // Extract numeric issue ID
      const issueId = issueKey;

      try {
            // Fetch issue details
            const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`);

            if (!response.ok) {
                  throw new Error("Network response was not ok");
            }

            const data = await response.json();
            return data;
      } catch (error) {
            console.error("Error fetching issue:", error);
            return null; // Return null or an appropriate value in case of error
      }
}

////////////////////////////////Add release tag///////////////////

async function getSubtasks(issueKey) {
      const taskId = issueKey.replace("issue-", "");
      const url = `${REDMINE_URL}/issues/${taskId}.json?include=children`;

      try {
            const response = await fetch(url, {
                  headers: {
                        "X-Redmine-API-Key": API_KEY
                  }
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            if (data.issue.children) {
                  // console.log("Subtasks:", data.issue.children);
                  return data.issue.children;
            } else {
                  // console.log("No subtasks found.");
                  return [];
            }
      } catch (error) {
            console.error("Error fetching subtasks:", error);
      }
}

async function getIssueProperties(issueKey, key1, key2) {
      const issueId = issueKey.replace("issue-", "");

      try {
            const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?include=children?key=${API_KEY}`);
            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            const issueData = data.issue;
            return [issueData.hasOwnProperty(key1) ? issueData[key1] : null, issueData.hasOwnProperty(key2) ? issueData[key2] : null];
      } catch (error) {
            console.error("Error fetching issue:", error);
            return [];
      }
}

function fetchIssue(issueId) {
      return fetch(`${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`)
            .then(response => {
                  if (!response.ok) throw new Error(`Issue ${issueId} not found`);
                  return response.json();
            });
}

async function getIssueDataCached(issueKey) {
      // Simple in-memory cache + in-flight dedupe for issue data. We only store
      // the `issue` object from the Redmine response.
      const issueId = String(issueKey);

      // lazy caches
      if (typeof window._getIssueDataCache === 'undefined') window._getIssueDataCache = new Map();
      if (typeof window._getIssueDataPromises === 'undefined') window._getIssueDataPromises = new Map();

      const cache = window._getIssueDataCache;
      const pending = window._getIssueDataPromises;

      if (cache.has(issueId)) {
            console.debug('cache hit for', issueId);
            return cache.get(issueId);
      }

      if (pending.has(issueId)) {
            console.debug('Awaiting by cache', issueId);
            return pending.get(issueId);
      }

      const p = (async () => {
            try {
                  const url = `${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`;
                  const resp = await fetch(url);
                  if (!resp.ok) {
                        return null;
                  }

                  const data = await resp.json();
                  if (data && data.issue) {
                        cache.set(issueId, data.issue);
                        console.debug('get from SRVER issue', issueId);
                        return data.issue;
                  }
                  return null;
            } catch (err) {
                  return null;
            } finally {
                  pending.delete(issueId);
            }
      })();

      pending.set(issueId, p);
      return p;
}

////////////////////////Active epics (grouped by target)///////////////////////

// Fetch all active (open) Epics of a project, grouped by their target version.
// Reusable across userscripts via window. Results are cached on window and
// in-flight requests are deduped to minimise API calls. Each fetched epic is
// also seeded into the shared issue cache used by getIssueDataCached().
//
//   window.getActiveEpicsGrouped(projectId, { trackerId, noTargetLabel, force })
//     -> Promise<[{ target, epics: [{ id, subject }] }]>
async function getActiveEpicsGrouped(projectId, options) {
      const opts = options || {};
      const trackerId = opts.trackerId || 5; // "Epic" tracker id
      const noTargetLabel = opts.noTargetLabel || 'No target';
      const cacheKey = `${projectId}|${trackerId}`;

      // lazy caches on window (shared across scripts)
      if (typeof window._epicsGroupedCache === 'undefined') window._epicsGroupedCache = new Map();
      if (typeof window._epicsGroupedPromises === 'undefined') window._epicsGroupedPromises = new Map();

      const cache = window._epicsGroupedCache;
      const pending = window._epicsGroupedPromises;

      if (!opts.force && cache.has(cacheKey)) {
            return cache.get(cacheKey);
      }
      if (pending.has(cacheKey)) {
            return pending.get(cacheKey);
      }

      // Seed the shared issue cache so later getIssueDataCached() calls are free.
      if (typeof window._getIssueDataCache === 'undefined') window._getIssueDataCache = new Map();
      const issueCache = window._getIssueDataCache;

      const p = (async () => {
            try {
                  const epics = [];
                  const pageSize = 200;
                  let offset = 0;
                  let total = Infinity;

                  while (offset < total) {
                        const url = `${REDMINE_URL}/projects/${projectId}/issues.json` +
                              `?tracker_id=${trackerId}&status_id=open` +
                              `&limit=${pageSize}&offset=${offset}`;
                        const resp = await fetch(url, { headers: { 'X-Redmine-API-Key': API_KEY } });
                        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching epics`);
                        const data = await resp.json();
                        total = typeof data.total_count === 'number' ? data.total_count : (data.issues || []).length;
                        (data.issues || []).forEach(issue => {
                              // Seed shared cache to avoid re-fetching this issue later.
                              issueCache.set(String(issue.id), issue);
                              epics.push({
                                    id: issue.id,
                                    subject: issue.subject || '',
                                    target: (issue.fixed_version && issue.fixed_version.name) || noTargetLabel,
                              });
                        });
                        if (!data.issues || data.issues.length === 0) break;
                        offset += pageSize;
                  }

                  // Group by target, then sort groups + epics for a stable UI.
                  const byTarget = new Map();
                  epics.forEach(epic => {
                        if (!byTarget.has(epic.target)) byTarget.set(epic.target, []);
                        byTarget.get(epic.target).push({ id: epic.id, subject: epic.subject });
                  });

                  const groups = Array.from(byTarget.entries()).map(([target, list]) => ({
                        target,
                        epics: list.sort((a, b) => a.id - b.id),
                  }));
                  groups.sort((a, b) => {
                        if (a.target === noTargetLabel) return 1;
                        if (b.target === noTargetLabel) return -1;
                        return a.target.localeCompare(b.target);
                  });

                  cache.set(cacheKey, groups);
                  return groups;
            } catch (err) {
                  console.error('Error fetching active epics:', err);
                  return [];
            } finally {
                  pending.delete(cacheKey);
            }
      })();

      pending.set(cacheKey, p);
      return p;
}

// Expose shared Redmine API helpers for other userscripts.
window.REDMINE_URL = REDMINE_URL;
window.getActiveEpicsGrouped = getActiveEpicsGrouped;

function findTopParent(issueId) {
      return getIssueDataCached(issueId)
            .then(data => {
                  if (data.parent) {
                        // console.log(`Issue ${data.id} has parent ${data.parent.id}`);
                        return findTopParent(data.parent.id); // Recursive call
                  } else {
                        // console.log(`Top-most parent (Epic?):`, issue);
                        return data;
                  }
            })
            .catch(error => console.error("Error:", error));
}

async function updateIssueProperty(issueKey, jsonKey, value) {

      const issueId = issueKey.replace("issue-", "");
      // Prepare the data to send to the Redmine API
      const requestData = {
            issue: {
                  [jsonKey]: value // New due date to set
            }
      };

      try {
            const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`, {
                  method: 'PUT',
                  headers: {
                        'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestData) // Send data as JSON
            });

            if (response.ok) {
                  const data = await response.json();
                  console.log("Start date updated successfully:", data);
            } else {
                  console.error("Error updating start date:", response.statusText);
            }
      } catch (error) {
            console.error("Network or request error:", error);
      }
}

////////////////////////Highlite estimated/spend time///////////////////////
