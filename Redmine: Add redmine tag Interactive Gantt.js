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

    // Use the shared Redmine base URL / API key exposed by GetApiKey.js,
    // falling back to the current origin if it is not available.
    const BASE_URL = (typeof REDMINE_URL !== 'undefined' && REDMINE_URL) ||
        (typeof window !== 'undefined' && window.REDMINE_URL) ||
        window.location.origin;

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

    const issueCache = new Map(); // issueId → Promise<issue>
    const tagsCache = new Map(); // issueId → string[]

    // ── API helpers ───────────────────────────────────────────────────────────

    function fetchIssue(issueId) {
        if (issueCache.has(issueId)) return issueCache.get(issueId);

        // API_KEY is provided by the required GetApiKey.js userscript.
        const apiKey = typeof API_KEY !== 'undefined' ? API_KEY : null;
        const headers = apiKey ? { 'X-Redmine-API-Key': apiKey } : {};

        const url = apiKey
            ? `${BASE_URL}/issues/${issueId}.json?include=tags&key=${apiKey}`
            : `${BASE_URL}/issues/${issueId}.json?include=tags`;

        const promise = fetch(url, { headers })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => data.issue)
            .catch(err => {
                console.warn(`[iGantt] Failed to fetch issue ${issueId}:`, err);
                return null;
            });

        issueCache.set(issueId, promise);
        return promise;
    }

    // ── DOM helpers ───────────────────────────────────────────────────────────

    function extractIssueId(rowEl) {
        return rowEl.dataset.id || null;
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