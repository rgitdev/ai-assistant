import type { CompletionUsage } from "openai/resources";

export interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cached_tokens: number;
}

export interface UsageRecord {
    id: string;
    usage: Usage;
    timestamp: Date;
}

export class OpenAIUsageCollector {
    private usageRecords: UsageRecord[] = [];

    /**
     * Collect usage statistics from an OpenAI response
     * @param id The response ID from OpenAI
     * @param usage The usage statistics from the response
     */
    public collect(id: string, usage: CompletionUsage): void {
        this.usageRecords.push({
            id,
            usage: {
                prompt_tokens: usage.prompt_tokens || 0,
                completion_tokens: usage.completion_tokens || 0,
                total_tokens: usage.total_tokens || 0,
                cached_tokens: usage.prompt_tokens_details?.cached_tokens || 0
            },
            timestamp: new Date()
        });
    }

    /**
     * Get all collected usage records
     */
    public getUsageRecords(): UsageRecord[] {
        return [...this.usageRecords];
    }

    /**
     * Get usage records for a specific time period
     * @param startDate Start date of the period
     * @param endDate End date of the period
     */
    public getUsageRecordsForPeriod(startDate: Date, endDate: Date): UsageRecord[] {
        return this.usageRecords.filter(record => 
            record.timestamp >= startDate && record.timestamp <= endDate
        );
    }

    /**
     * Get total usage statistics
     */
    public getTotalUsage(): Usage {
        return this.usageRecords.reduce((total, record) => ({
            prompt_tokens: total.prompt_tokens + (record.usage.prompt_tokens || 0),
            completion_tokens: total.completion_tokens + (record.usage.completion_tokens || 0),
            total_tokens: total.total_tokens + (record.usage.total_tokens || 0),
            cached_tokens: total.cached_tokens + (record.usage.cached_tokens || 0)
        }), 
        {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            cached_tokens: 0
        });
    }

    public printTotalUsage(): void {
        const totalUsage = this.getTotalUsage();
        console.log("OpenAI API Usage Summary:");
        console.log(`\t Responses: ${this.usageRecords.length}`);
        console.log(`\t Prompt tokens: ${totalUsage.prompt_tokens}`);
        console.log(`\t Completion tokens: ${totalUsage.completion_tokens}`);
        console.log(`\t Total tokens: ${totalUsage.total_tokens}`);
        console.log(`\t Cached tokens: ${totalUsage.cached_tokens}`);
    }

    /**
     * Clear all collected usage records
     */
    public clear(): void {
        this.usageRecords = [];
    }

    /**
     * Create a callback function that can be attached to OpenAI client
     * @returns A callback function that collects usage from responses
     */
    public createCallback(): (response: any) => void {
        return (response: any) => {
            if (response?.id && response?.usage) {
                this.collect(response.id, response.usage);
            }
        };
    }
} 