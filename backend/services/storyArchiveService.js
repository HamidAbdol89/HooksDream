// storyArchiveService.js - Auto-archive expired stories
const cron = require('node-cron');
const Story = require('../models/Story');

class StoryArchiveService {
    constructor() {
        this.isRunning = false;
    }

    // Start the cron job to auto-archive expired stories
    start() {
        if (this.isRunning) {
            console.log('📁 Story archive service is already running');
            return;
        }

        // Run every 30 minutes
        this.cronJob = cron.schedule('*/30 * * * *', async () => {
            try {
                console.log('📁 Running story archive job...');
                const archivedCount = await Story.archiveExpiredStories();
                
                if (archivedCount > 0) {
                    console.log(`📁 Archived ${archivedCount} expired stories`);
                } else {
                    console.log('📁 No expired stories to archive');
                }
            } catch (error) {
                console.error('❌ Story archive job error:', error);
            }
        }, {
            scheduled: false
        });

        this.cronJob.start();
        this.isRunning = true;
        console.log('✅ Story archive service started - runs every 30 minutes');
    }

    // Stop the cron job
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('🛑 Story archive service stopped');
        }
    }

    // Manual archive check (for testing)
    async manualArchive() {
        try {
            console.log('📁 Manual story archive check...');
            const archivedCount = await Story.archiveExpiredStories();
            console.log(`📁 Manually archived ${archivedCount} expired stories`);
            return archivedCount;
        } catch (error) {
            console.error('❌ Manual archive error:', error);
            throw error;
        }
    }

    // Get service status
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: this.cronJob ? this.cronJob.nextDate() : null
        };
    }
}

// Export singleton instance
module.exports = new StoryArchiveService();
