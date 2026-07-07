import { app, initializeAppAsync } from '../server.js';

let initialized = false;

export default async function handler(req, res) {
    if (!initialized) {
        await initializeAppAsync();
        initialized = true;
    }
    return app(req, res);
}
