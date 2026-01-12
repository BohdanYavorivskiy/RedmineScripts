// ==UserScript==
// @name         Redmine: Add button to set default values for Impl part
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Add 'Make Implementation', a button that sets all task fluids in the most suitable state for the Implementation part based on the parent task.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20fit%20task%20to%20impl%20part.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20fit%20task%20to%20impl%20part.user.js
// ==/UserScript==

(function () {
      'use strict';

      // async function getIssueData(issueKey) {
      //       // Extract numeric issue ID
      //       const issueId = issueKey;

      //       try {
      //             // Fetch issue details
      //             const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`);

      //             if (!response.ok) {
      //                   throw new Error("Network response was not ok");
      //             }

      //             const data = await response.json();
      //             return data;
      //       } catch (error) {
      //             console.error("Error fetching issue:", error);
      //             return null; // Return null or an appropriate value in case of error
      //       }
      // }


      function addSetDefaultFilds() {
            // Select the table
            const newIssue = document.querySelector('.new_issue');

            if (!newIssue) return;
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