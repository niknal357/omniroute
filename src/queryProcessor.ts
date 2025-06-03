export const processQuery = (query: string, storageGet: (key: string) => string | null) => {
    console.log(query)
    // Regex to match bangs (e.g., !google, wikipedia!) but also just a lone bang (!).
    // for characters, we can use \S
    const bangRegex = /(?<!\S)(?:!\S+|\S+!|!)(?!\S)/g;
    const bang = (query.match(bangRegex))?.[0]?.toLowerCase();
    console.log(query.match(bangRegex));
    // check if the bang exists
    if (bang) {
        // trim the bang of ! on both sides
        const trimmedBang = bang.replace(/^!+|!+$/g, '').toLowerCase();
        console.log(trimmedBang);
        const trimmedQuery = query.replace(bangRegex, '').trim();
        if (!trimmedQuery) {
            // lone bang detected
            const bangUrl = storageGet("_l_" + trimmedBang);
            if (bangUrl) {
                return bangUrl;
            }
        } else {
            const bangUrl = storageGet("_b_" + trimmedBang);
            if (bangUrl) {
                const formattingCode = bangUrl[0];  // binary encoded
                                                    // 1s - url_encode_placeholder
                                                    // 2s - url_encode_space_to_plus
                const bangUrlWithoutFormatting = bangUrl.slice(1);
                return bangUrlWithoutFormatting.replace("{query}", encodeComponent(trimmedQuery.trim(), formattingCode === "1" || formattingCode === "3", formattingCode === "2" || formattingCode === "3"));
            }
        }
        const searchEngineUrl = storageGet("_e") || "https://www.google.com/search?q=";
        return searchEngineUrl.replace("{query}", encodeComponent(query.trim()));
    } else {
        const searchEngineUrl = storageGet("_e") || "https://www.google.com/search?q=";
        return searchEngineUrl.replace("{query}", encodeComponent(query.trim()));
    }
}

function encodeComponent(
    component: string,
    url_encode_placeholder: boolean = true,
    url_encode_space_to_plus: boolean = true
): string {
    let result = url_encode_placeholder ? encodeURIComponent(component) : component;
    if (url_encode_space_to_plus) {
        result = result.replace(/%20/g, "+").replace(/ /g, "+");
    }
    return result;
}