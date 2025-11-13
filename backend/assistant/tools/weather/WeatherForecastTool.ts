// backend/assistant/tools/weather/WeatherForecastTool.ts
import { Tool } from '../../ToolRegistry';

/**
 * Tool for getting weather forecasts for a specific city and date.
 * Returns mocked weather data (no external API integration).
 */
export class WeatherForecastTool implements Tool {
  name = "weather_forecast";
  description = "Get weather forecast for a specific city and date. Returns temperature, conditions, and general weather information.";

  parameters = {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "The name of the city to get the weather forecast for"
      },
      date: {
        type: "string",
        description: "The date for the weather forecast in YYYY-MM-DD format"
      }
    },
    required: ["city", "date"]
  };

  async execute(args: { city: string; date: string }): Promise<string> {
    const { city, date } = args;

    // Return mocked weather data
    return `On ${date} in the city ${city} the weather will be great, 20 degrees, and sunny`;
  }
}
