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

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20testing.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20testing.user.js
// ==/UserScript==
(function () {
    'use strict';
 
    // Format Date object as YYYY-MM-DD using local time
    function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
 
    function getTestingStartDate(implementationEndDate) {
        const date = new Date(implementationEndDate + 'T00:00:00');
        const isFriday = date.getDay() === 5; // 5 = Friday
 
        date.setDate(date.getDate() + (isFriday ? 3 : 1));
        return date;
    }
 
    function getTestingEndDate(startDate) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        return endDate;
    }
 
 
    function getCustomFieldValue(issue, fieldId) {
        if (!issue.custom_fields) return null;
 
        const field = issue.custom_fields.find(cf => cf.id === fieldId);
        return field ? field.value : null;
    }
 
 
    function addSetDefaultFilds() {
        const newIssue = document.querySelector('.new_issue');
 
        if (!newIssue || document.querySelector('.set_default_data_link_r')) {
            return;
        }
 
        // Create "Make Testing" button
        const assignLink = document.createElement('a');
        assignLink.className = 'set_default_data_link_r';
        assignLink.href = '#';
        assignLink.textContent = 'Make Testing';
 
        newIssue.append(assignLink);
 
        // Handle button click
        assignLink.addEventListener('click', () => {
 
            // Read Parent Issue ID
            const parentIssueField = document.querySelector('#issue_parent_issue_id');
            const parentIssueId = parentIssueField.value;
 
            // Switch tracker to Testing
            const tracker = document.querySelector('#issue_tracker_id');
            tracker.value = '6';
            tracker.dispatchEvent(new Event('change'));
 
            // Set subject
            const subject = document.querySelector('#issue_subject');
            subject.value = parentIssueId ? `Testing #${parentIssueId}` : 'Testing';
 
            // Set Integration Status
            const integrationStatus = document.querySelector('#issue_custom_field_values_15');
            integrationStatus.value = '1';
            integrationStatus.dispatchEvent(new Event('change'));
 
            // Reset numeric / progress fields
            document.querySelector('#issue_estimated_hours').value = '';
            document.querySelector('#issue_done_ratio').value = '0';
            document.querySelector('#issue_custom_field_values_19').value = '';
 
            // Fetch parent issue data if parent is set
            if (!parentIssueId) return;
 
            getIssueData(parentIssueId).then(issueData => {
                if (!issueData || !issueData.issue) return;
 
                const parentIssue = issueData.issue;
 
                // --- Assigned QA → Testing Assignee ---
                const ASSIGNED_QA_FIELD_ID = 4;
 
                // Read Assigned QA value from parent issue
                const assignedQaUserId = getCustomFieldValue(parentIssue, ASSIGNED_QA_FIELD_ID);
 
                // If Assigned QA is set, assign it to Testing task
                if (assignedQaUserId) {
                    const assigneeField = document.querySelector('#issue_assigned_to_id');
                    assigneeField.value = assignedQaUserId;
                    assigneeField.dispatchEvent(new Event('change'));
                }
 
 
                // Copy target version
                const targetVersion = document.querySelector('#issue_fixed_version_id');
                targetVersion.value = parentIssue.fixed_version.id;
                targetVersion.dispatchEvent(new Event('change'));
 
                // Calculate Testing dates
                const testingStartDate = getTestingStartDate(parentIssue.due_date);
                const testingEndDate = getTestingEndDate(testingStartDate);
 
                // Set dates in the form
                document.querySelector('#issue_start_date').value =
                    formatLocalDate(testingStartDate);
 
                document.querySelector('#issue_due_date').value =
                    formatLocalDate(testingEndDate);
            });
        });
    }
 
 
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        addSetDefaultFilds();
    } else {
        document.addEventListener('DOMContentLoaded', addSetDefaultFilds);
    }
 
})();