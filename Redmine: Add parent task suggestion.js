// ==UserScript==
// @name         Redmine: Add parent task suggestion
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Add parent task suggestion picker below the Parent task field (active Epics grouped by target)
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20parent%20task%20suggestion.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20parent%20task%20suggestion.user.js
// ==/UserScript==

(function () {
      'use strict';

      // ---- Config ----
      const PROJECT_ID = 'go-configure-software';
      const EPIC_TRACKER_ID = 5; // "Epic" tracker id (tracker-5 in the DOM).

      // parentSuggestions is populated dynamically from the active Epics of the
      // project, grouped by their target version. Shape:
      //   [{ target: 'Target name', epics: [{ id, subject }] }]
      // The heavy lifting (fetch + group + cache) lives in GetApiKey.js and is
      // exposed via window.getActiveEpicsGrouped (loaded through @require).
      let parentSuggestions = [];
      let suggestionsLoaded = false;
      let suggestionsPromise = null;

      // Load + cache the grouped suggestions once (deduped across calls).
      function loadParentSuggestions() {
            if (suggestionsPromise) return suggestionsPromise;
            suggestionsPromise = (async () => {
                  try {
                        if (typeof window.getActiveEpicsGrouped !== 'function') {
                              throw new Error('getActiveEpicsGrouped not available (GetApiKey.js not loaded)');
                        }
                        parentSuggestions = await window.getActiveEpicsGrouped(PROJECT_ID, {
                              trackerId: EPIC_TRACKER_ID,
                        });
                  } catch (err) {
                        console.error('Failed to load active epics:', err);
                        parentSuggestions = [];
                  } finally {
                        suggestionsLoaded = true;
                  }
                  return parentSuggestions;
            })();
            return suggestionsPromise;
      }

      function addParentTaskPicker() {
            // The Parent task field wrapper is <p id="parent_issue"> and the
            // actual input is #issue_parent_issue_id (name="issue[parent_issue_id]").
            const parentInput = document.getElementById('issue_parent_issue_id') ||
                  document.querySelector('input[name="issue[parent_issue_id]"]');
            if (!parentInput) {
                  return;
            }

            // The paragraph that groups the label + input. We append the search
            // and picker below it so they sit under the Parent task field.
            const parentField = document.getElementById('parent_issue') || parentInput.parentNode;
            if (!parentField) {
                  return;
            }

            // If a picker already exists AND it is still attached and bound to the
            // current input, nothing to do. Otherwise (re)create it.
            const existingPicker = document.getElementById('parent_issue_picker');
            if (existingPicker && existingPicker.isConnected &&
                  parentInput.isConnected &&
                  document.contains(parentInput) &&
                  existingPicker.dataset.boundInput === parentInput.id + parentInput.name) {
                  return;
            }

            // Clean up any stale row/picker/search left over from a previous render.
            const staleRow = document.getElementById('parent_issue_picker_row');
            if (staleRow) staleRow.remove();
            if (existingPicker) existingPicker.remove();
            const staleSearch = document.getElementById('parent_issue_picker_search');
            if (staleSearch) staleSearch.remove();

            const picker = document.createElement('select');
            picker.id = 'parent_issue_picker';
            picker.setAttribute('aria-label', 'Parent task quick pick');
            // Mark which input this picker is bound to, so we can detect re-renders.
            picker.dataset.boundInput = parentInput.id + parentInput.name;

            // Small search field to filter the parent task suggestions.
            const search = document.createElement('input');
            search.type = 'search';
            search.id = 'parent_issue_picker_search';
            search.placeholder = 'search parent task...';
            search.value = '[HwTools]';
            search.style.minWidth = '70px';
            search.style.padding = '2px 6px';

            // Row wrapper so the search and picker sit on one line below the field.
            const row = document.createElement('div');
            row.id = 'parent_issue_picker_row';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.marginTop = '6px';
            row.appendChild(search);
            row.appendChild(picker);

            // Place the row below the whole Parent task field.
            try {
                  parentField.insertAdjacentElement('afterend', row);
            } catch (e) {
                  if (parentField.parentNode) {
                        parentField.parentNode.appendChild(row);
                  }
            }

            function populateOptions(filter) {
                  while (picker.firstChild) picker.removeChild(picker.firstChild);
                  const defaultOpt = document.createElement('option');
                  defaultOpt.value = '';
                  defaultOpt.textContent = suggestionsLoaded ? '-- select parent task --' : 'Loading epics...';
                  picker.appendChild(defaultOpt);

                  const query = (filter || '').toLowerCase().trim();

                  // Render each target as an <optgroup> containing its epics.
                  parentSuggestions.forEach(group => {
                        const matchingEpics = group.epics.filter(epic => {
                              if (!query) return true;
                              const haystack = `${epic.id} ${epic.subject} ${group.target}`.toLowerCase();
                              return haystack.indexOf(query) !== -1;
                        });
                        if (matchingEpics.length === 0) return;

                        const optgroup = document.createElement('optgroup');
                        optgroup.label = group.target;
                        matchingEpics.forEach(epic => {
                              const opt = document.createElement('option');
                              opt.value = String(epic.id);
                              opt.textContent = `#${epic.id} - ${epic.subject}`;
                              optgroup.appendChild(opt);
                        });
                        picker.appendChild(optgroup);
                  });
            }

            populateOptions('');

            // Kick off the (cached) load and repopulate when ready.
            loadParentSuggestions().then(() => populateOptions(search.value));

            search.addEventListener('input', () => populateOptions(search.value));
            search.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') {
                        e.preventDefault();
                        if (picker.options.length > 1) {
                              picker.selectedIndex = 1;
                              picker.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                  }
            });

            picker.addEventListener('change', () => {
                  // Extract the leading numeric parent task id from the selection.
                  const match = picker.value.match(/(\d+)/);
                  const parentId = match ? match[1] : null;
                  if (!parentId) return;

                  parentInput.value = parentId;

                  // Trigger Redmine's own listeners (the field uses onchange to
                  // reload the form via updateIssueFrom / autocomplete).
                  parentInput.dispatchEvent(new Event('input', { bubbles: true }));
                  parentInput.dispatchEvent(new Event('change', { bubbles: true }));
            });
      }


      // ---- Robust bootstrapping / observation ----

      // Run immediately (document-idle means DOM is usually ready), and also on
      // DOMContentLoaded in case we somehow ran earlier.
      addParentTaskPicker();
      document.addEventListener('DOMContentLoaded', addParentTaskPicker);
      window.addEventListener('load', addParentTaskPicker);

      // Debounced observer so we don't hammer addParentTaskPicker on every
      // mutation and don't get stuck in feedback loops from our own inserts.
      let scheduled = false;
      const obs = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                  scheduled = false;
                  addParentTaskPicker();
            });
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });

})();