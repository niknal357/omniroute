import './globalStyle.css'
import './configStyle.css'

export const renderWhatsABangPage = () => {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
        <div class="config-container" id="whatsABangContainer">
            <h1 class="config-title">What’s a Bang?</h1>
            <section class="config-section">
                <h2 class="config-subtitle">The Basics</h2>
                <p>
                    <b>Bangs</b> are special shortcuts in search engines that instantly send your query to a specific website. Instead of typing a search, then clicking through to another site, you use a bang prefix or suffix to go straight there.<br><br>
                    <span style="font-family: Jost, sans-serif; font-weight: 500; font-style: italic;">Example:</span>
                </p>
                <div class="config-card" style="margin: 1em 0;">
                    <code>!yt lo-fi hip hop</code>
                    <span style="margin-left: 1em; color: var(--text-secondary);">// searches YouTube for “lo-fi hip hop”</span>
                </div>
                <p>
                    Bangs save you time by letting you route searches directly to the right place. No more clicking through Google first.
                </p>
            </section>
            <section class="config-section">
                <h2 class="config-subtitle">How They Work</h2>
                <ul class="config-list">
                    <li>
                        <b>Prefix or suffix:</b> You can use <code>!yt cats</code> or <code>cats !yt</code> — Omniroute recognizes both.
                    </li>
                    <li>
                        <b>Hundreds of supported bangs:</b> You get built-in support for popular shortcuts like <code>!wiki</code>, <code>!gh</code> (GitHub), and more.
                    </li>
                    <li>
                        <b>Custom bangs:</b> Add your own! Target any site, any way you want.
                    </li>
                </ul>
            </section>
            <section class="config-section">
                <h2 class="config-subtitle">Why Omniroute Bangs Are Better</h2>
                <ul class="config-list">
                    <li>
                        <b>No ducking around:</b> Bangs go exactly where you want, instantly. No extra search results page in the middle.
                    </li>
                    <li>
                        <b>First-result shortcut:</b> Want to jump to the top result? Just type <code>!</code> by itself.
                    </li>
                    <li>
                        <b>Personalized:</b> Fully customize your own bangs, or override built-ins with your preferred URLs.
                    </li>
                    <li>
                        <b>Clean, fast, no tracking:</b> Unlike some other search routers, Omniroute runs locally and doesn’t track you.
                    </li>
                </ul>
            </section>
            <section class="config-section">
                <h2 class="config-subtitle">Try it Out!</h2>
                <p>
                    Set up your own bangs on the <a href="/config" style="color: var(--primary-color);">Configuration</a> page, or use built-in ones out of the box.<br>
                    <b>Power users:</b> You’re in control.
                </p>
            </section>
        </div>
    `;
};
