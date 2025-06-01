import './globalStyle.css'
import './configStyle.css'

// Types for configuration data
interface BangOverride {
    bang: string;
    url: string;
}

interface SearchEngine {
    name: string;
    url: string;
    canInstaRedirect?: boolean;
}

interface ConfigData {
    useDDGBangs: boolean;
    bangOverrides: BangOverride[];
    fallbackEngine: SearchEngine;
    realTimeHintsEngine: SearchEngine;
    instantRedirect: {
        enabled: boolean;
        engine: SearchEngine;
    };
    searchSettings: {
        googleUdm14: boolean;
        bingNoJs: boolean;
        duckSafeSearch: boolean;
    };
}

// Default search engines
const DEFAULT_ENGINES: SearchEngine[] = [
    { name: 'Google', url: 'https://www.google.com/search?q={query}' },
    { name: 'Bing', url: 'https://www.bing.com/search?q={query}' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', canInstaRedirect: true },
    { name: 'Custom', url: '' }
];

const INSTANT_REDIRECT_ENGINES = DEFAULT_ENGINES.filter(engine => engine.name !== 'Google');

function createSection(title: string, cc: HTMLDivElement) {
    const section = document.createElement('section');
    section.className = 'config-section';
    section.innerHTML = `
        <h2 class="config-subtitle">${title}</h2>
    `;
    cc.appendChild(section);
    return section;
}

function createToggle(
    label: string, 
    checked: boolean, 
    onChange: (checked: boolean) => void,
    description?: string
): HTMLDivElement {
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'config-toggle';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.className = 'config-checkbox';
    checkbox.addEventListener('change', () => onChange(checkbox.checked));
    
    const labelEl = document.createElement('label');
    labelEl.className = 'config-label';
    labelEl.textContent = label;
    labelEl.style.cursor = 'pointer';
    labelEl.addEventListener('click', () => {
        checkbox.checked = !checkbox.checked;
        onChange(checkbox.checked);
    });
    
    toggleDiv.appendChild(checkbox);
    toggleDiv.appendChild(labelEl);
    
    if (description) {
        const desc = document.createElement('div');
        desc.className = 'config-description';
        desc.textContent = description;
        toggleDiv.appendChild(desc);
    }
    
    return toggleDiv;
}

function createDropdown(
    label: string,
    options: SearchEngine[],
    selected: SearchEngine,
    onChange: (engine: SearchEngine) => void,
    allowCustom: boolean = true
): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'config-dropdown-container';
    
    const labelEl = document.createElement('label');
    labelEl.className = 'config-label';
    labelEl.textContent = label;
    
    const select = document.createElement('select');
    select.className = 'config-select';
    
    options.forEach(engine => {
        const option = document.createElement('option');
        option.value = engine.name;
        option.textContent = engine.name;
        option.selected = engine.name === selected.name;
        select.appendChild(option);
    });
    
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'config-input config-custom-input';
    customInput.placeholder = 'Enter custom search URL (use {query} as placeholder)';
    customInput.value = selected.name === 'Custom' ? selected.url : '';
    customInput.style.display = selected.name === 'Custom' ? 'block' : 'none';
    
    select.addEventListener('change', () => {
        const selectedEngine = options.find(e => e.name === select.value);
        if (selectedEngine) {
            if (selectedEngine.name === 'Custom') {
                customInput.style.display = 'block';
                customInput.focus();
                onChange({ name: 'Custom', url: customInput.value });
            } else {
                customInput.style.display = 'none';
                onChange(selectedEngine);
            }
        }
    });
    
    customInput.addEventListener('input', () => {
        if (select.value === 'Custom') {
            onChange({ name: 'Custom', url: customInput.value });
        }
    });
    
    container.appendChild(labelEl);
    container.appendChild(select);
    if (allowCustom) {
        container.appendChild(customInput);
    }
    
    return container;
}

