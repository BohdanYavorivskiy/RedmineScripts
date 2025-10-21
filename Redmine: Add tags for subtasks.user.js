// ==UserScript==
// @name         Redmine: Add tags for subtasks
// @namespace    http://tampermonkey.net/
// @version      2025-02-11
// @description  try to take over the world!
// @author       You
// @match        *://example.com/*  // Adjust for your target site
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

// @require      http://localhost:5500/myscript.user.js

(function () {
    'use strict';

    const API_KEY = '61bcfef8f5058afad6883e2e6b91bd5469d629dc'; // Replace with your Redmine API Key
    const REDMINE_URL = 'http://redmine.cmbu-engineering.diasemi.com'; // Replace with your Redmine instance URL


    async function getIssueTags(issueKey) {
        // Extract numeric issue ID
        const issueId = issueKey.replace("issue-", "");

        try {
            const url = `${REDMINE_URL}/issues/${issueId}.json?include=journals,attachments?ey=${API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            const tag_list_data = data.issue.journals.flatMap(journal => journal.details.filter(detail => detail.name === "tag_list"));
            if (!tag_list_data) return null;

            const tag_data = tag_list_data.at(-1).new_value;
            return tag_data;
        } catch (error) {
            console.error("Error fetching issue:", error);
            return null; // Return null or an appropriate value in case of error
        }
    }


    function addTagsColumn() {
        // Select the table
        const table = document.querySelector('#issue_tree');
        if (!table) return;

        const issueRows = table.querySelectorAll('tr.issue');

        issueRows.forEach(row => {
            if (row.querySelector('.subject')) {
                const buttonsCell = row.querySelector('.buttons');
                const newCell = document.createElement('td');
                newCell.className = 'customtag_column'; // Add a class name for styling

                const tr = row.closest('tr');

                // Get the class that starts with 'issue-' and return it
                const issueClass = Array.from(tr.classList).find(cls => cls.startsWith('issue-'));
                const issueId = issueClass; // Try to get issue ID if available
                if (issueClass) {
                    getIssueTags(issueId).then(tags => {

                        if (!row.querySelector('.customtag_column')) {
                            if (tags) {
                                newCell.textContent = tags; // Modify the content as needed
                            }
                            // Insert the new cell before the buttons cell
                            row.insertBefore(newCell, buttonsCell);

                        }
                    });
                }
            }
        });
    }
/*

    function waitForTable() {
        const checkInterval = setInterval(() => {
            const issueTable = document.querySelector('#content table.issues');

            if (issueTable) {
                clearInterval(checkInterval);
                addTagsColumn()
            }
        }

            , 500);
    }*/

    // Run after page load
    window.addEventListener('load', addTagsColumn);

    const observerDueDate = new MutationObserver(addTagsColumn);

    observerDueDate.observe(document.body, {
        childList: true, subtree: true
    });
})();