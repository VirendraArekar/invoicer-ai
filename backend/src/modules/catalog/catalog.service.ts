import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Injectable()
export class CatalogService {
  constructor(private db: DatabaseService) {}

  async findAll(userId: string, search?: string) {
    if (this.db.isConnectedToPostgres) {
      let query = `SELECT * FROM products WHERE user_id = $1`;
      const params: any[] = [userId];

      if (search && search.trim()) {
        query += ` AND (name ILIKE $2 OR description ILIKE $2 OR sku ILIKE $2 OR category ILIKE $2)`;
        params.push(`%${search.trim()}%`);
      }

      query += ` ORDER BY created_at DESC`;
      const res = await this.db.query(query, params);
      return res.rows;
    } else {
      let products = this.db.getTable('products').filter((p) => p.user_id === userId);
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q),
        );
      }
      return products;
    }
  }

  async findOne(userId: string, id: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query('SELECT * FROM products WHERE id = $1 AND user_id = $2', [id, userId]);
      if (res.rows.length === 0) throw new NotFoundException('Product not found');
      return res.rows[0];
    } else {
      const item = this.db.getTable('products').find((p) => p.id === id && p.user_id === userId);
      if (!item) throw new NotFoundException('Product not found');
      return item;
    }
  }

  async create(userId: string, dto: CreateProductDto) {
    const id = 'prd_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newProduct = {
      id,
      user_id: userId,
      name: dto.name,
      description: dto.description || '',
      sku: dto.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      unit_price: Number(dto.unitPrice),
      tax_rate: Number(dto.taxRate ?? 0),
      category: dto.category || 'Services',
      unit: dto.unit || 'unit',
      is_active: dto.isActive !== false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `INSERT INTO products (id, user_id, name, description, sku, unit_price, tax_rate, category, unit, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          newProduct.id,
          newProduct.user_id,
          newProduct.name,
          newProduct.description,
          newProduct.sku,
          newProduct.unit_price,
          newProduct.tax_rate,
          newProduct.category,
          newProduct.unit,
          newProduct.is_active,
          newProduct.created_at,
          newProduct.updated_at,
        ],
      );
      return res.rows[0];
    } else {
      this.db.getTable('products').unshift(newProduct);
      return newProduct;
    }
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(userId, id);
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `UPDATE products
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             sku = COALESCE($3, sku),
             unit_price = COALESCE($4, unit_price),
             tax_rate = COALESCE($5, tax_rate),
             category = COALESCE($6, category),
             unit = COALESCE($7, unit),
             is_active = COALESCE($8, is_active),
             updated_at = NOW()
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [
          dto.name,
          dto.description,
          dto.sku,
          dto.unitPrice !== undefined ? Number(dto.unitPrice) : null,
          dto.taxRate !== undefined ? Number(dto.taxRate) : null,
          dto.category,
          dto.unit,
          dto.isActive,
          id,
          userId,
        ],
      );
      return res.rows[0];
    } else {
      const products = this.db.getTable('products');
      const idx = products.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          ...dto,
          unit_price: dto.unitPrice !== undefined ? Number(dto.unitPrice) : products[idx].unit_price,
          tax_rate: dto.taxRate !== undefined ? Number(dto.taxRate) : products[idx].tax_rate,
          updated_at: new Date(),
        };
        return products[idx];
      }
    }
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    if (this.db.isConnectedToPostgres) {
      await this.db.query('DELETE FROM products WHERE id = $1 AND user_id = $2', [id, userId]);
    } else {
      const products = this.db.getTable('products');
      const idx = products.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx !== -1) {
        products.splice(idx, 1);
      }
    }
    return { success: true, message: 'Item deleted successfully' };
  }
}
