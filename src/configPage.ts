import './globalStyle.css'
import './configStyle.css'

function createSection(title: string, cc: HTMLDivElement) {
    const section = document.createElement('section');
    section.className = 'config-section';
    section.innerHTML = `
        <h2 class="config-subtitle">${title}</h2>
    `
    cc.appendChild(section);
    return section;
}

export const renderConfigPage = () => {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
        <div class="config-container" id="configContainer">
            <h1 class="config-title">Configuration</h1>
        </div>
    `;
    const configContainer = app.querySelector<HTMLDivElement>('#configContainer')!;
    const bangSection = createSection('Bangs', configContainer);
};
