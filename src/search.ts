import { processQuery } from './queryProcessor.ts';

const url = new URL(window.location.href);
const query = url.searchParams.get("q")?.trim() ?? "";
if (query) {
    window.location.replace(processQuery(query, key => localStorage.getItem(key)));
} else {
    window.location.replace('/');
}
