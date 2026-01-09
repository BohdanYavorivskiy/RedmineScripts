// ==UserScript==
// @name         Redmine: Add button to set default values for Impl part
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Add 'Make Implementation', a button that sets all task fluids in the most suitable state for the Implementation part based on the parent task.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20fit%20task%20to%20impl%20part.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20fit%20task%20to%20impl%20part.user.js
// ==/UserScript==

(function () {
      'use strict';


      let API_KEY = GM_getValue('apiKey');
      if (!API_KEY) {
            API_KEY = prompt('Please enter your API key:');
            if (API_KEY) GM_setValue('apiKey', API_KEY);
      }

      const REDMINE_URL = 'http://redmine.cmbu-engineering.diasemi.com'; // Replace with your Redmine instance URL

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


      function addSetDefaultFilds() {
            // Select the table
            const newIssue = document.querySelector('.new_issue');

            if (!newIssue) return;
            /*
                        const button = document.createElement("button");
                        button.textContent = "Click Me";
                        button.classList.add("default-custom-button");
                        const style = document.createElement("style");
                        style.textContent = `
                            .default-custom-button {
                              background-color: #007bff;
                              color: white;
                              border: none;
                              cursor: pointer;
                            }
                            .default-custom-button:hover {
                              background-color: #0056b3;
                            }
                            `;

                           document.head.appendChild(style);
                           newIssue.append(button);
            */

            if (document.querySelector('.set_default_data_link')) return;

            const assignLink = document.createElement("a");
            assignLink.className = "set_default_data_link"; // Add the class
            assignLink.href = "#"; // Set the href attribute
            assignLink.textContent = "Make Implementation"; // Set the text content
            newIssue.append(assignLink);

            assignLink.addEventListener("click", () => {

                  const parent_issue = document.querySelector('#issue_parent_issue_id');
                  const parent_issue_value = parent_issue.value;

                  const tracker = document.querySelector('#issue_tracker_id');
                  tracker.value = "6";
                  tracker.dispatchEvent(new Event("change"));

                  const subject = document.querySelector('#issue_subject');
                  subject.value = parent_issue_value == "" ? "Implementation" : "Implementation #" + parent_issue_value;

                  const integration_status = document.querySelector('#issue_custom_field_values_15');
                  integration_status.value = "1";
                  integration_status.dispatchEvent(new Event("change"));

                  const estimated_hours = document.querySelector('#issue_estimated_hours');
                  estimated_hours.value = "";

                  const progress = document.querySelector('#issue_done_ratio');
                  progress.value = "0";

                  const notes_for_qa = document.querySelector('#issue_custom_field_values_19');
                  notes_for_qa.value = "See parent task";


                  if (parent_issue_value) {
                        getIssueData(parent_issue_value).then(issue_data => {
                              if (issue_data) {
                                    const ssigned_to = document.querySelector('#issue_assigned_to_id');
                                    ssigned_to.value = issue_data.issue.assigned_to.id;
                                    ssigned_to.dispatchEvent(new Event("change"));

                                    const target_version = document.querySelector('#issue_fixed_version_id');
                                    target_version.value = issue_data.issue.fixed_version.id;
                                    target_version.dispatchEvent(new Event("change"));

                                    const start_date = document.querySelector('#issue_start_date');
                                    start_date.value = issue_data.issue.start_date;

                                    const due_date = document.querySelector('#issue_due_date');
                                    due_date.value = issue_data.issue.due_date;
                              }
                        });
                  }
            });
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
            addSetDefaultFilds();
      } else {
            document.addEventListener('DOMContentLoaded', addSetDefaultFilds);
      }
})();