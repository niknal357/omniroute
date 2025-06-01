export const processQuery = (query: string) => {
    console.log(query)
    const bangRegex = /!?\S+!|!\S+/g;
    const bang = (query.match(bangRegex))?.[1]?.toLowerCase();
    // check if the bang exists
    if (bang) {
        // trim the bang of !
        const trimmedBang = bang.replace(/^!+/, '');
        const bangUrl = localStorage.getItem("_" + trimmedBang);
        if (bangUrl) {
            // replace the bang in the query with the bang url
            const newQuery = query.replace(bangRegex, bangUrl);
            // redirect to the new query
            window.location.href = newQuery;
        } else {
            // if the bang does not exist, redirect to the search engine with the query
            const searchEngineUrl = localStorage.getItem("fallbackUrl") || "https://www.google.com/search?q=";
            window.location.href = searchEngineUrl + encodeURIComponent(query);
        }
    }
}