function createBangList(
    bangs: BangOverride[],
    onAdd: (bang: BangOverride) => void,
    onRemove: (index: number) => void,
    onUpdate: (index: number, bang: BangOverride) => void
): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'config-bang-list';
    
    const list = document.createElement('ul');
    list.className = 'config-list';
    
    function renderBangs() {
        list.innerHTML = '';
        bangs.forEach((bang, index) => {
            const li = document.createElement('li');
            li.className = 'config-bang-item';
            
            li.innerHTML = `
                <div class="config-bang-display">
                    <span class="config-bang-name">!${bang.bang}</span>
                    <span class="config-bang-url">${bang.url}</span>
                    <div class="config-bang-actions">
                        <button class="config-btn config-btn-small edit-btn">Edit</button>
                        <button class="config-btn config-btn-small config-btn-danger remove-btn">Remove</button>
                    </div>
                </div>
                <div class="config-bang-edit" style="display: none;">
                    <input type="text" class="config-input bang-input" value="${bang.bang}" placeholder="Bang name (without !)">
                    <input type="text" class="config-input url-input" value="${bang.url}" placeholder="Search URL (use {query} as placeholder)">
                    <div class="config-bang-edit-actions">
                        <button class="config-btn save-btn">Save</button>
                        <button class="config-btn config-btn-secondary cancel-btn">Cancel</button>
                    </div>
                </div>
            `;
            
            const editBtn = li.querySelector('.edit-btn') as HTMLButtonElement;
            const removeBtn = li.querySelector('.remove-btn') as HTMLButtonElement;
            const saveBtn = li.querySelector('.save-btn') as HTMLButtonElement;
            const cancelBtn = li.querySelector('.cancel-btn') as HTMLButtonElement;
            const display = li.querySelector('.config-bang-display') as HTMLDivElement;
            const edit = li.querySelector('.config-bang-edit') as HTMLDivElement;
            const bangInput = li.querySelector('.bang-input') as HTMLInputElement;
            const urlInput = li.querySelector('.url-input') as HTMLInputElement;
            
            editBtn.addEventListener('click', () => {
                display.style.display = 'none';
                edit.style.display = 'block';
                bangInput.focus();
            });
            
            cancelBtn.addEventListener('click', () => {
                display.style.display = 'block';
                edit.style.display = 'none';
                bangInput.value = bang.bang;
                urlInput.value = bang.url;
            });
            
            saveBtn.addEventListener('click', () => {
                if (bangInput.value && urlInput.value) {
                    onUpdate(index, { bang: bangInput.value, url: urlInput.value });
                    display.style.display = 'block';
                    edit.style.display = 'none';
                    renderBangs();
                }
            });
            
            removeBtn.addEventListener('click', () => {
                onRemove(index);
                renderBangs();
            });
            
            list.appendChild(li);
        });
    }
    
    // Add new bang form
    const addForm = document.createElement('div');
    addForm.className = 'config-inline-form';
    addForm.innerHTML = `
        <input type="text" class="config-input" id="newBangName" placeholder="Bang name (without !)">
        <input type="text" class="config-input" id="newBangUrl" placeholder="Search URL (use {query} as placeholder)">
        <button class="config-btn" id="addBangBtn">Add Bang</button>
    `;
    
    const addBtn = addForm.querySelector('#addBangBtn') as HTMLButtonElement;
    const nameInput = addForm.querySelector('#newBangName') as HTMLInputElement;
    const urlInput = addForm.querySelector('#newBangUrl') as HTMLInputElement;
    
    addBtn.addEventListener('click', () => {
        if (nameInput.value && urlInput.value) {
            onAdd({ bang: nameInput.value, url: urlInput.value });
            nameInput.value = '';
            urlInput.value = '';
            renderBangs();
        }
    });
    
    // Enter key support
    [nameInput, urlInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });
    });
    
    container.appendChild(addForm);
    container.appendChild(list);
    renderBangs();
    
    return container;
}

function createSearchSettings(
    settings: ConfigData['searchSettings'],
    onChange: (settings: ConfigData['searchSettings']) => void
): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'config-search-settings';
    
    const toggles = [
        {
            key: 'googleUdm14' as keyof typeof settings,
            label: 'Google Web Search Only (udm=14)',
            description: 'Removes AI answers and focuses on traditional web results'
        },
        {
            key: 'bingNoJs' as keyof typeof settings,
            label: 'Bing No JavaScript',
            description: 'Use lightweight Bing interface'
        },
        {
            key: 'duckSafeSearch' as keyof typeof settings,
            label: 'DuckDuckGo Safe Search',
            description: 'Enable safe search filtering'
        }
    ];
    
    toggles.forEach(({ key, label, description }) => {
        const toggle = createToggle(
            label,
            settings[key],
            (checked) => {
                const newSettings = { ...settings, [key]: checked };
                onChange(newSettings);
            },
            description
        );
        container.appendChild(toggle);
    });
    
    return container;
}

