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

function findTopParent(issueId) {
      return getIssueData(issueId)
            .then(data => {
                  const issue = data.issue;
                  if (issue.parent) {
                        console.log(`Issue ${issue.id} has parent ${issue.parent.id}`);
                        return findTopParent(issue.parent.id); // Recursive call
                  } else {
                        console.log(`Top-most parent (Epic?):`, issue);
                        return issue;
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
