import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '../../common/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.findUserByEmail(email);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const newUser = {
      id: userId,
      email,
      password_hash: passwordHash,
      name: dto.name,
      role: 'owner',
      company_name: dto.companyName || `${dto.name}'s Company`,
      currency: dto.currency || 'USD',
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (this.db.isConnectedToPostgres) {
      await this.db.query(
        `INSERT INTO users (id, email, password_hash, name, role, company_name, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newUser.id,
          newUser.email,
          newUser.password_hash,
          newUser.name,
          newUser.role,
          newUser.company_name,
          newUser.currency,
          newUser.created_at,
          newUser.updated_at,
        ],
      );

      // Create default settings for user
      await this.db.query(
        `INSERT INTO settings (id, user_id, company_name, email, default_currency, default_tax_rate, default_payment_terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'set_' + userId,
          userId,
          newUser.company_name,
          newUser.email,
          newUser.currency,
          8.25,
          'Net 30',
        ],
      );
    } else {
      const users = this.db.getTable('users');
      users.push(newUser);

      const settings = this.db.getTable('settings');
      settings.push({
        id: 'set_' + userId,
        user_id: userId,
        company_name: newUser.company_name,
        email: newUser.email,
        phone: '',
        website: '',
        tax_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        logo_url: '',
        default_currency: newUser.currency,
        default_tax_rate: 8.25,
        default_payment_terms: 'Net 30',
        invoice_notes_template: 'Thank you for your business. Please remit payment by the due date.',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const token = this.generateToken(newUser);
    return {
      user: this.sanitizeUser(newUser),
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  async demoLogin() {
    // Quick demo login preconfigured with demo credentials
    return this.login({
      email: 'demo@invoicerai.com',
      password: 'password123',
    });
  }

  async getProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        'SELECT id, email, name, role, company_name, currency, created_at FROM users WHERE id = $1',
        [userId],
      );
      if (res.rows.length === 0) throw new UnauthorizedException('User not found');
      return this.sanitizeUser(res.rows[0]);
    } else {
      const users = this.db.getTable('users');
      const user = users.find((u) => u.id === userId);
      if (!user) throw new UnauthorizedException('User not found');
      return this.sanitizeUser(user);
    }
  }

  private async findUserByEmail(email: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0] || null;
    } else {
      const users = this.db.getTable('users');
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any): IUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.company_name,
      currency: user.currency,
      createdAt: user.created_at,
    };
  }
}
