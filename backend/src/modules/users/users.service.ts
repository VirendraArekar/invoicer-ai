import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        'SELECT id, email, name, role, company_name, currency, created_at FROM users WHERE id = $1',
        [id],
      );
      if (res.rows.length === 0) throw new NotFoundException('User not found');
      return res.rows[0];
    } else {
      const user = this.db.getTable('users').find((u) => u.id === id);
      if (!user) throw new NotFoundException('User not found');
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_name: user.company_name,
        currency: user.currency,
        created_at: user.created_at,
      };
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             company_name = COALESCE($2, company_name),
             currency = COALESCE($3, currency),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, name, role, company_name, currency, created_at, updated_at`,
        [dto.name, dto.companyName, dto.currency, id],
      );
      return res.rows[0];
    } else {
      const users = this.db.getTable('users');
      const idx = users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          name: dto.name || users[idx].name,
          company_name: dto.companyName || users[idx].company_name,
          currency: dto.currency || users[idx].currency,
          updated_at: new Date(),
        };
        return {
          id: users[idx].id,
          email: users[idx].email,
          name: users[idx].name,
          role: users[idx].role,
          company_name: users[idx].company_name,
          currency: users[idx].currency,
        };
      }
    }
  }
}
