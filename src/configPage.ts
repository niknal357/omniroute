import './globalStyle.css'
import './configStyle.css'
import { kagiBangs } from './kagiBangs.ts';
import { processQuery } from './queryProcessor.ts';

// Types for configuration data
interface BangOverride {
    bang: string;
    url: string;
    lone_url: string;
    url_encode_placeholder: boolean;
    url_encode_space_to_plus: boolean;
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
    useKagiBangs: boolean;
    bangOverrides: BangOverride[];
    fallbackEngine: EngineReference;
    instantRedirect: {
        enabled: boolean;
        engine: EngineReference;
    };
    searchSettings: {
        googleUdm14: boolean;
        bingNoJs: boolean;
        duckSafeSearch: boolean;
    };
}

let uniqueIdCounter = 0;
function generateUniqueId() {
    return `config-${uniqueIdCounter++}`;
}

// Default search engines
const DEFAULT_ENGINES: SearchEngine[] = [
    { name: 'Google', url: 'https://google.com/search?q={query}', canInstaRedirect: true },
    { name: 'Bing', url: 'https://bing.com/search?q={query}' },
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

function serializeConfig(config: ConfigData): string {
    return JSON.stringify(config, (key, value) => {
        // Remove undefined values
        if (value === undefined) {
            return null;
        }
        return value;
    });
}

const DEFAULT_CONFIG: ConfigData = {
    version: '1.0',
    useKagiBangs: true,
    bangOverrides: [],
    fallbackEngine: { name: 'Google' },
    instantRedirect: {
        enabled: true,
        engine: { name: 'Google' }
    },
    searchSettings: {
        googleUdm14: false,
        bingNoJs: false,
        duckSafeSearch: false
    }
};

function deserializeConfig(data: string): ConfigData {
    try {
        const parsed = JSON.parse(data);
        // Validate version
        if (parsed.version !== DEFAULT_CONFIG.version) {
            console.warn(`Config version mismatch: expected ${DEFAULT_CONFIG.version}, got ${parsed.version}`);
        }
        // Ensure all required fields are present
        return {
            ...DEFAULT_CONFIG,
            ...parsed,
            bangOverrides: parsed.bangOverrides || [],
            fallbackEngine: parsed.fallbackEngine || DEFAULT_CONFIG.fallbackEngine,
            instantRedirect: parsed.instantRedirect || DEFAULT_CONFIG.instantRedirect,
            searchSettings: parsed.searchSettings || DEFAULT_CONFIG.searchSettings
        };
    } catch (e) {
        console.error('Failed to parse config:', e);
        return { ...DEFAULT_CONFIG }; // Return default config on error
    }
}

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
                    <span class="config-bang-url">${bang.lone_url}</span>
                    <div class="config-bang-actions">
                        <button class="config-btn config-btn-small edit-btn">Edit</button>
                        <button class="config-btn config-btn-small config-btn-danger remove-btn">Remove</button>
                    </div>
                </div>
                <div class="config-bang-edit" style="display: none;">
                    <input type="text" class="config-input bang-input" value="${bang.bang}" placeholder="Bang (without !)">
                    <input type="text" class="config-input url-input" value="${bang.url}" placeholder="URL (use {query} placeholder)">
                    <input type="text" class="config-input lone-url-input" value="${bang.lone_url}" placeholder="Lone URL (when bang is used alone)">
                    <div class="config-bang-checkboxes">
                        <label>
                            <input type="checkbox" class="url-encode-checkbox" ${bang.url_encode_placeholder ? 'checked' : ''}>
                            URL encode query
                        </label>
                        <label>
                            <input type="checkbox" class="space-plus-checkbox" ${bang.url_encode_space_to_plus ? 'checked' : ''}>
                            Encode spaces as +
                        </label>
                    </div>
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
            const loneUrlInput = li.querySelector('.lone-url-input') as HTMLInputElement;
            const urlEncodeCheckbox = li.querySelector('.url-encode-checkbox') as HTMLInputElement;
            const spacePlusCheckbox = li.querySelector('.space-plus-checkbox') as HTMLInputElement;
            
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
                loneUrlInput.value = bang.lone_url;
                urlEncodeCheckbox.checked = bang.url_encode_placeholder;
                spacePlusCheckbox.checked = bang.url_encode_space_to_plus;
                renderBangs();
            });
            
            saveBtn.addEventListener('click', () => {
                if (bangInput.value && urlInput.value) {
                    onUpdate(index, {
                        bang: bangInput.value,
                        url: urlInput.value,
                        lone_url: loneUrlInput.value,
                        url_encode_placeholder: urlEncodeCheckbox.checked,
                        url_encode_space_to_plus: spacePlusCheckbox.checked
                    });
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
    addForm.className = 'config-form';
    addForm.innerHTML = `
        <input type="text" class="config-input config-fw" id="newBangName" placeholder="Bang (without !)">
        <input type="text" class="config-input config-fw" id="newBangUrl" placeholder="URL (use {query} placeholder)">
        <input type="text" class="config-input config-fw" id="newBangLoneUrl" placeholder="Lone URL (when bang is used alone)">
        <div class="config-bang-checkboxes config-fw">
            <div class="config-toggle">
            <label>
                <input type="checkbox" id="newUrlEncode" class="config-checkbox" checked>
                URL encode query
            </label>
            </div>
            <div class="config-toggle">
            <label>
                <input type="checkbox" id="newSpacePlus" class="config-checkbox" checked>
                Encode spaces as +
            </label>
            </div>
        </div>
        <button class="config-btn" id="addBangBtn">Add Bang</button>
    `;
    
    const addBtn = addForm.querySelector('#addBangBtn') as HTMLButtonElement;
    const nameInput = addForm.querySelector('#newBangName') as HTMLInputElement;
    const urlInput = addForm.querySelector('#newBangUrl') as HTMLInputElement;
    const loneUrlInput = addForm.querySelector('#newBangLoneUrl') as HTMLInputElement;
    const urlEncodeInput = addForm.querySelector('#newUrlEncode') as HTMLInputElement;
    const spacePlusInput = addForm.querySelector('#newSpacePlus') as HTMLInputElement;
    
    addBtn.addEventListener('click', () => {
        if (nameInput.value && urlInput.value) {
            onAdd({
                bang: nameInput.value,
                url: urlInput.value,
                lone_url: loneUrlInput.value,
                url_encode_placeholder: urlEncodeInput.checked,
                url_encode_space_to_plus: spacePlusInput.checked
            });
            nameInput.value = '';
            urlInput.value = '';
            loneUrlInput.value = '';
            urlEncodeInput.checked = true;
            spacePlusInput.checked = true;
            renderBangs();
        }
    });
    
    // Enter key support
    [nameInput, urlInput, loneUrlInput].forEach(input => {
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
        'Feeling Lucky Shortcut',
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

function compileConfig(config: ConfigData): Record<string, string> {
    // this function compiles the configuration into a dictionary of bang -> URL mappings
    // get the search engine URL
    const fallbackEngine = engineReferenceToFull(config.fallbackEngine);
    const fallbackUrl = fallbackEngine.url;
    const compiled: Record<string, string> = {};
    compiled["_e"] = fallbackEngine.url;
    if (config.useKagiBangs) {
        kagiBangs.forEach(bang => {
            compiled["_l_" + bang.b] = bang.n;
            const fmt = (bang.f).toString();
            compiled["_b_" + bang.b] = fmt + bang.u.replace('{engine}', fallbackUrl).replace('{query}', '{query}' + bang.a);
        });
    }
    if (config.instantRedirect.enabled) {
        const instaRedirectEngineName = config.instantRedirect.engine.name;
        if (instaRedirectEngineName === 'Custom') {
            compiled["_b_"] = "3" + config.instantRedirect.engine.url;
        } else {
            const url = {
                "Google": "3https://google.com/search?q={query}&btnI",
                "DuckDuckGo": "3https://duckduckgo.com/?q=\\{query}",
            }[config.instantRedirect.engine.name];
            if (url) {
                compiled["_b_"] = url;
            }
        }
    }
    return compiled;
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
    
    // Load saved configuration or use default
    let savedConfig = localStorage.getItem('configData');
    let configData: ConfigData;
    if (savedConfig) {
        configData = deserializeConfig(savedConfig);
    } else {
        configData = { ...DEFAULT_CONFIG };
    }

    let compiledConfig = compileConfig(configData);
    
    // External Bangs Section
    const prepackagedBangsSection = createSection('Pre-packaged Bangs', configContainer);
    const kagiToggle = createToggle(
        'Use Kagi Default Bangs',
        configData.useKagiBangs,
        (checked) => {
            configData.useKagiBangs = checked;
            compiledConfig = compileConfig(configData);
            updateTryOutResult();
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
            compiledConfig = compileConfig(configData);
            updateTryOutResult();
        },
        (index) => {
            configData.bangOverrides.splice(index, 1);
            compiledConfig = compileConfig(configData);
            updateTryOutResult();
        },
        (index, bang) => {
            configData.bangOverrides[index] = bang;
            compiledConfig = compileConfig(configData);
            updateTryOutResult();
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
    //         compiledConfig = compileConfig(configData);
    //     }
    // );

    const searchSettings = createSearchSettings(
        configData.fallbackEngine,
        configData.searchSettings,
        (engine, settings) => {
            configData.fallbackEngine = engine;
            configData.searchSettings = settings;
            compiledConfig = compileConfig(configData);
            updateTryOutResult();
        }
    );
    fallbackSection.appendChild(searchSettings);
    
    // Instant Redirect Section
    const redirectSection = createSection('Instant Redirect', configContainer);
    const instantRedirect = createInstantRedirectSection(
        configData.instantRedirect,
        (config) => {
            configData.instantRedirect = config;
            compiledConfig = compileConfig(configData);
            updateTryOutResult();
        }
    );
    redirectSection.appendChild(instantRedirect);

    const tryOutSection = createSection('Try Out Your Configuration', configContainer);
    const tryOutField = document.createElement('input');
    tryOutField.type = 'text';
    tryOutField.className = 'config-input config-custom-input';
    tryOutField.placeholder = 'Enter search query';
    tryOutField.id = 'tryOutField';
    tryOutField.autocomplete = 'off';
    tryOutSection.appendChild(tryOutField);
    // next, we want to make a thing that will say This query will redirect you to: `some url here`
    // we should probably use <input type="text" id="searchUrl" class="url-input" value="https://omniroute.app?q=%s" readonly>
    const resultDisplay = document.createElement('div');
    resultDisplay.className = 'config-tryout-result';
    resultDisplay.id = 'tryOutResult';
    resultDisplay.textContent = 'This query will redirect you to: ';
    tryOutSection.appendChild(resultDisplay);
    const resultDisplayURLDisplay = document.createElement('input');
    resultDisplayURLDisplay.className = 'config-tryout-url';
    resultDisplayURLDisplay.id = 'tryOutResultURL';
    resultDisplayURLDisplay.type = 'text';
    resultDisplayURLDisplay.readOnly = true;
    resultDisplay.appendChild(resultDisplayURLDisplay);
    function updateTryOutResult() {
        const query = tryOutField.value.trim();
        if (query) {
            const url = processQuery(query, key => compiledConfig[key]);
            resultDisplayURLDisplay.value = url;
        } else {
            resultDisplayURLDisplay.value = '';
        }
    }

    tryOutField.addEventListener('input', updateTryOutResult);
};