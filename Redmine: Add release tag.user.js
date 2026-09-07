// ==UserScript==
// @name         Redmine Gantt: Add release tag
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Takes a release version from epic and draws it on the classic Gantt diagram and the Interactive Gantt sidebar
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

      // ── Shared config ─────────────────────────────────────────────────────────

      const releaseTagClass = 'redmine-release-tag';
      const currentReleaseVersion = '6.56.001';

      const redFullColour = '#ff0000';
      const redColour = '#ff6666b5';
      const yellowColour = '#ffea8c';
      const blueColour = '#70b1ff82';
      const greenColour = '#aee678c4';

      // ── Shared helpers ────────────────────────────────────────────────────────

      function versionToNumber(versions) {
            return parseInt(versions.replace(/\./g, ''), 10);
      }

      function createEpicSpan(epicData) {
            const span = document.createElement('span');
            span.classList.add(releaseTagClass);
            let fullText = '';

            if (epicData.tracker.id === 5) {
                  // Target version lives in fixed_version, e.g. "6.56.001-ER", "6.55.001-IR"
                  const targetName = epicData.fixed_version?.name || '';
                  const releaseText = targetName.match(/\b\d+\.\d+\.\d+\b/g);
                  const isHotfix = targetName.includes('Hotfixes') || epicData.subject.includes('Hotfixes');

                  if (isHotfix) applyHotfixStyles(span);

                  if (releaseText) {
                        fullText = formatReleaseText(releaseText[0]);
                        applyReleaseColor(span, releaseText[0]);
                  } else {
                        fullText = 'NO TAG';
                        span.style.backgroundColor = redFullColour;
                  }
            } else {
                  fullText = 'NO EPIC';
                  span.style.backgroundColor = redFullColour;
            }

            span.textContent = fullText;
            return span;
      }

      /**
       * Convert a full version like "6.55.001" into the compact display
       * format "55-1" (minor number + trimmed patch number).
       */
      function formatReleaseText(releaseVersion) {
            const parts = releaseVersion.split('.');
            if (parts.length < 3) return releaseVersion;
            const minor = parts[1];                    // "55"
            const patch = String(parseInt(parts[2], 10)); // "001" → "1"
            return `${minor}.${patch}`;
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

      // ── Classic Gantt implementation ───────────────────────────────────────────

      function addEpicInfoClassic() {
            const tableRow = document.querySelector('.gantt-table tbody tr');
            if (!tableRow) return;

            const columnName = 'epic_column';
            if (document.querySelector(`.${columnName}`)) return;

            const issueRows = tableRow.querySelectorAll('.gantt_subjects div.issue-subject');
            issueRows.forEach(processClassicRow);
      }

      function processClassicRow(row) {
            const issueId = extractClassicIssueId(row.id);
            if (!issueId || row.querySelector(`.${releaseTagClass}`)) return;

            findTopParent(issueId).then(epicData => {
                  if (!epicData?.id) return;

                  const span = createEpicSpan(epicData);
                  row.insertBefore(span, row.firstChild);
            });
      }

      function extractClassicIssueId(rawId) {
            return rawId ? rawId.replace('issue-', '') : null;
      }

      // ── Interactive Gantt implementation ─────────────────────────────────────────

      // Tracks issue IDs already decorated to avoid duplicate spans
      const processedIds = new Set();

      /**
       * Extract the numeric issue ID from an igantt sidebar row element.
       * The row carries both data-id="63068" and data-row-key="issue-63068".
       */
      function extractIganttIssueId(rowEl) {
            return rowEl.dataset.id || null;
      }

      /**
       * Return the .igantt-subject-content element inside a sidebar row,
       * which is the insertion point for the release tag span.
       */
      function getSubjectContent(rowEl) {
            return rowEl.querySelector('.igantt-subject-content');
      }

      function processIganttRow(rowEl) {
            const issueId = extractIganttIssueId(rowEl);
            if (!issueId) return;

            // Skip rows already decorated (virtual scroller may re-inject them)
            if (processedIds.has(issueId)) return;

            const subjectContent = getSubjectContent(rowEl);
            if (!subjectContent) return;

            // Skip rows that already have a release tag
            if (subjectContent.querySelector(`.${releaseTagClass}`)) return;

            processedIds.add(issueId);

            findTopParent(issueId).then(epicData => {
                  if (!epicData?.id) return;

                  // Re-query the subject content — the row may have been recycled
                  // by the virtual scroller between the async call and now.
                  const currentRow = document.querySelector(
                        `.igantt-sidebar-row[data-id="${issueId}"]`
                  );
                  if (!currentRow) return;

                  const target = getSubjectContent(currentRow);
                  if (!target) return;

                  // Guard against double-insertion if the observer fires twice
                  if (target.querySelector(`.${releaseTagClass}`)) return;

                  const span = createEpicSpan(epicData);
                  target.insertBefore(span, target.firstChild);
            });
      }

      /**
       * Process all issue rows currently present in the sidebar rows container.
       */
      function processAllVisibleRows(container) {
            container
                  .querySelectorAll('.igantt-sidebar-row.row-type-issue')
                  .forEach(processIganttRow);
      }

      /**
       * The Interactive Gantt uses a virtual scroller: it continuously adds and
       * removes .igantt-sidebar-row elements inside .igantt-sidebar-rows as the
       * user scrolls.  A MutationObserver on that container catches every batch
       * of newly injected rows.
       */
      function attachRowObserver(rowsContainer) {
            // Process rows already in the DOM at attach time
            processAllVisibleRows(rowsContainer);

            const observer = new MutationObserver(mutations => {
                  for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                              if (!(node instanceof HTMLElement)) continue;

                              // A single row was added directly
                              if (node.classList.contains('igantt-sidebar-row') &&
                                    node.classList.contains('row-type-issue')) {
                                    processIganttRow(node);
                              }

                              // A subtree was added (e.g. the whole rows layer was replaced)
                              node.querySelectorAll?.('.igantt-sidebar-row.row-type-issue')
                                    .forEach(processIganttRow);
                        }
                  }
            });

            observer.observe(rowsContainer, { childList: true, subtree: true });
      }

      /**
       * Wait for .igantt-sidebar-rows to appear in the DOM, then attach the
       * row-level observer.  The igantt boots after document-idle, so we poll
       * the body until the container is ready.
       */
      function waitForIganttContainer() {
            const existing = document.querySelector('.igantt-sidebar-rows');
            if (existing) {
                  attachRowObserver(existing);
                  return;
            }

            const bodyObserver = new MutationObserver((_mutations, obs) => {
                  const container = document.querySelector('.igantt-sidebar-rows');
                  if (container) {
                        obs.disconnect();
                        attachRowObserver(container);
                  }
            });

            bodyObserver.observe(document.body, { childList: true, subtree: true });
      }

      // ── Entry point ───────────────────────────────────────────────────────────

      function init() {
            if (window.location.href.includes('interactive_gantt')) {
                  waitForIganttContainer();
            } else {
                  addEpicInfoClassic();
            }
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
      } else {
            document.addEventListener('DOMContentLoaded', init);
      }
})();
