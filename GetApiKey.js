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
