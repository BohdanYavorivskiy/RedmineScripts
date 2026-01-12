// ==UserScript==
// @name         Redmine: Get API Key
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Get API key from user
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/GetApiKey.js
// ==/UserScript==

    let API_KEY = GM_getValue('apiKey');
    if (!API_KEY) {
        API_KEY = prompt('Please enter your API key:');
        if (API_KEY) GM_setValue('apiKey', API_KEY);
    }
    const REDMINE_URL = 'http://redmine.cmbu-engineering.diasemi.com';
