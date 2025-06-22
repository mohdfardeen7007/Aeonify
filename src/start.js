import { startAeonify } from "./index.js";

startAeonify().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
});

