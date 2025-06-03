import { processQuery } from './queryProcessor.ts';

const doMagic = () => {
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (query) {
        window.location.href = processQuery(query, key => localStorage.getItem(key));
        return null;
    }
    if (url.pathname === '/config') {
        // Load the config page
        import('./configPage.ts').then(module => {
            module.renderConfigPage();
        });
    } else if (url.pathname === '/whatsabang') {
        import('./whatsabangPage.ts').then(module => {
            module.renderWhatsABangPage();
        });
    } else {
        if (url.pathname !== '/') {
            // Redirect to homepage if not on config page
            window.location.href = '/';
            return null;
        }
        // Render the homepage
        import('./homePage.ts').then(module => {
            module.renderHomePage();
        });
        if (localStorage.getItem('saved') !== 'true') {
            import('./configPage.ts').then(module => {
                module.compileAndSaveDefaultConfig();
            });
        }
    }
}

doMagic();