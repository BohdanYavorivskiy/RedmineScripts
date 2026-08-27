// ==UserScript==
// @name         Redmine: All-in-One Loader
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Single loader that bundles every Redmine userscript via @require. Install only this one to get all features.
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js

// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20release%20tag.user.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20Add%20start%20and%20due%20dates%20to%20gant.user.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%20Gantt%3A%20jQuery%20UI%20Datepicker%20Overlay%20%2B%20Overdue%20Coloring.user.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20fit%20task%20to%20impl%20part.user.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20btn%20to%20testing.user.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20parent%20task%20suggestion.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20redmine%20tag%20Interactive%20Gantt.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20tags.user.js
// @require      https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Highlite%20time.user.js

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20All-in-One%20Loader.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20All-in-One%20Loader.user.js
// ==/UserScript==

(function () {
      'use strict';
      // This loader intentionally has no logic of its own.
      // All behaviour comes from the @require'd scripts above, which are each
      // wrapped in their own IIFE and self-initialise on document-idle /
      // DOMContentLoaded.
      console.log('[Redmine All-in-One] All userscripts loaded.');
})();