function createInstantRedirectSection(
    config: ConfigData['instantRedirect'],
    onChange: (config: ConfigData['instantRedirect']) => void
): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'config-instant-redirect';
    
    const toggle = createToggle(
        'Enable Instant Redirect to First Result',
        config.enabled,
        (enabled) => onChange({ ...config, enabled }),
        'Automatically redirect to the first search result'
    );
    
    const engineDropdown = createDropdown(
        'Search Engine for Instant Redirect',
        INSTANT_REDIRECT_ENGINES,
        config.engine,
        (engine) => onChange({ ...config, engine })
    );
    
    engineDropdown.style.display = config.enabled ? 'block' : 'none';
    
    // Update visibility when toggle changes
    const checkbox = toggle.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.addEventListener('change', () => {
        engineDropdown.style.display = checkbox.checked ? 'block' : 'none';
    });
    
    container.appendChild(toggle);
    container.appendChild(engineDropdown);
    
    return container;
}

// Main render function with all components
export const renderConfigPage = () => {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.innerHTML = `
        <div class="config-container" id="configContainer">
            <h1 class="config-title">Configuration</h1>
        </div>
    `;
    const configContainer = app.querySelector<HTMLDivElement>('#configContainer')!;
    
    // Sample configuration data (replace with your actual data loading)
    let configData: ConfigData = {
        useDDGBangs: true,
        bangOverrides: [
            { bang: 'gh', url: 'https://github.com/search?q={query}' },
            { bang: 'so', url: 'https://stackoverflow.com/search?q={query}' }
        ],
        fallbackEngine: DEFAULT_ENGINES[0],
        realTimeHintsEngine: DEFAULT_ENGINES[0],
        instantRedirect: {
            enabled: false,
            engine: INSTANT_REDIRECT_ENGINES[0]
        },
        searchSettings: {
            googleUdm14: false,
            bingNoJs: false,
            duckSafeSearch: true
        }
    };
    
    // DDG Bangs Section
    const ddgSection = createSection('DuckDuckGo Bangs', configContainer);
    const ddgToggle = createToggle(
        'Use DuckDuckGo Default Bangs',
        configData.useDDGBangs,
        (checked) => {
            configData.useDDGBangs = checked;
            // Save config here
        },
        'Enable built-in DuckDuckGo bang shortcuts'
    );
    ddgSection.appendChild(ddgToggle);
    
    // Custom Bangs Section
    const bangsSection = createSection('Custom Bang Overrides', configContainer);
    const bangsList = createBangList(
        configData.bangOverrides,
        (bang) => {
            configData.bangOverrides.push(bang);
            // Save config here
        },
        (index) => {
            configData.bangOverrides.splice(index, 1);
            // Save config here
        },
        (index, bang) => {
            configData.bangOverrides[index] = bang;
            // Save config here
        }
    );
    bangsSection.appendChild(bangsList);
    
    // Fallback Engine Section
    const fallbackSection = createSection('Fallback Search Engine', configContainer);
    const fallbackDropdown = createDropdown(
        'Default Search Engine',
        DEFAULT_ENGINES,
        configData.fallbackEngine,
        (engine) => {
            configData.fallbackEngine = engine;
            // Save config here
        }
    );
    fallbackSection.appendChild(fallbackDropdown);
    
    // Search Settings Section
    const settingsSection = createSection('Search Engine Settings', configContainer);
    const searchSettings = createSearchSettings(
        configData.searchSettings,
        (settings) => {
            configData.searchSettings = settings;
            // Save config here
        }
    );
    settingsSection.appendChild(searchSettings);
    
    // Real-time Hints Section
    const hintsSection = createSection('Real-time Search Hints', configContainer);
    const hintsDropdown = createDropdown(
        'Search Engine for Hints',
        DEFAULT_ENGINES,
        configData.realTimeHintsEngine,
        (engine) => {
            configData.realTimeHintsEngine = engine;
            // Save config here
        }
    );
    hintsSection.appendChild(hintsDropdown);
    
    // Instant Redirect Section
    const redirectSection = createSection('Instant Redirect', configContainer);
    const instantRedirect = createInstantRedirectSection(
        configData.instantRedirect,
        (config) => {
            configData.instantRedirect = config;
            // Save config here
        }
    );
    redirectSection.appendChild(instantRedirect);
};