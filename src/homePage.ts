import './globalStyle.css'
import './homeStyle.css'

export const renderHomePage = () => {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
        <div class="background-grid"></div>
        <div class="sparkles" id="sparkles"></div>

        <div class="container">
            <h1 class="logo">!omniroute</h1>
            <p class="tagline">A search router that doesn't duck around. Send queries straight to the right place with custom bangs and shortcuts.</p>
            <div class="buttons">
                <button class="btn add-to-browser-btn" id="addToBrowser">
                    <span>🌐</span>
                    Add to Browser
                </button>
                <button class="btn open-settings-btn" id="openSettings" onclick="window.location.href='/config'">
                    <span>⚙️</span>
                    Open Config
                </button>
            </div>
            <div class="footer-links">
                <a href="https://nikitalurye.com" target="_blank" rel="noopener noreferrer">About Me</a>
                <span class="separator"></span>
                <a href="https://github.com/niknal357/omniroute" target="_blank" rel="noopener noreferrer">Source Code</a>
            </div>
        </div>


        <div class="modal-overlay" id="modalOverlay">
            <div class="modal">
                <h2>Add omniroute to Your Browser</h2>
                <p>Set omniroute as your default search engine to start using bang commands directly in your address bar.</p>
                <div class="url-copy-section">
                    <label for="searchUrl">Search Engine URL:</label>
                    <div class="copy-container">
                        <input type="text" id="searchUrl" class="url-input" value="https://omniroute.app?q=%s" readonly>
                        <button class="copy-btn" id="copyBtn">Copy</button>
                    </div>
                </div>
                <div class="instructions">
                    <h3>Chrome Instructions:</h3>
                    <ol>
                        <li>Go to Chrome Settings → Search engine → Manage search engines</li>
                        <li>Click "Add" next to "Site search"</li>
                        <li>Name: "Omniroute", Shortcut: "!omni", URL: paste the copied URL above</li>
                        <li>Click "Add", then click the three dots next to Omniroute and select "Make default"</li>
                    </ol>
                </div>
                <button class="modal-close" id="closeModal">Got it!</button>
            </div>
        </div>
    `;
    // Modal functionality
    const addToBrowserBtn = app.querySelector<HTMLButtonElement>('#addToBrowser')!;
    const modalOverlay = app.querySelector<HTMLDivElement>('#modalOverlay')!;
    const closeModal = app.querySelector<HTMLButtonElement>('#closeModal')!;
    const copyBtn = app.querySelector<HTMLButtonElement>('#copyBtn')!;
    const searchUrl = app.querySelector<HTMLInputElement>('#searchUrl')!;


    addToBrowserBtn.addEventListener('click', () => {
        modalOverlay.classList.add('show');
    });

    closeModal.addEventListener('click', () => {
        modalOverlay.classList.remove('show');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('show');
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(searchUrl.value);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            searchUrl.select();
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        }
    });

    // Keyboard shortcut for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalOverlay.classList.remove('show');
        }
    });
}