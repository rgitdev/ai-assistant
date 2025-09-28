export class CronExpression {
  private expression: string;
  private parts: string[];

  constructor(expression: string) {
    this.expression = expression;
    this.parts = expression.split(' ');
    
    if (this.parts.length !== 5) {
      throw new Error('Cron expression must have exactly 5 parts: minute hour day month weekday');
    }
  }

  isMatch(date: Date): boolean {
    const [minute, hour, day, month, weekday] = this.parts;
    
    return this.matchesPart(minute, date.getMinutes()) &&
           this.matchesPart(hour, date.getHours()) &&
           this.matchesPart(day, date.getDate()) &&
           this.matchesPart(month, date.getMonth() + 1) &&
           this.matchesPart(weekday, date.getDay());
  }

  private matchesPart(part: string, value: number): boolean {
    if (part === '*') return true;
    if (part.includes(',')) {
      return part.split(',').map(p => parseInt(p.trim())).includes(value);
    }
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(p => parseInt(p.trim()));
      return value >= start && value <= end;
    }
    if (part.includes('/')) {
      const [base, step] = part.split('/').map(p => p.trim());
      const stepValue = parseInt(step);
      
      if (base === '*') {
        // For */15, match every 15th value (0, 15, 30, 45 for minutes)
        return value % stepValue === 0;
      } else {
        // For specific base/step combinations
        const baseValue = parseInt(base);
        return value % stepValue === baseValue % stepValue;
      }
    }
    return parseInt(part) === value;
  }

  getNextRun(currentDate: Date): Date {
    const next = new Date(currentDate);
    next.setSeconds(0, 0);
    next.setMilliseconds(0);
    
    // Start from the next minute
    next.setMinutes(next.getMinutes() + 1);

    // Check up to 2 days ahead to find the next match
    const maxIterations = 60 * 24 * 2; // 2 days worth of minutes
    let iterations = 0;
    
    while (iterations < maxIterations) {
      if (this.isMatch(next)) {
        return next;
      }
      
      // Move to next minute
      next.setMinutes(next.getMinutes() + 1);
      iterations++;
    }

    throw new Error(`Could not find next run time for cron expression: ${this.expression}`);
  }

  toString(): string {
    return this.expression;
  }
}
