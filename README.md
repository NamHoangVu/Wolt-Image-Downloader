# Wolt Merchant Image Helper (Userscript)

A high-performance productivity tool for Wolt Merchant partners. It automates the process of exporting high-quality product images with their correct **Product-IDs** instead of generic image filenames.

## 🚀 The Problem
When managing thousands of products in the Wolt Merchant Portal, downloading images for archival or re-uploading to other systems is tedious. The portal serves images with arbitrary filenames, while back-office systems require the unique 24-character Product-ID. 

## 🛠️ The Solution
This script acts as a "metadata bridge" by:
- **API Interception:** Monitoring background network traffic (Fetch/XHR) to capture the JSON data Wolt uses to build the UI.
- **Dynamic Mapping:** Automatically linking Image-IDs to Product-IDs in real-time.
- **Bulk Export:** Allowing users to select items in the portal UI and download high-resolution (1600x1600) copies with standardized naming conventions (e.g., `wPT_[ProductID].jpg`).

## 📋 Features
- **Zero Configuration:** Works directly in the browser via Tampermonkey.
- **Intelligent Detection:** Detects selected items based on UI state and color markers.
- **Sync Status:** Real-time indicator showing if metadata has been successfully captured.

## 💻 How to Install
1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension.
2. Create a new script and paste the contents of `wolt-image-downloader.user.js`.
3. Navigate to your Wolt Merchant Listing Manager and look for the blue arrow icon.

---
*Disclaimer: This tool is for authorized merchant use only. It interacts with data already provided to the client browser and complies with standard web security practices.*
