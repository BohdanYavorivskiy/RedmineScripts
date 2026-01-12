// ==UserScript==
// @name         Redmine Gantt: Add start and due dates
// @namespace    http://tampermonkey.net/
// @version      1.0.3
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

      // async function getSubtasks(issueKey) {
      //       const taskId = issueKey.replace("issue-", "");
      //       const url = `${REDMINE_URL}/issues/${taskId}.json?include=children`;

      //       try {
      //             const response = await fetch(url, {
      //                   headers: {
      //                         "X-Redmine-API-Key": API_KEY
      //                   }
      //             });

      //             if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      //             const data = await response.json();
      //             if (data.issue.children) {
      //                   // console.log("Subtasks:", data.issue.children);
      //                   return data.issue.children;
      //             } else {
      //                   // console.log("No subtasks found.");
      //                   return [];
      //             }
      //       } catch (error) {
      //             console.error("Error fetching subtasks:", error);
      //       }
      // }

      // async function getIssueProperty(issueKey, key) {
      //       const issueId = issueKey.replace("issue-", "");

      //       try {
      //             const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?include=children?key=${API_KEY}`);
      //             if (!response.ok) throw new Error("Network response was not ok");

      //             const data = await response.json();
      //             const issueData = data.issue;
      //             return issueData.hasOwnProperty(key) ? issueData[key] : null;
      //       } catch (error) {
      //             console.error("Error fetching issue:", error);
      //             return null;
      //       }
      // }

      // async function updateIssueProperty(issueKey, jsonKey, value) {

      //       const issueId = issueKey.replace("issue-", "");
      //       // Prepare the data to send to the Redmine API
      //       const requestData = {
      //             issue: {
      //                   [jsonKey]: value // New due date to set
      //             }
      //       };

      //       try {
      //             const response = await fetch(`${REDMINE_URL}/issues/${issueId}.json?key=${API_KEY}`, {
      //                   method: 'PUT',
      //                   headers: {
      //                         'Content-Type': 'application/json'
      //                   },
      //                   body: JSON.stringify(requestData) // Send data as JSON
      //             });

      //             if (response.ok) {
      //                   const data = await response.json();
      //                   console.log("Start date updated successfully:", data);
      //             } else {
      //                   console.error("Error updating start date:", response.statusText);
      //             }
      //       } catch (error) {
      //             console.error("Network or request error:", error);
      //       }
      // }

      const redColour = '#ff6666b5';
      const yellowColour = '#ffea8c';
      const blueColour = '#70b1ff82';
      const greenColour = '#aee678c4';

      function createColumn(hearedStr, columnName) {
            const column = document.createElement('td');
            column.style.width = '10px';
            column.className = columnName;
            column.style.verticalAlign = 'top';

            const header = document.createElement('div');
            header.style.verticalAlign = 'middle';
            header.style.position = 'relative';
            header.style.height = '72px';
            header.style.background = '#eee';
            header.innerHTML = 'Start Day';

            const ganttHeader = document.querySelector('div.gantt_hdr');
            if (ganttHeader)
                  header.style.height = ganttHeader.style.height;

            column.appendChild(header);

            const hederSpace = document.createElement('div');
            hederSpace.style.position = 'relative';
            hederSpace.style.height = '3px';
            hederSpace.style.background = '#FFF';

            column.appendChild(hederSpace);

            return column;
      }

      function creadeDateInputFild() {
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.classList.add('custom-date-picker');
            dateInput.style.border = 'none';
            dateInput.style.outline = 'none';
            dateInput.style.width = '87px';
            return dateInput;
      }

      function creadeEmptyCell() {
            const newDiv1 = document.createElement('div');
            newDiv1.style.position = 'relative';
            newDiv1.style.height = '20px';
            newDiv1.style.background = '#fff';
            return newDiv1;
      }

      function addStartDateColumn() {
            const table = document.querySelector('.gantt-table tbody tr');
            if (!table) return;

            const columnName = 'startdate_column';
            if (document.querySelector('.' + columnName)) return;
            const column = createColumn('Start Day', columnName);

            const issueRows = table.querySelectorAll('.gantt_subjects div');
            issueRows.forEach(row => {
                  if (row.classList.contains('issue-subject')) {
                        const dateInputCell = document.createElement('td');
                        dateInputCell.classList.add('custom-column-cell');

                        const dateInputFild = creadeDateInputFild();
                        dateInputCell.appendChild(dateInputFild);

                        const issueId = row.id;
                        if (issueId) {
                              getIssueProperty(issueId, 'start_date').then(startDate => {
                                    dateInputFild.value = startDate;
                                    if (!startDate) {
                                          dateInputFild.style.backgroundColor = blueColour;
                                          dateInputCell.style.backgroundColor = blueColour;
                                    } else {
                                          getIssueProperty(issueId, 'status').then(status => {
                                                const startDateObj = new Date(startDate);
                                                startDateObj.setHours(0, 0, 0, 0);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                if (status.name == "Open") {
                                                      if (startDateObj < today) {
                                                            dateInputFild.style.backgroundColor = redColour;
                                                            dateInputCell.style.backgroundColor = redColour;
                                                      } else if (startDateObj > today) {
                                                            dateInputFild.style.backgroundColor = greenColour;
                                                            dateInputCell.style.backgroundColor = greenColour;
                                                      } else {
                                                            dateInputFild.style.backgroundColor = yellowColour;
                                                            dateInputCell.style.backgroundColor = yellowColour;
                                                      }
                                                }
                                          });
                                    }
                              });

                              dateInputFild.addEventListener('change', () => {
                                    const selectedDate = dateInputFild.value;
                                    updateIssueProperty(issueId, 'start_date', selectedDate);
                              });

                              getSubtasks(issueId).then(subtasks => {
                                    if (subtasks && subtasks.length > 0) {
                                          dateInputFild.disabled = true;
                                    }
                              });
                        }

                        const emptyCell = creadeEmptyCell();
                        emptyCell.appendChild(dateInputCell);
                        column.appendChild(emptyCell);
                  } else {

                        column.appendChild(creadeEmptyCell());
                  }
            });

            const ga = document.querySelector('#gantt_area');
            const gap = ga.parentElement;
            table.insertBefore(column, gap);
      }

      function addDueDateColumn() {
            const table = document.querySelector('.gantt-table tbody tr');
            if (!table) return;

            const columnName = 'duedate_column';
            if (document.querySelector('.' + columnName)) return;
            const column = createColumn('Due Day', columnName);

            const issueRows = table.querySelectorAll('.gantt_subjects div');
            issueRows.forEach(row => {
                  if (row.classList.contains('issue-subject')) {
                        const dateInputCell = document.createElement('td');
                        dateInputCell.classList.add('custom-column-cell');

                        const dateInputFild = creadeDateInputFild();
                        dateInputCell.appendChild(dateInputFild);

                        const issueId = row.id;
                        if (issueId) {
                              getIssueProperty(issueId, 'due_date').then(dueDate => {
                                    dateInputFild.value = dueDate;
                                    if (!dueDate) {
                                          dateInputFild.style.backgroundColor = blueColour;
                                          dateInputCell.style.backgroundColor = blueColour;
                                    } else {
                                          const dueDateObj = new Date(dueDate);
                                          dueDateObj.setHours(0, 0, 0, 0);
                                          const today = new Date();
                                          today.setHours(0, 0, 0, 0);

                                          if (dueDateObj < today) {
                                                dateInputFild.style.backgroundColor = redColour;
                                                dateInputCell.style.backgroundColor = redColour;
                                          } else if (dueDateObj > today) {
                                                dateInputFild.style.backgroundColor = greenColour;
                                                dateInputCell.style.backgroundColor = greenColour;
                                          } else {
                                                dateInputFild.style.backgroundColor = yellowColour;
                                                dateInputCell.style.backgroundColor = yellowColour;
                                          }
                                    }
                              });

                              dateInputFild.addEventListener('change', () => {
                                    const selectedDate = dateInputFild.value;
                                    updateIssueProperty(issueId, 'due_date', selectedDate);
                              });


                              getSubtasks(issueId).then(subtasks => {
                                    if (subtasks && subtasks.length > 0) {
                                          dateInputFild.disabled = true;
                                    }
                              });
                        }

                        const emptyCell = creadeEmptyCell();
                        emptyCell.appendChild(dateInputCell);
                        column.appendChild(emptyCell);
                  } else {
                        column.appendChild(creadeEmptyCell());
                  }
            });

            const ga = document.querySelector('#gantt_area');
            const gap = ga.parentElement;
            table.insertBefore(column, gap);
      }
/*
      function waitForTable() {
            const checkInterval = setInterval(() => {
                  const issueTable = document.querySelector('#content table.issues');
                  if (issueTable) {
                        clearInterval(checkInterval);
                        addDueDateColumn();
                        addStartDateColumn()
                  }
            }, 500);
      }*/
/*
      // Run after page load
      window.addEventListener('load', addStartDateColumn);
      window.addEventListener('load', addDueDateColumn);

      const observerStartDate = new MutationObserver(addStartDateColumn);
      observerStartDate.observe(document.body, { childList: true, subtree: true });

      const observerDueDate = new MutationObserver(addDueDateColumn);
      observerDueDate.observe(document.body, { childList: true, subtree: true });*/

      function init() {
    const table = document.querySelector('.gantt-table tbody tr');
    if (!table) return;

    addStartDateColumn();
    addDueDateColumn();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }


})();