// ==UserScript==
// @name         Wolt Merchant Image Helper
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automates product image downloads with correct Product IDs by intercepting internal API metadata.
// @author       Din Navn / Brukernavn
// @match        *://merchant.wolt.com/*
// @grant        GM_download
// @run-at       document-start
// ==/UserScript==

/**
 * WOLT MERCHANT IMAGE HELPER
 * * This script solves a common efficiency problem in the Wolt Merchant Portal:
 * Product images are typically served with a generic Image-ID filename, while 
 * internal systems require the 24-character Product-ID.
 * * Logic:
 * 1. Intercepts outgoing Fetch/XHR requests to capture product metadata (JSON).
 * 2. Maps Image-IDs to their respective Product-IDs in a local dictionary.
 * 3. Provides a UI to download selected images using the correct Product-ID as the filename.
 */

(function() {
    'use strict';

    let idMap = {};
    let syncCount = 0;

    // --- PART 1: NETWORK INTERCEPTION ---
    // Overriding Fetch and XHR to capture metadata packets before they are processed by the UI.
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const res = await originalFetch(...args);
        if (res.ok) {
            const clone = res.clone();
            clone.json().then(data => dataMiner(data)).catch(()=>{});
        }
        return res;
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            try { dataMiner(JSON.parse(this.responseText)); } catch(e) {}
        });
        originalOpen.apply(this, arguments);
    };

    // Recursive function to find 24-char hex strings paired with image URLs
    function dataMiner(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        const potentialId = obj.id || obj.product_id || obj.item_id || obj._id;
        const potentialImg = obj.image || obj.image_url || obj.header_image;

        if (potentialId && potentialId.length === 24 && typeof potentialImg === 'string') {
            const bildeId = potentialImg.split('/').pop().split('?')[0].replace('.jpg', '');
            if (bildeId.length > 10) {
                idMap[bildeId] = potentialId;
                syncCount = Object.keys(idMap).length;
            }
        }
        for (let k of Object.keys(obj)) {
            if (typeof obj[k] === 'object') dataMiner(obj[k]);
        }
    }

    // --- PART 2: USER INTERFACE ---
    function injectLauncher() {
        if (document.getElementById('tm-launcher')) return;
        const l = document.createElement('div');
        l.id = 'tm-launcher';
        l.innerHTML = '➔';
        l.style.cssText = 'position:fixed; top:15px; right:160px; z-index:999999; width:35px; height:35px; background:#009de0; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.4);';
        l.onclick = showModal;
        document.body.appendChild(l);
    }

    function showModal() {
        if (document.getElementById('tm-modal')) return;
        const items = getSelectedItems();
        const modal = document.createElement('div');
        modal.id = 'tm-modal';
        modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:320px; background:white; border-radius:12px; box-shadow:0 10px 50px rgba(0,0,0,0.5); z-index:1000000; padding:25px; font-family:sans-serif;';
        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0; font-size:16px;">Merchant Tool</h3>
                <span id="tm-close-x" style="cursor:pointer; font-size:24px; color:#999;">&times;</span>
            </div>
            
            <div id="sync-stat" style="font-size:11px; margin-bottom:15px; padding:5px; border-radius:4px; background:${syncCount > 0 ? '#e6f4ea' : '#fff4e5'}; color:${syncCount > 0 ? '#1e7e34' : '#664d03'};">
                ${syncCount > 0 ? '✅ '+syncCount+' IDs Mapped' : '⚠️ No Metadata Captured. Try Refreshing.'}
            </div>

            <p style="font-size:13px; margin-bottom:10px;">Items Selected: <b style="color:#009de0;">${items.length}</b></p>
            
            <div style="background:#f9f9f9; padding:12px; border-radius:8px; margin-bottom:20px; border:1px solid #eee;">
              <label style="display:flex; align-items:center; margin-bottom:8px; cursor:pointer; font-size:13px;"><input type="radio" name="prefix" value="wPT_" checked style="margin-right:8px;"> Photoshoot</label>
              <label style="display:flex; align-items:center; margin-bottom:8px; cursor:pointer; font-size:13px;"><input type="radio" name="prefix" value="wMX_"> Self Service</label>
              <label style="display:flex; align-items:center; cursor:pointer; font-size:13px;"><input type="radio" name="prefix" value="wST_"> Stock</label>
            </div>
            
            <button id="execBtn" style="width:100%; padding:14px; background:#009de0; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Download Selected</button>
        `;
        document.body.appendChild(modal);
        const bdrop = document.createElement('div');
        bdrop.id = 'tm-backdrop';
        bdrop.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.2); z-index:999999;';
        document.body.appendChild(bdrop);

        document.getElementById('tm-close-x').onclick = () => { modal.remove(); bdrop.remove(); };
        document.getElementById('execBtn').onclick = () => startDownload(items);
    }

    function getSelectedItems() {
        const foundItems = [];
        const checkboxes = document.querySelectorAll('div[class*="al-Checkbox"]');
        checkboxes.forEach(cb => {
            // Checks for Wolt's specific selection color (Blue)
            if (window.getComputedStyle(cb).backgroundColor.includes('rgb(0, 15')) {
                const row = cb.closest('[role="row"]') || cb.parentElement.parentElement.parentElement;
                if (row.innerText.includes('Select all')) return;
                
                const img = row.querySelector('img');
                if (img && img.src && !img.src.includes('avatar')) {
                    const bUrl = img.src.split('?')[0];
                    const bId = bUrl.split('/').pop().replace('.jpg', '');
                    const finalId = idMap[bId] || bId; // Use mapped Product-ID if available
                    if (!foundItems.some(i => i.id === finalId)) {
                        foundItems.push({id: finalId, url: bUrl + "?w=1600&h=1600"});
                    }
                }
            }
        });
        return foundItems;
    }

    async function startDownload(items) {
        const prefix = document.querySelector('input[name="prefix"]:checked').value;
        for (let i = 0; i < items.length; i++) {
            GM_download({ url: items[i].url, name: prefix + items[i].id + ".jpg", saveAs: false });
            await new Promise(r => setTimeout(r, 200));
        }
    }

    setInterval(injectLauncher, 1500);
})();
