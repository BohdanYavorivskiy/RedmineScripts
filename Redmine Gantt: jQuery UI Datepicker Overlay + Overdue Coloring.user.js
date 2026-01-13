// ==UserScript==
// @name         Redmine Gantt: UI Datepicker Overlay + Overdue Coloring
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Hides sidebar; for each .issue_start_date / .issue_due_date, opens jQuery UI datepicker as an overlay. Allows month switching with no "Missing instance data". Colors overdue due dates in red.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20jQuery%20UI%20Datepicker%20Overlay%20%2B%20Overdue%20Coloring.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20jQuery%20UI%20Datepicker%20Overlay%20%2B%20Overdue%20Coloring.user.js
// ==/UserScript==

(function() {
  'use strict';

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

  function init() {
    const table = document.querySelector('.gantt-table tbody tr');
    if (!table) return;

    injectDatepickerOverlayCSS();
    hideSidebar();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
