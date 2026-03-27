// ==UserScript==
// @name         Redmine Gantt: Redmine: Add release tag
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Takes a release version from epiq and draw on Gant diagram 
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20release%20tag.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20release%20tag.user.js
// ==/UserScript==

(function () {
      'use strict';

      const releaseTextMark = 'r';
      const currentReleaseVersion = '6.54.001';

      const redFullColour = '#ff0000';

      const redColour = '#ff6666b5';
      const yellowColour = '#ffea8c';
      const blueColour = '#70b1ff82';
      const greenColour = '#aee678c4';

      function versionToNumber(versions) {
            return parseInt(versions.replace(/\./g, ''), 10);
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
                        fullText = fullText.slice(3);
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

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
            addEpicInfo();
      } else {
            document.addEventListener('DOMContentLoaded', addEpicInfo);
      }
})();
