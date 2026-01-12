// ==UserScript==
// @name         Redmine: Add tags selector
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Add tags setector near Issue Subject fild
// @author       Bohdan Y.
// @match        http://redmine.cmbu-engineering.diasemi.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue

// @downloadURL  https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20tags.user.js
// @updateURL    https://raw.githubusercontent.com/BohdanYavorivskiy/RedmineScripts/main/Redmine%3A%20Add%20tags.user.js
// ==/UserScript==

(function () {
      'use strict';

      const values = [
            "[HWSupport] - used for parents related to the Hardware Support of the new part number/development platform",
            "[Lock] - issues related to chip's locks",
            "[Detect] - all issues related to chip detection",
            "[Trim] - issues related to chip trimming/copying of trim codes",
            "[SocketTest] - issues with the socket test",
            "[MultiDevice] - issues related to working with more than one platform",
            "[Inspector] - issues related to voltage inspector for platforms",
            "[Bootloader] - bootloader issues",
            "[I2CAddr] - issues with I2C addressing",
            "[FWUpdate] - firmware issues (update, wrong firmware, etc.)",
            "[OrderInfo] - ordering info in the Recommended Platform configuration window OR in Launcher in the Details section",
            "[OTP] - One-time programmable chip issues",
            "[MTP] - Multiple time programmable chip issues",
            "[TypeToLocate] - 'Type to locate'(keyModifier+F) feature",
            "[Drivers] - issues related to drivers",
            "[UnappliedChanges] - issues related to Unapplied Changes pop-up",
            "[Bitstream] - For issues related to general bitstream",

            // Development platforms
            "[DPS] - Development Platform Selector",
            "[DIP] - DIP Development Board",
            "[Adv] - Advanced Development Platform",
            "[Pro] - Pro Development Platform (obsolete)",
            "[LiteBoard] - Lite Development Platform",
            "[GSD] - GreenPAK Serial Debugger",
            "[FPGADeluxe] - issues with both the ForgeFPGA Deluxe Development Platform R1 and R2",
            "[FPGADeluxeR1] - issues related only to ForgeFPGA Deluxe Development Platform R1",
            "[FPGADeluxeR2] - issues related only to ForgeFPGA Deluxe Development Platform R2",
            "[SocketCard] - issue related to Socket Cards (New type of socket adapters)",
            "[ExtensionCard] - for issues related to Extension Card",
            "[FPGAEval] - ForgeFPGA Evaluation Board",
            "[GCBoard] - Go Configure Board",
            "[20to32] - 20-pin to 32-pin adapter for SLG4688X",
            "[LLA] - Logic Level Adapter (LVPAK)",
            "[PPP] - PowerPAK Development Platform",
            "[UdevRule] - tag for VID/PID to be written on Linux Systems",

            // Demo
            "[Demo5] - GP5 related Demo Boards",
            "[Demo] - all possible Demo boards",
            "[DemoHV] - HVPAK Demo Board (related to family SLG47105V)",
            "[Demo47125] - HV PAK SLG47125V Demo Board (related to family SLG47125V)",
            "[Motor] - specify to what [Demo47125] board mode issues is related LED or BLDC Motor",
            "[LED] - specify to what [Demo47125] board mode issues is related LED or BLDC Motor",
            "[DesignLib] - Design Library tool (related to family SLG47125V, BLDC Demo Board)",
            "[PrjCorrector] - Project Corrector feature (related to family SLG47125V, BLDC Demo Board)",
            "[HVTrainBoard] - HVPAK Training Board",
            "[I2CBridge] - I2C Bridge",
            "[Demo000] - 51000 Demo Board",
            "[Demo001] - 51001 Demo Board",
            "[Demo002] - 51002 Demo Board",
            "[DemoLED] - Demo LED Board (related to family SLG47125V)",
            "[ColorPicker] - issues related to Color picker (related to family SLG47125V, Demo LED Board)",

            // Debugging Controls
            "[Standard] - issues related only to the Standard Procedures/Debugging Controls",
            "[Expert] - issues related only to the Expert Procedures/Debugging Controls",
            "[AsyncDev] - issues related to asynchronous chip procedure execution and father changes to UI behavior",
            "[DebugControls] - issues related to Debugging Controls widget",
            "[Emulation] - Emulation related",
            "[EmulationSync] - Emulation Sync related",
            "[TestMode] - Test Mode related",
            "[Read] - Read related",
            "[Program] - Program related",
            "[EC] - Expansion Connectors",
            "[PrjData] - Project Data window issues",
            "[EEPROM] - EEPROM related",
            "[External] - External connect related",
            "[I2CReset] - I2C Reset related",
            "[Refresh] - refresh button in the footer",
            "[SysInfo] - System info window",
            "[Bitstream][External] - For issues related to External Bitstream",

            // Generators
            "[SW] - Signal Wizard",
            "[AGen] - Analog Generator",
            "[SGen] - Signal Generator",
            "[I2CGen] - I2C Generator",
            "[LGen] - Logic Generator",
            "[SLGen] - Syncronys Logic Generator",
            "[PGen] - Parametric Generator",
            "[GenResources] - tag related to used resources widget and its behavior for Logic Generators on FPGA Advanced Platform",
            "[PWM] - PWM Generator",
            "[UART] - UART transmitter",
            "[Clock] - Clock generator",
            "[Raw] - Raw",

            // Generators' types
            "[DCGen] - Const. Voltage",
            "[ConstGen] - Const. Voltage",
            "[TrapezeGen] - Trapeze",
            "[LPGen] - Logic Pattern",
            "[SineGen] - Sine",
            "[CustomSW] - Custom Generator",

            // I2C Tools
            "[I2CReset] - issue related to I2C Reset feature",
            "[I2CVO] - I2C Virtual Outputs",
            "[HWProbes] - I2CVO related probes",
            "[I2CReconfig] - I2C Reconfigurator",
            "[HWLog] - issues found in the log section of I2C Tools",
            "[I2CVI] - I2C Virtual Inputs",

            // I2C Virtual Inputs tool tabs
            "[VI] - Virtual Inputs tab of [I2CVI]",
            "[Counters/Delays] - Counters/Delays tab of [I2CVI]",
            "[Registers] - Registers tab of [I2CVI]",
            "[HWDataBuff] - Data Buffer tab of the [I2CVI]",
            "[MemoryTable] - Memory Table tab of the [I2CVI]",
            "[MathCore] - Math Core Table tab of the [I2CVI]",
            "[NVMErase] - NVM Eraser tab of the [I2CVI]",
            "[EEPROMErase] - EEPROM Eraser tab of the [I2CVI]",
            "[SpeedControl] - Speed Control tab of the [I2CVI]",

            // Presets
            "[HWPreset] - Hardware presets",
            "[LAPreset] - Logic Analyzer presets",

            // Logic Analyzer
            "[LA] - Logic Analyzer itself",
            "[MoveTo] - Move to feature",
            "[Trigger] - Triggers of signals",
            "[Measure] - Measurement section of LA",
            "[Marker] - Marker-related issues",
            "[Cursor] - Cursor issues",

            // Protocol Analyzer
            "[PA] - Protocol Analyzer",
            "[I2C] - [PA][I2C] - issues related to I2C protocol in PA",
            "[UART] - [PA][UART] issues related to UART protocol in PA",
            "[SPI] - [PA][SPI] issue related to SPI protocol in PA",
            "[Parallel] - [PA][Parallel] issue related to Parallel protocol in PA",

            // Specific features
            "[OTPProg] - OTP Programmer",
            "[RawIO] - Raw I/O tab of [I2CVI] (Related to Canary revisions only)",
            "[DFTAnalog] - issues related to DFT Tools",
            "[DFTDigital] - issues related to DFT Tools",
            "[SWCTRL] - GPIO Software Control",
            "[Sync] - issue specific to canary revisions and specific to the Sync button",
            "[SWTestMode] - Software Test Mode",
            "[VMonitor] - Voltage monitor",
            "[PMonitor] - Power monitor",
            "[DACTool] - DAC Tool related issues (FPGA Advanced Development Platform)",
            "[FlashProg] - Flash Programmer"
      ];


      function addTagsPicker() {
            // Try to find the issue subject input even if the Gantt table isn't present.
            const issueSubjectInput = document.getElementById('issue_subject') || document.querySelector('input[name="issue[subject]"]');
            if (issueSubjectInput) {
                  // Avoid adding the picker more than once
                  if (!document.getElementById('issue_subject_picker')) {
                        const picker = document.createElement('select');
                        picker.id = 'issue_subject_picker';
                        picker.setAttribute('aria-label', 'Issue subject quick pick');

                        // Add a small search field to filter options
                        const search = document.createElement('input');
                        search.type = 'search';
                        search.id = 'issue_subject_picker_search';
                        search.placeholder = 'search tags...';
                        search.style.marginRight = '6px';
                        search.style.minWidth = '160px';
                        search.style.padding = '2px 6px';
                        // Insert search before the picker (place search immediately after the subject input,
                        // then place the picker after the search). This ensures the search appears on the left.
                        try {
                              issueSubjectInput.insertAdjacentElement('afterend', search);
                              search.insertAdjacentElement('afterend', picker);
                        } catch (e) {
                              // fallback: append to parent in correct left-to-right order
                              if (issueSubjectInput.parentNode) {
                                    issueSubjectInput.parentNode.appendChild(search);
                                    issueSubjectInput.parentNode.appendChild(picker);
                              }
                        }

                        // Helper to (re)populate select options based on a filter string
                        function populateOptions(filter) {
                              // clear existing
                              while (picker.firstChild) picker.removeChild(picker.firstChild);
                              const defaultOpt = document.createElement('option');
                              defaultOpt.value = '';
                              defaultOpt.textContent = '-- select tags --';
                              picker.appendChild(defaultOpt);

                              const q = (filter || '').toLowerCase().trim();
                              values.forEach(val => {
                                    if (!q || val.toLowerCase().indexOf(q) !== -1) {
                                          const opt = document.createElement('option');
                                          opt.value = val;
                                          opt.textContent = val;
                                          picker.appendChild(opt);
                                    }
                              });
                        }

                        // initial population
                        populateOptions('');

                        // Wire search to update options live
                        search.addEventListener('input', () => populateOptions(search.value));
                        // Pressing Enter in search selects first non-empty option (if any)
                        search.addEventListener('keydown', (e) => {
                              if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (picker.options.length > 1) {
                                          picker.selectedIndex = 1;
                                          picker.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                              }
                        });

                        // When picker changes, insert the selected value inside square brackets
                        picker.addEventListener('change', () => {

                              const match = picker.value.match(/\[(.*?)\]/);
                              const val = match ? match[1] : null;

                              if (!val) return;

                              const original = issueSubjectInput.value || '';

                              // If the value is already present in brackets, do nothing
                              if (original.indexOf('[' + val + ']') !== -1) {
                                    // still dispatch events so other listeners can react
                                    issueSubjectInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    issueSubjectInput.dispatchEvent(new Event('change', { bubbles: true }));
                                    return;
                              }

                              // Find leading bracket block(s) like "[111][222] "
                              const m = original.match(/^(\s*(?:\[[^\]]*\])+)\s*(.*)$/);
                              if (m) {
                                    // m[1] = existing bracket sequence, m[2] = rest of the text
                                    const brackets = m[1].trim();
                                    const rest = m[2] || '';
                                    issueSubjectInput.value = brackets + '[' + val + '] ' + rest;
                              } else {
                                    // No existing brackets — prepend the new one
                                    issueSubjectInput.value = '[' + val + '] ' + original;
                              }

                              // Trigger input/change events so the page notices the update
                              issueSubjectInput.dispatchEvent(new Event('input', { bubbles: true }));
                              issueSubjectInput.dispatchEvent(new Event('change', { bubbles: true }));
                        });

                        // picker (and search) were already inserted above next to the subject input.
                        // No further insertion here to avoid reordering the elements.
                  }
            } else {
                  console.log('No #issue_subject input found on this page.');
            }
      }


  // Handle Redmine navigation frameworks

  document.addEventListener('DOMContentLoaded', addTagsPicker);

  // Fallback: observe dynamic form creation
  const obs = new MutationObserver(() => addTagsPicker());
  obs.observe(document.body, { childList: true, subtree: true });

/*
      if (document.readyState === 'complete') {
            addTagsPicker();
      } else {
            window.addEventListener('load', addTagsPicker);
      }*/
})();