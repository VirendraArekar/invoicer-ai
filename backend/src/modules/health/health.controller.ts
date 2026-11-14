import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private db: DatabaseService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System health, database connectivity, and AI copilot engine status' })
  getHealth() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const isGeminiConfigured = Boolean(
      apiKey && apiKey.trim().length > 5 && !apiKey.includes('your_gemini'),
    );

    return {
      status: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: this.db.isConnectedToPostgres,
        engine: this.db.isConnectedToPostgres ? 'Neon / PostgreSQL' : 'Resilient In-Memory Data Store',
        driver: 'pg (Node-Postgres Pool)',
      },
      aiEngine: {
        provider: 'Google Gemini AI',
        model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-4-hydrogen',
        isApiKeyConfigured: isGeminiConfigured,
        fallbackActive: !isGeminiConfigured,
      },
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
