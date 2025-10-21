// ==UserScript==
// @name         Redmine: Add release tag
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
      'use strict';

      const releaseTextMark = 'R ';
      const currentReleaseVersion = '6.51.001';

      const redFullColour = '#ff0000';

      const redColour = '#ff6666b5';
      const yellowColour = '#ffea8c';
      const blueColour = '#70b1ff82';
      const greenColour = '#aee678c4';

      const API_KEY = '61bcfef8f5058afad6883e2e6b91bd5469d629dc'; // Replace with your Redmine API Key
      const REDMINE_URL = 'http://redmine.cmbu-engineering.diasemi.com'; // Replace with your Redmine instance URL

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
            return fetchIssue(issueId)
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


      function versionToNumber(versions) {
            return parseInt(versions.replace(/\./g, ''), 10);
            //return versions.map(version => parseInt(version.replace(/\./g, ''), 10));
      }

function addEpicInfo() {
    const tableRow = document.querySelector('.gantt-table tbody tr');
    if (!tableRow) return;

    const columnName = 'epic_column';
    if (document.querySelector(`.${columnName}`)) return;

    const issueRows = tableRow.querySelectorAll('.gantt_subjects div.issue-subject');
    issueRows.forEach(processIssueRow);
}

function processIssueRow(row) {
    const issueId = extractIssueId(row.id);
    if (!issueId || row.textContent.startsWith(releaseTextMark)) return;

    findTopParent(issueId).then(epicData => {
        if (!epicData?.id) return;

        const span = createEpicSpan(epicData);
        row.insertBefore(span, row.firstChild);
    });
}

function extractIssueId(rawId) {
    return rawId ? rawId.replace('issue-', '') : null;
}

function createEpicSpan(epicData) {
    const span = document.createElement('span');
    let fullText = releaseTextMark;

    if (epicData.tracker.id === 5) {
        const releaseText = epicData.subject.match(/\b\d+\.\d+\.\d+\b/g);
        const isHotfix = epicData.subject.includes('Hotfixes');

        if (isHotfix) applyHotfixStyles(span);

        if (releaseText) {
            fullText += releaseText;
            applyReleaseColor(span, releaseText[0]);
        } else {
            fullText += 'NO TAG';
            span.style.backgroundColor = redFullColour;
        }
    } else {
        fullText += 'NO EPIC';
        span.style.backgroundColor = redFullColour;
    }

    span.textContent = fullText;
    return span;
}

function applyHotfixStyles(span) {
    span.style.color = redFullColour;
    span.style.display = 'inline-block';
    span.style.fontWeight = 'bold';
    span.style.animation = 'flicker 0.5s infinite';
    injectFlickerAnimation();
}

function injectFlickerAnimation() {
    if (document.getElementById('flicker-style')) return;

    const style = document.createElement('style');
    style.id = 'flicker-style';
    style.textContent = `
        @keyframes flicker {
            0%   { transform: scale(1) rotate(-1deg); opacity: 0.9; }
            25%  { transform: scale(1.05) rotate(1deg); opacity: 1; }
            50%  { transform: scale(0.95) rotate(-1deg); opacity: 0.85; }
            75%  { transform: scale(1.05) rotate(2deg); opacity: 0.95; }
            100% { transform: scale(1) rotate(-1deg); opacity: 0.9; }
        }
    `;
    document.head.appendChild(style);
}

function applyReleaseColor(span, releaseVersion) {
    const releaseId = versionToNumber(releaseVersion);
    const currentReleaseId = versionToNumber(currentReleaseVersion);

    if (releaseId === currentReleaseId) {
        span.style.backgroundColor = greenColour;
    } else if (releaseId > currentReleaseId) {
        span.style.backgroundColor = blueColour;
    } else {
        span.style.backgroundColor = redColour;
    }
}
      /*
            function waitForTable() {
                  const checkInterval = setInterval(() => {
                        const issueTable = document.querySelector('#content table.issues');
                        if (issueTable) {
                              clearInterval(checkInterval);
                              addEpicInfo();
                        }
                  }, 500);
            }*/

      // Run after page load
      /*    window.addEventListener('load', addEpicInfo);

          const observerStartDate = new MutationObserver(addEpicInfo);
          observerStartDate.observe(document.body, { childList: true, subtree: true });*/

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
            addEpicInfo();
      } else {
            document.addEventListener('DOMContentLoaded', addEpicInfo);
      }
})();
