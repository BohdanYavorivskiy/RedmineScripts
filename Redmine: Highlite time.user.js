// ==UserScript==
// @name         Redmine: Highlite estimated/spend time
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Highlight if the estimated time is 0. Highlight if there is a difference between the estimate and the spent times.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Highlite%20time.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Highlite%20time.user.js
// ==/UserScript==

(function () {
    'use strict';

    const releaseTextMark = 'r';
    const currentReleaseVersion = '6.51.001';

    const redFullColour = '#ff0000';
    const redColour = '#ff6666b5';
    const yellowColour = '#ffea8c';
    const blueColour = '#70b1ff82';
    const greenColour = '#aee678c4';


    let API_KEY = GM_getValue('apiKey');
    if (!API_KEY) {
        API_KEY = prompt('Please enter your API key:');
        if (API_KEY) GM_setValue('apiKey', API_KEY);
    }
    const REDMINE_URL = 'http://redmine.cmbu-engineering.diasemi.com';

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

    function addEpicInfo() {
        const tableRow = document.querySelector('.gantt-table tbody tr');
        if (!tableRow) return;

        const issueRows = tableRow.querySelectorAll('td#total_estimated_hours.gantt_total_estimated_hours_column div.gantt_total_estimated_hours.gantt_selected_column_content .issue_total_estimated_hours');
        issueRows.forEach(processIssueRow);
    }

    /**
     * Extract numeric task id from a row element or an id string.
     * Examples:
     *  - "total_estimated_hours_issue_53934" -> 53934
     *  - "issue_53934" -> 53934
     * Returns a Number or null when not found.
     */
    function getTaskNumberFromRowId(rowOrId) {
        const id = typeof rowOrId === 'string'
            ? rowOrId
            : (rowOrId && rowOrId.id) ? rowOrId.id : '';

        if (!id) return null;

        // Match the final digits after an optional 'issue_' prefix.
        // This covers ids like 'total_estimated_hours_issue_53934' and 'issue_53934'.
        const m = id.match(/(?:issue_)?(\d+)$/);
        return m ? Number(m[1]) : null;
    }

    function processIssueRow(row) {
        const taskId = getTaskNumberFromRowId(row.id);
        fetchIssue(taskId)
            .then(data => {
                const issue = data.issue;
                if (issue.status.name != 'Open') {
                    const estimated = parseFloat(issue.total_estimated_hours);
                    const spend = parseFloat(issue.total_spent_hours);

                    //if (estimated / spend >= 2) row.style.backgroundColor = yellowColour;
                    if (estimated / spend < 0.5) row.style.backgroundColor = redColour;

                    if (estimated === 0) row.style.color = redFullColour;
                }
            })
            .catch(error => console.error("Error:", error));
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        addEpicInfo();
    } else {
        document.addEventListener('DOMContentLoaded', addEpicInfo);
    }
})();