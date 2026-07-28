// ==UserScript==
// @name         Redmine Interactive Gantt: Add release tag
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Takes a release version from epic and draws it on the Interactive Gantt sidebar
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20release%20tag%20Interactive%20Gantt.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20release%20tag%20Interactive%20Gantt.user.js
// ==/UserScript==

(function () {
      'use strict';

      if (!window.location.href.includes('interactive_gantt')) return;

      const releaseTextMark = 'r';
      const currentReleaseVersion = '6.55.001';

      const redFullColour = '#ff0000';
      const redColour = '#ff6666b5';
      const yellowColour = '#ffea8c';
      const blueColour = '#70b1ff82';
      const greenColour = '#aee678c4';

      // Tracks issue IDs already decorated to avoid duplicate spans
      const processedIds = new Set();

      function versionToNumber(versions) {
            return parseInt(versions.replace(/\./g, ''), 10);
      }

      // ── DOM helpers ──────────────────────────────────────────────────────────

      /**
       * Extract the numeric issue ID from an igantt sidebar row element.
       * The row carries both data-id="63068" and data-row-key="issue-63068".
       */
      function extractIssueId(rowEl) {
            return rowEl.dataset.id || null;
      }

      /**
       * Return the .igantt-subject-content element inside a sidebar row,
       * which is the insertion point for the release tag span.
       */
      function getSubjectContent(rowEl) {
            return rowEl.querySelector('.igantt-subject-content');
      }

      // ── Span creation (unchanged logic) ──────────────────────────────────────

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

      // ── Row processing ────────────────────────────────────────────────────────

      function processIssueRow(rowEl) {
            const issueId = extractIssueId(rowEl);
            if (!issueId) return;

            // Skip rows already decorated (virtual scroller may re-inject them)
            if (processedIds.has(issueId)) return;

            const subjectContent = getSubjectContent(rowEl);
            if (!subjectContent) return;

            // Skip rows whose subject already starts with the release mark
            if (subjectContent.textContent.trimStart().startsWith(releaseTextMark)) return;

            processedIds.add(issueId);

            findTopParent(issueId).then(epicData => {
                  if (!epicData?.id) return;

                  // Re-query the subject content — the row may have been recycled
                  // by the virtual scroller between the async call and now.
                  // Find the current DOM row for this issue ID.
                  const currentRow = document.querySelector(
                        `.igantt-sidebar-row[data-id="${issueId}"]`
                  );
                  if (!currentRow) return;

                  const target = getSubjectContent(currentRow);
                  if (!target) return;

                  // Guard against double-insertion if the observer fires twice
                  if (target.querySelector('.igantt-release-tag')) return;

                  const span = createEpicSpan(epicData);
                  span.classList.add('igantt-release-tag');
                  target.insertBefore(span, target.firstChild);
            });
      }

      /**
       * Process all issue rows currently present in the sidebar rows container.
       */
      function processAllVisibleRows(container) {
            container
                  .querySelectorAll('.igantt-sidebar-row.row-type-issue')
                  .forEach(processIssueRow);
      }

      // ── Observer setup ────────────────────────────────────────────────────────

      /**
       * The Interactive Gantt uses a virtual scroller: it continuously adds and
       * removes .igantt-sidebar-row elements inside .igantt-sidebar-rows as the
       * user scrolls.  A MutationObserver on that container catches every batch
       * of newly injected rows.
       *
       * We also watch the document body for the container itself appearing,
       * because the gantt boots asynchronously after page load.
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
                                    processIssueRow(node);
                              }

                              // A subtree was added (e.g. the whole rows layer was replaced)
                              node.querySelectorAll?.('.igantt-sidebar-row.row-type-issue')
                                    .forEach(processIssueRow);
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

      waitForIganttContainer();

})();