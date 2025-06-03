import { VitePWA } from "vite-plugin-pwa"

/** @type {import('vite').UserConfig} */
export default {
    plugins: [
        VitePWA({ registerType: 'autoUpdate' })
    ],
    base: '/'
}