# LightSearch

A lightweight, local-first Chrome/Edge search extension. The UI is bundled with the extension; search results are requested as structured data when an API is configured.

## Current status: 0.1.0

- Local New Tab search interface (Hebrew RTL and English).
- Google provider using the official Custom Search JSON API when configured.
- Google fallback opens the normal Google results page when API credentials are absent.
- DuckDuckGo provider opens its regular results page (not yet a compact data adapter).
- Local result cache with configurable lifetime.
- Approximate response-payload byte count for API responses.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` (Chrome) or `edge://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select the repository folder.

## Configure compact Google results

The structured-results adapter requires a Google Programmable Search Engine ID (`cx`) and an API key for the Custom Search JSON API.

1. Create a Programmable Search Engine at <https://programmablesearchengine.google.com/>.
2. Enable the Custom Search JSON API in Google Cloud and create an API key.
3. Open the extension's Options page and enter the API key and `cx` ID.

Google's API availability, quotas, pricing, and terms can change. The extension does not scrape Google's HTML results. Without API configuration, it opens the standard Google results page instead.

## Data and privacy

- The extension UI and scripts are packaged locally; it does not load remote UI assets.
- Search result payloads are cached in `chrome.storage.local`.
- API settings are stored in `chrome.storage.sync`.
- Searches are sent to the selected provider. Google API keys are sent to Google's API endpoint as required for authentication.
- The displayed byte count measures the response body only; it is an approximation, not total network traffic (headers, TLS, and other browser traffic are excluded).

## Roadmap

- Add additional structured-data providers behind a common adapter interface.
- Improve cache controls and stale-result behavior.
- Add a repeatable network-transfer comparison against normal search.
- Add automated UI and provider tests.

## License

MIT
