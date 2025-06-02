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

// Sparse engine reference - either just a name or full custom engine data
interface EngineReference {
    name: string;
    url?: string; // Only present for custom engines
}

interface ConfigData {
    version: string;
    useDDGBangs: boolean;
    useKagiBangs: boolean;
    bangOverrides: BangOverride[];
    fallbackEngine: EngineReference;
    realTimeHintsEngine: EngineReference;
    instantRedirect: {
        enabled: boolean;
        engine: EngineReference;
    };
    searchSettings: {
        googleUdm14: boolean;
        bingNoJs: boolean;
        duckSafeSearch: true;
    };
}

let uniqueIdCounter = 0;
function generateUniqueId() {
    return `config-${uniqueIdCounter++}`;
}

// Default search engines
const DEFAULT_ENGINES: SearchEngine[] = [
    { name: 'Google', url: 'https://www.google.com/search?q={query}' },
    { name: 'Bing', url: 'https://www.bing.com/search?q={query}' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', canInstaRedirect: true },
    { name: 'Custom', url: '', canInstaRedirect: true }
];

// Helper functions to convert between sparse and full engine data
function engineReferenceToFull(ref: EngineReference): SearchEngine {
    if (ref.name === 'Custom' && ref.url) {
        return { name: 'Custom', url: ref.url, canInstaRedirect: true };
    }
    
    const defaultEngine = DEFAULT_ENGINES.find(e => e.name === ref.name);
    if (defaultEngine) {
        return defaultEngine;
    }
    
    // Fallback if engine not found
    return DEFAULT_ENGINES[0];
}

function engineFullToReference(engine: SearchEngine): EngineReference {
    if (engine.name === 'Custom') {
        return { name: 'Custom', url: engine.url };
    }
    
    // For predefined engines, only store the name
    return { name: engine.name };
}

const INSTANT_REDIRECT_ENGINES = DEFAULT_ENGINES.filter(engine => engine.canInstaRedirect);

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
    
    const toggleId = generateUniqueId();

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.className = 'config-checkbox';
    checkbox.id = toggleId;
    checkbox.addEventListener('change', () => onChange(checkbox.checked));
    
    const labelEl = document.createElement('label');
    labelEl.className = 'config-label';
    labelEl.textContent = label;
    labelEl.style.cursor = 'pointer';
    labelEl.setAttribute('for', toggleId);
    
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
    selectedRef: EngineReference,
    onChange: (engineRef: EngineReference) => void,
    allowCustom: boolean = true
): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'config-dropdown-container';

    const selectId = generateUniqueId();
    const selected = engineReferenceToFull(selectedRef);
    
    const labelEl = document.createElement('label');
    labelEl.className = 'config-label';
    labelEl.textContent = label;
    labelEl.setAttribute('for', selectId);
    
    const select = document.createElement('select');
    select.className = 'config-select';
    select.id = selectId;
    
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
    customInput.id = generateUniqueId();
    
    select.addEventListener('change', () => {
        const selectedEngine = options.find(e => e.name === select.value);
        if (selectedEngine) {
            if (selectedEngine.name === 'Custom') {
                customInput.style.display = 'block';
                customInput.focus();
                onChange({ name: 'Custom', url: customInput.value });
            } else {
                customInput.style.display = 'none';
                onChange(engineFullToReference(selectedEngine));
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
                    <input type="text" class="config-input bang-input" value="${bang.bang}" placeholder="Bang (without !)">
                    <input type="text" class="config-input url-input" value="${bang.url}" placeholder="URL (use {query} placeholder)">
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
        <input type="text" class="config-input" id="newBangName" placeholder="Bang (without !)">
        <input type="text" class="config-input" id="newBangUrl" placeholder="URL (use {query} placeholder)">
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
    fallbackEngineRef: EngineReference,
    settings: ConfigData['searchSettings'],
    onChange: (engineRef: EngineReference, settings: ConfigData['searchSettings']) => void
): HTMLDivElement {
    const outerContainer = document.createElement('div');
    outerContainer.className = 'config-search-settings-outer';
    
    const fallbackDropdown = createDropdown(
        'Default Search Engine',
        DEFAULT_ENGINES,
        fallbackEngineRef,
        (engineRef) => {
            const newSettings = { ...settings };
            onChange(engineRef, newSettings);
        }
    );
    outerContainer.appendChild(fallbackDropdown);
    
    const container = document.createElement('div');
    container.className = 'config-search-settings config-indented';
    
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
                onChange(fallbackEngineRef, newSettings);
            },
            description
        );
        container.appendChild(toggle);
    });
    
    outerContainer.appendChild(container);
    return outerContainer;
}

function createInstantRedirectSection(
    config: { enabled: boolean; engine: EngineReference },
    onChange: (config: { enabled: boolean; engine: EngineReference }) => void
): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'config-instant-redirect';
    
    const toggle = createToggle(
        'Enable Instant Redirect to First Result',
        config.enabled,
        (enabled) => onChange({ ...config, enabled }),
        'Automatically redirect to the first search result using an empty bang (!)'
    );
    
    const INSTANT_REDIRECT_ENGINES = DEFAULT_ENGINES.filter(engine => engine.canInstaRedirect);
    
    const engineDropdown = createDropdown(
        'Search Engine for Instant Redirect',
        INSTANT_REDIRECT_ENGINES,
        config.engine,
        (engineRef) => onChange({ ...config, engine: engineRef })
    );
    
    engineDropdown.classList.add('config-indented');
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
        version: '1.0',
        useDDGBangs: true,
        useKagiBangs: true,
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
    
    // External Bangs Section
    const prepackagedBangsSection = createSection('Pre-packaged Bangs', configContainer);
    const ddgToggle = createToggle(
        'Use DuckDuckGo Packaged Bangs',
        configData.useDDGBangs,
        (checked) => {
            configData.useDDGBangs = checked;
            // Save config here
        },
        'Enable built-in DuckDuckGo bang shortcuts'
    );
    prepackagedBangsSection.appendChild(ddgToggle);
    const kagiToggle = createToggle(
        'Use Kagi Default Bangs',
        configData.useKagiBangs,
        (checked) => {
            configData.useKagiBangs = checked;
            // Save config here
        },
        'Enable built-in Kagi bang shortcuts'
    );
    prepackagedBangsSection.appendChild(kagiToggle);
    
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
    // const fallbackDropdown = createDropdown(
    //     'Default Search Engine',
    //     DEFAULT_ENGINES,
    //     configData.fallbackEngine,
    //     (engine) => {
    //         configData.fallbackEngine = engine;
    //         // Save config here
    //     }
    // );

    const searchSettings = createSearchSettings(
        configData.fallbackEngine,
        configData.searchSettings,
        (engine, settings) => {
            configData.fallbackEngine = engine;
            configData.searchSettings = settings;
            // Save config here
        }
    );
    fallbackSection.appendChild(searchSettings);
    
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