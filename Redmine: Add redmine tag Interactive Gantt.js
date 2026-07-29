// ==UserScript==
// @name         Redmine Interactive Gantt: Add redmine tag in the first column
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Add redmine tag in the first column of the interactive gantt chart, and colorize tags in the tags column.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20redmine%20tag%20Interactive%20Gantt.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20redmine%20tag%20Interactive%20Gantt.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (!window.location.href.includes('interactive_gantt')) return;

    // ── Constants ─────────────────────────────────────────────────────────────

    const BASE_URL              = window.location.origin;
    const releaseTextMark       = 'r';
    const currentReleaseVersion = '6.55.001';

    const redFullColour = '#ff0000';
    const redColour     = '#ff6666b5';
    const blueColour    = '#70b1ff82';
    const greenColour   = '#aee678c4';

    // Tags column is the 4th .igantt-column-cell inside each row (0-based index 3)
    const TAGS_CELL_INDEX = 0;

    // ── Tag colour map ────────────────────────────────────────────────────────

    const TAG_COLOURS = {
        'FQA-Done':         { bg: '#4a7c59', text: '#ffffff' },
        'Integration':      { bg: '#2e7d6e', text: '#ffffff' },
        'Integration-Done': { bg: '#1a6b5a', text: '#ffffff' },
        'No-Testing':       { bg: '#6b6b2e', text: '#ffffff' },
        'Pending-CR':       { bg: '#8b5e2e', text: '#ffffff' },
        'Pending-FQA':      { bg: '#c47a1e', text: '#ffffff' },
        'Pending-PQA':      { bg: '#b8860b', text: '#ffffff' },
        'Pending-RQA':      { bg: '#9a7b1a', text: '#ffffff' },
        'Pending-RQC':      { bg: '#6b3a7d', text: '#ffffff' },
        'PQA-Done':         { bg: '#5a2d6b', text: '#ffffff' },
        'Reopened':         { bg: '#c0392b', text: '#ffffff' },
        'RQA-Done':         { bg: '#922b21', text: '#ffffff' },
        'Testing':          { bg: '#1a5276', text: '#ffffff' },
        'UGUpd':            { bg: '#4a5568', text: '#ffffff' },
    };

    // ── Caches ────────────────────────────────────────────────────────────────

    const issueCache       = new Map(); // issueId → Promise<issue>
    const tagsCache        = new Map(); // issueId → string[]
    const epicCache        = new Map(); // issueId → Promise<issue>
    const processedRelease = new Set(); // issueIds whose release span was inserted

    // ── API helpers ───────────────────────────────────────────────────────────

    function fetchIssue(issueId) {
        if (issueCache.has(issueId)) return issueCache.get(issueId);

        const apiKey = typeof getRedmineApiKey === 'function' ? getRedmineApiKey() : null;
        const headers = apiKey ? { 'X-Redmine-API-Key': apiKey } : {};

        const promise = fetch(`${BASE_URL}/issues/${issueId}.json?include=tags`, { headers })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => data.issue)
            .catch(err => {
                console.warn(`[iGantt] Failed to fetch issue ${issueId}:`, err);
                return null;
            });

        issueCache.set(issueId, promise);
        return promise;
    }

    async function findTopParent(issueId) {
        if (epicCache.has(issueId)) return epicCache.get(issueId);

        const promise = (async () => {
            let current = await fetchIssue(issueId);
            if (!current) return null;

            while (current.parent?.id) {
                const parent = await fetchIssue(current.parent.id);
                if (!parent) break;
                current = parent;
                if (current.tracker?.id === 5) break; // Epic found
            }
            return current;
        })();

        epicCache.set(issueId, promise);
        return promise;
    }

    // ── DOM helpers ───────────────────────────────────────────────────────────

    function extractIssueId(rowEl) {
        return rowEl.dataset.id || null;
    }

    function getSubjectContent(rowEl) {
        return rowEl.querySelector('.igantt-subject-content');
    }

    function getTagsCell(rowEl) {
        return rowEl.querySelectorAll('.igantt-column-cell')[TAGS_CELL_INDEX] ?? null;
    }

    function currentRowById(issueId) {
        return document.querySelector(`.igantt-sidebar-row[data-id="${issueId}"]`);
    }

    // ── Style injection ───────────────────────────────────────────────────────

    function injectStyles() {
        if (document.getElementById('igantt-tag-style')) return;
        const style = document.createElement('style');
        style.id = 'igantt-tag-style';
        style.textContent = `
            .igantt-tag-pill {
                display: inline-block;
                padding: 0 5px;
                margin: 1px 2px;
                border-radius: 3px;
                font-size: 0.72rem;
                font-weight: 500;
                line-height: 16px;
                white-space: nowrap;
                background-color: #dde4f0;
                color: #2c3e6b;
                border: 1px solid #b0bcd8;
                vertical-align: middle;
            }
            .igantt-column-cell {
                overflow: hidden;
                white-space: nowrap;
            }
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

    // ── Tags column rendering ─────────────────────────────────────────────────

    function renderTagsInCell(tagsCell, tagNames) {
        tagsCell.querySelectorAll('.igantt-tag-pill').forEach(el => el.remove());
        if (!tagNames || tagNames.length === 0) return;

        const fragment = document.createDocumentFragment();
        for (const name of tagNames) {
            const pill = document.createElement('span');
            pill.className   = 'igantt-tag-pill';
            pill.textContent = name;

            const colours = TAG_COLOURS[name];
            if (colours) {
                pill.style.backgroundColor = colours.bg;
                pill.style.color           = colours.text;
                pill.style.borderColor     = colours.bg;
            }

            fragment.appendChild(pill);
        }
        tagsCell.appendChild(fragment);
    }

    // ── Release-tag span (subject column) ────────────────────────────────────

    function versionToNumber(version) {
        return parseInt(version.replace(/\./g, ''), 10);
    }

    function createEpicSpan(epicData) {
        const span = document.createElement('span');
        let text = releaseTextMark;

        if (epicData?.tracker?.id === 5) {
            const releaseText = epicData.subject.match(/\b\d+\.\d+\.\d+\b/g);
            const isHotfix    = epicData.subject.includes('Hotfixes');

            if (isHotfix) {
                span.style.color      = redFullColour;
                span.style.display    = 'inline-block';
                span.style.fontWeight = 'bold';
                span.style.animation  = 'flicker 0.5s infinite';
            }

            if (releaseText) {
                text = releaseText[0];
                const releaseId = versionToNumber(releaseText[0]);
                const currentId = versionToNumber(currentReleaseVersion);
                if (releaseId === currentId)    span.style.backgroundColor = greenColour;
                else if (releaseId > currentId) span.style.backgroundColor = blueColour;
                else                            span.style.backgroundColor = redColour;
            } else {
                text += 'NO TAG';
                span.style.backgroundColor = redFullColour;
            }
        } else {
            text += 'NO EPIC';
            span.style.backgroundColor = redFullColour;
        }

        span.textContent = text;
        return span;
    }

    function insertReleaseSpan(issueId, epicData) {
        const row = currentRowById(issueId);
        if (!row) return;
        const target = getSubjectContent(row);
        if (!target || target.querySelector('.igantt-release-tag')) return;
        const span = createEpicSpan(epicData);
        span.classList.add('igantt-release-tag');
        target.insertBefore(span, target.firstChild);
    }

    // ── Row processing ────────────────────────────────────────────────────────

    function processIssueRow(rowEl) {
        const issueId = extractIssueId(rowEl);
        if (!issueId) return;

        // ── Tags column ──────────────────────────────────────────────────────
        if (tagsCache.has(issueId)) {
            const tagsCell = getTagsCell(rowEl);
            if (tagsCell) renderTagsInCell(tagsCell, tagsCache.get(issueId));
        } else {
            fetchIssue(issueId).then(issue => {
                if (!issue) return;
                const tagNames = (issue.tags ?? []).map(t => t.name ?? t);
                tagsCache.set(issueId, tagNames);
                const tagsCell = getTagsCell(currentRowById(issueId) ?? rowEl);
                if (tagsCell) renderTagsInCell(tagsCell, tagNames);
            });
        }

        // ── Release tag in subject ───────────────────────────────────────────
        if (processedRelease.has(issueId)) {
            // Row was recycled by virtual scroller — re-insert from cached promise
            epicCache.get(issueId)?.then(epicData => {
                if (epicData) insertReleaseSpan(issueId, epicData);
            });
            return;
        }

        processedRelease.add(issueId);
        findTopParent(issueId).then(epicData => {
            if (epicData) insertReleaseSpan(issueId, epicData);
        });
    }

    // ── Observer setup ────────────────────────────────────────────────────────

    function attachRowObserver(rowsContainer) {
        rowsContainer
            .querySelectorAll('.igantt-sidebar-row.row-type-issue')
            .forEach(processIssueRow);

        const observer = new MutationObserver(mutations => {
            for (const { addedNodes } of mutations) {
                for (const node of addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (node.classList.contains('igantt-sidebar-row') &&
                        node.classList.contains('row-type-issue')) {
                        processIssueRow(node);
                    }
                    node.querySelectorAll?.('.igantt-sidebar-row.row-type-issue')
                        .forEach(processIssueRow);
                }
            }
        });

        observer.observe(rowsContainer, { childList: true, subtree: true });
    }

    function waitForIganttContainer() {
        const existing = document.querySelector('.igantt-sidebar-rows');
        if (existing) { attachRowObserver(existing); return; }

        const bodyObserver = new MutationObserver((_m, obs) => {
            const container = document.querySelector('.igantt-sidebar-rows');
            if (container) { obs.disconnect(); attachRowObserver(container); }
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    // ── Entry point ───────────────────────────────────────────────────────────

    injectStyles();
    waitForIganttContainer();

})();
