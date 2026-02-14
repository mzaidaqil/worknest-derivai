const SCHEDULE_HOUR = 9;
const SCHEDULE_MINUTE = 0;

console.log(`[Scheduler] Service started. Compliance check scheduled for ${SCHEDULE_HOUR}:${SCHEDULE_MINUTE.toString().padStart(2, '0')} daily.`);

setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    // Check if it's 9:00:00 (approx)
    // We check only when seconds is 0 to avoid multiple triggers, or use a flag.
    // Simple approach: check if hour/min match and seconds < 10, then sleep.
    // Better: just check every minute.

    if (currentHour === SCHEDULE_HOUR && currentMinute === SCHEDULE_MINUTE) {
        // Prevent multiple triggers in the same minute requires state or just waiting.
        // Since this is a simple script, we'll just run it and rely on the fact that we check every 60s?
        // Actually, setInterval(..., 60000) might drift.
        // Let's just check every 10 seconds and track 'last run'.
    }
}, 1000 * 60);

// REVISED SIMPLE IMPLEMENTATION
// We'll check every minute.

let lastRunDate = null;

async function runCheck() {
    try {
        console.log('[Scheduler] Triggering daily compliance check...');
        // Assuming running locally on port 3000
        const res = await fetch('http://localhost:3000/api/cron/compliance-check', {
            method: 'POST',
        });
        const data = await res.json();
        console.log('[Scheduler] Check complete:', data);
    } catch (err) {
        console.error('[Scheduler] Error triggering check:', err.message);
    }
}

// Check time every minute
setInterval(() => {
    const now = new Date();
    // Check if it is 9:00 AM
    if (now.getHours() === SCHEDULE_HOUR && now.getMinutes() === SCHEDULE_MINUTE) {
        // Ensure we haven't run it today already
        const today = now.toDateString();
        if (lastRunDate !== today) {
            runCheck();
            lastRunDate = today;
        }
    }
}, 60000); // Check every minute

// Immediate check on startup for verification (Optional, maybe specific flag?)
// console.log("[Scheduler] Running immediate check for verification...");
// runCheck();
