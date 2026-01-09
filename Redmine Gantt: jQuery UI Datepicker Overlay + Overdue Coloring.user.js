// ==UserScript==
// @name         Redmine Gantt: UI Datepicker Overlay + Overdue Coloring
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Hides sidebar; for each .issue_start_date / .issue_due_date, opens jQuery UI datepicker as an overlay. Allows month switching with no "Missing instance data". Colors overdue due dates in red.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20jQuery%20UI%20Datepicker%20Overlay%20%2B%20Overdue%20Coloring.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20jQuery%20UI%20Datepicker%20Overlay%20%2B%20Overdue%20Coloring.user.js
// ==/UserScript==

(function() {
  'use strict';

  let API_KEY = GM_getValue('apiKey');
  if (!API_KEY) {
    API_KEY = prompt('Please enter your API key:');
    if (API_KEY) GM_setValue('apiKey', API_KEY);
  }

  function injectDatepickerOverlayCSS() {
    const style = document.createElement('style');
    style.type = 'text/css';
    // make .ui-datepicker a very high z-index so it appears above the Gantt
    style.textContent = `
      .ui-datepicker {
        z-index: 999999 !important;
      }
    `;
    document.head.appendChild(style);
  }

function hideSidebar() {
    const sb = document.getElementById('sidebar');
    if (sb) {
        // Move sidebar to the bottom of the page
        sb.style.position = 'relative';
        sb.style.width = '100%';
        sb.style.display = 'flex';
        sb.style.flexWrap = 'wrap'; // Allows sections to wrap if needed
        sb.style.justifyContent = 'space-evenly'; // Distributes sections evenly
        sb.style.alignItems = 'flex-start';
        sb.style.marginTop = '20px';
        sb.style.padding = '15px 10px';
        sb.style.background = '#f8f8f8';
        sb.style.borderTop = '2px solid #ccc';

        // Move sidebar below the main content
        const main = document.getElementById('main') || document.querySelector('#content');
        if (main) {
            main.style.marginBottom = '20px'; // Ensure spacing
            main.parentNode.appendChild(sb);
        }

        // Convert sidebar sections into a properly structured layout
        let sections = sb.querySelectorAll('.box');
        sections.forEach(section => {
            // Ensure each section is structured vertically
            section.style.display = 'flex';
            section.style.flexDirection = 'column'; // Keep header above content
            section.style.alignItems = 'center';
            section.style.justifyContent = 'flex-start';
            section.style.margin = '10px';
            section.style.padding = '15px';
            section.style.minWidth = '250px'; // Ensures sections stay readable
            section.style.flexGrow = '1'; // Allows sections to expand equally
            section.style.borderRadius = '8px';
            section.style.background = '#ffffff'; // White background for contrast
            section.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';

            // Ensure h3 titles are properly styled and remain above content
            let title = section.querySelector('h3');
            if (title) {
                title.style.marginBottom = '10px';
                title.style.textAlign = 'center';
                title.style.fontWeight = 'bold';
                title.style.color = '#333';
                title.style.width = '100%'; // Ensures titles are aligned properly
                title.style.borderBottom = '1px solid #ddd'; // Adds separation from content
                title.style.paddingBottom = '5px';
            }

            // Ensure content below the h3 is aligned properly
            let content = section.querySelector('div'); // Assuming the content is in a div inside .box
            if (content) {
                content.style.textAlign = 'left';
                content.style.width = '100%';
            }
        });

        console.log('[Enhancement] Sidebar successfully moved to bottom with structured vertical layout.');
    }
}

  // function hideSidebar() {
  //   const sb = document.getElementById('sidebar');
  //   if (sb) {
  //     sb.style.display = 'none';
  //     const main = document.getElementById('main') || document.querySelector('#content');
  //     if (main) main.style.marginRight = '0';
  //     console.log('[IssueDateEdit] Sidebar hidden.');
  //   }
  // }

  async function updateIssueDates(issueId, newStart, newDue) {
    const url = `${location.origin}/issues/${issueId}.json`;
    const payload = { issue: {} };
    if (newStart) payload.issue.start_date = newStart;
    if (newDue)   payload.issue.due_date   = newDue;

    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Redmine-API-Key': REDMINE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      throw new Error(`Update #${issueId} failed: ${resp.status} / ${resp.statusText}`);
    }
    console.log(`[IssueDateEdit] #${issueId} => start:${newStart || ''}, due:${newDue || ''}`);
  }


  function parseDateStr(str) {
    // e.g. "Nov 25, 2024"
    return new Date(str);
  }

  function formatDateForRedmine(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }


  function makeDateClickable(divEl) {
    const oldText = divEl.textContent.trim();
    const link = document.createElement('a');
    link.href = 'javascript:void(0)';
    link.style.textDecoration = 'underline';
    link.style.cursor = 'pointer';
    link.textContent = oldText;

    // If it's a "due date," check if it's overdue => color in red
    if (divEl.classList.contains('issue_due_date')) {
      maybeColorOverdue(link, oldText);
    }

    link.addEventListener('click', () => {
      showDateInput(divEl, oldText);
    });

    divEl.textContent = '';
    divEl.appendChild(link);
  }

  function maybeColorOverdue(link, dateStr) {
    const dateObj = parseDateStr(dateStr);
    if (isNaN(dateObj.getTime())) return;

    // Compare to "today" (0:00 local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj < today) {
      link.style.color = '#cc0000';
    }
  }

  function showDateInput(divEl, oldVal) {
    const inputId = `datepicker_input_${Math.floor(Math.random() * 1e9)}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.value = oldVal;

    // style so it's not cut off
    input.style.width = '9em';
    input.style.fontSize = '12px';
    input.style.padding = '2px';

    // replace the div's content with new input
    divEl.textContent = '';
    divEl.appendChild(input);
    input.focus();

    // Keep a blur fallback if user never picks a date
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement === input) return;
        revertDiv(divEl, oldVal);
      }, 150);
    });

    // Initialize datepicker after the delay
    setTimeout(() => attachDatepicker(`#${inputId}`, divEl, oldVal), 0);
  }

  // The price for convenience, we need to use the calendar from jquery
  function attachDatepicker(selector, divEl, oldVal) {
    if (!window.jQuery || !jQuery.fn || typeof jQuery.fn.datepicker !== 'function') {
      console.log('[IssueDateEdit] jQuery UI datepicker not found; fallback to text input only');
      return;
    }

    const $input = jQuery(selector);

    $input.datepicker({
      dateFormat: 'M d, yy',
      appendTo: 'body',
      onClose: function() {
        const newVal = this.value.trim();
        if (newVal && newVal !== oldVal) {
          applyNewValue(divEl, newVal);
        } else {
          revertDiv(divEl, oldVal);
        }
      }
    }).datepicker('show');
  }


  function applyNewValue(divEl, newStr) {
    const dateObj = parseDateStr(newStr);
    if (isNaN(dateObj.getTime())) {
      alert('WTF, the date is invalid. Try "Nov 25, 2024".');
      revertDiv(divEl, newStr);
      return;
    }

    const isStart = divEl.classList.contains('issue_start_date');
    const isDue   = divEl.classList.contains('issue_due_date');
    const issueId = parseIssueId(divEl.id);

    if (!issueId) {
      console.warn('[IssueDateEdit] No issue ID in:', divEl.id);
      revertDiv(divEl, newStr);
      return;
    }

    let newStart = null, newDue = null;
    if (isStart) newStart = formatDateForRedmine(dateObj);
    if (isDue)   newDue   = formatDateForRedmine(dateObj);

    updateIssueDates(issueId, newStart, newDue)
      .then(() => {
        revertDiv(divEl, newStr);
        // TODO, refactor. Currently this is required to update Gannt chart on new date apply
        window.location.reload();
      })
      .catch(err => {
        console.error('Update date error:', err);
        alert('Failed to update date, see console');
        revertDiv(divEl, newStr);
      });
  }

  function revertDiv(divEl, dateText) {
    divEl.textContent = dateText;
    makeDateClickable(divEl);
  }

  function parseIssueId(str) {
    const m = str.match(/_(\d+)$/);
    return m ? m[1] : null;
  }


  function attachDateLinks() {
    const startDivs = document.querySelectorAll('div.issue_start_date');
    const dueDivs   = document.querySelectorAll('div.issue_due_date');
    const all = [...startDivs, ...dueDivs];
    all.forEach(div => {
      const txt = div.textContent.trim();
      if (txt) makeDateClickable(div);
    });
    console.log('[IssueDateEdit] Attached to date fields:', all.length);
  }


  function init() {
    const table = document.querySelector('.gantt-table tbody tr');
    if (!table) return;

    injectDatepickerOverlayCSS();
    hideSidebar();
    attachDateLinks();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();