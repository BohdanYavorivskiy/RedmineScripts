// ==UserScript==
// @name         Redmine Gantt: Add start and due dates
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Add start and due dates to the Gant table
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20Add%20start%20and%20due%20dates%20to%20gant.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20Add%20start%20and%20due%20dates%20to%20gant.user.js
// ==/UserScript==

// @require      http://localhost:5500/StartAndDuedateInGunt.user.js

(function () {
      'use strict';

      const redColour = '#ff6666b5';
      const yellowColour = '#ffea8c';
      const blueColour = '#70b1ff82';
      const greenColour = '#aee678c4';

      // inject CSS to style the custom date picker and hide the year where supported
      (function addCustomDatePickerStyles() {
            try {
                  const s = document.createElement('style');
                  s.type = 'text/css';
                  s.textContent = `
                        input.custom-date-picker {
                              display: inline-block;
                              border: none;
                              background: transparent;
                              font-size: 1.0em;
                              padding: 0 2px 0 0; /* small right padding for calendar icon space */
                              margin: 0;
                              /* narrow the visible area so year is clipped */
                              width: 50px; /* fits DD/MM or Mon D */
                              height: 18px;
                              line-height: 14px; /* keep text vertically towards top */
                              vertical-align: top; /* align the element's box to the top of the line */
                              overflow: hidden;
                              white-space: nowrap;
                              text-overflow: clip;
                              -webkit-appearance: none;
                              -moz-appearance: textfield;
                        }
                        /* hide year field in WebKit-based browsers */
                        input.custom-date-picker::-webkit-datetime-edit-year-field { display: none; }
                        /* keep month and day visible for WebKit */
                        input.custom-date-picker::-webkit-datetime-edit-month-field, input.custom-date-picker::-webkit-datetime-edit-day-field { display: inline; }
                        /* small spacing for the calendar icon */
                        input.custom-date-picker::-webkit-calendar-picker-indicator { padding-left: 0px; }
                  `;
                  document.head.appendChild(s);
            } catch (e) {
                  // ignore
            }
      })();

      // parse display dates like "Jan 21, 2025" into yyyy-mm-dd for <input type="date">
      function parseDisplayDateToYMD(display) {
            if (!display) return '';
            const d = new Date(display);
            if (isNaN(d)) return '';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
      }

      // format yyyy-mm-dd (or Date) back to display like "Jan 21, 2025"
      function formatYMDToDisplay(ymd) {
            if (!ymd) return '';
            const d = new Date(ymd);
            if (isNaN(d)) return '';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      // addStartDateColumn can accept an optional parameter to specify which elements to initialize.
      // Parameter can be a selector string, a NodeList/Array of elements, or a single Element.
      function addStartDateColumn(dateElemName, fieldNameToCommit) {
            const elems = document.querySelectorAll(dateElemName);
            elems.forEach(div => {
                  // don't initialize twice
                  if (div.dataset.editableAttached) return;
                  div.dataset.editableAttached = '1';

                  const text = div.textContent.trim();
                  const ymd = parseDisplayDateToYMD(text);

                  // create hidden date input (keep original text unchanged)
                  const dateInput = document.createElement('input');
                  dateInput.type = 'date';
                  dateInput.classList.add('custom-date-picker');
                  dateInput.value = ymd;
                  // always visible picker
                  dateInput.style.display = 'inline-block';
                  dateInput.style.border = 'none';
                  dateInput.style.background = 'transparent';
                  dateInput.style.fontSize = '0.8em';
                  dateInput.style.padding = '0';
                  dateInput.style.margin = '0';

                  // remove the original text and append the date picker
                  div.textContent = '';
                  div.appendChild(dateInput);

                  // derive issue id (strip common prefixes to get numeric id)
                  const dataCollapse = div.getAttribute('data-collapse-expand');
                  const idAttr = div.id;
                  let issueId = null;
                  if (dataCollapse && dataCollapse.startsWith('issue-')) issueId = dataCollapse.replace(/^issue-/, '');
                  else if (idAttr && idAttr.startsWith('start_date_issue_')) issueId = idAttr.replace(/^start_date_issue_/, '');
                  else if (dataCollapse) issueId = dataCollapse;
                  else if (idAttr) issueId = idAttr;

                  let statusText = null;
                  if (issueId) {
                        let statusEl = document.getElementById(`status_issue_${issueId}`);
                        statusText = statusEl.textContent.trim();

                        // statusEl = document.querySelector(`.issue_status[data-collapse-expand="issue-${issueId}"]`);
                        // statusText = statusEl.textContent.trim();

                        // statusEl = document.querySelector(`#issue-${issueId} .issue_status`);
                        // statusText = statusEl.textContent.trim();
                  }

                  if (dateElemName.toLowerCase().includes('start')) {
                        if (statusText && statusText.toLowerCase().startsWith('open')) {
                              const startDateObj = new Date(text);
                              startDateObj.setHours(0, 0, 0, 0);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);

                              if (isNaN(startDateObj)) {
                                    dateInput.style.backgroundColor = blueColour;
                              } else if (startDateObj < today) {
                                    dateInput.style.backgroundColor = redColour;
                              } else if (startDateObj > today) {
                                    dateInput.style.backgroundColor = greenColour;
                              } else {
                                    dateInput.style.backgroundColor = yellowColour;
                              }
                        }
                  }

                  if (dateElemName.toLowerCase().includes('due')) {
                        const dueDateObj = new Date(text);
                        dueDateObj.setHours(0, 0, 0, 0);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        if (isNaN(dueDateObj)) {
                              dateInput.style.backgroundColor = blueColour;
                        } else {
                              if (dueDateObj < today) {
                                    dateInput.style.backgroundColor = redColour;
                              } else if (dueDateObj > today) {
                                    dateInput.style.backgroundColor = greenColour;
                              } else {
                                    dateInput.style.backgroundColor = yellowColour;
                              }
                        }
                  }

                  // when value changes, call API and update title
                  dateInput.addEventListener('change', () => {
                        const selected = dateInput.value; // yyyy-mm-dd
                        if (issueId) updateIssueProperty(issueId, fieldNameToCommit, selected);
                        // update title so hover shows formatted date
                        dateInput.parentElement.title = selected ? formatYMDToDisplay(selected) : '';
                  });
            });
      }

      function init() {
            const table = document.querySelector('.gantt-table tbody tr');
            if (!table) return;
            addStartDateColumn('.issue_start_date', 'start_date');
            addStartDateColumn('.issue_due_date', 'due_date');
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
      } else {
            document.addEventListener('DOMContentLoaded', init);
      }
})();