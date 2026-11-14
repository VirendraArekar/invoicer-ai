import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../../common/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'invoicer-ai-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query('SELECT id, email, name, role, company_name, currency FROM users WHERE id = $1', [
        payload.sub,
      ]);
      if (res.rows.length === 0) {
        throw new UnauthorizedException('User no longer exists');
      }
      const user = res.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.company_name,
        currency: user.currency,
      };
    } else {
      const users = this.db.getTable('users');
      const user = users.find((u) => u.id === payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.company_name,
        currency: user.currency,
      };
    }
  }
}
