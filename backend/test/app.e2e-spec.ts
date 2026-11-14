import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Invoicer AI API (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/demo-login (POST) should authenticate demo account', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/demo-login')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe('demo@invoicerai.com');

    jwtToken = response.body.data.accessToken;
  });

  it('/api/dashboard/summary (GET) should return business metrics and AI pulse', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics).toBeDefined();
    expect(response.body.data.aiPulse).toBeDefined();
  });

  it('/api/invoices (GET) should list user invoices', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/invoices')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('/api/ai/polish-item (POST) should polish raw task note', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/ai/polish-item')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ rawDescription: 'fixed payment gateway error and added webhooks' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.polishedDescription).toBeDefined();
  });
});
