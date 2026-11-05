import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildDateFilter } from '../../common/dates';

export interface AuditEntry {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  method: string;
  path: string;
  statusCode?: number | null;
  payload?: string | null;
  ip?: string | null;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        userEmail: entry.userEmail || null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode ?? null,
        payload: entry.payload || null,
        ip: entry.ip || null,
      },
    });
  }

  async findAll(query: {
    entity?: string;
    action?: string;
    userId?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const dateFilter = buildDateFilter(query.from, query.to);

    const where: any = {};
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (dateFilter) where.createdAt = dateFilter;
    if (query.search) {
      where.OR = [
        { userEmail: { contains: query.search } },
        { entity: { contains: query.search } },
        { action: { contains: query.search } },
        { path: { contains: query.search } },
      ];
    }

    const [total, items, byAction, byEntity] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { _all: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      stats: {
        byAction: byAction
          .map((row) => ({ action: row.action, count: row._count._all }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        byEntity: byEntity
          .map((row) => ({ entity: row.entity, count: row._count._all }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
      },
      items,
    };
  }

  async getFilterOptions() {
    const [entities, actions] = await Promise.all([
      this.prisma.auditLog.findMany({
        distinct: ['entity'],
        select: { entity: true },
        orderBy: { entity: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
    ]);

    return {
      entities: entities.map((row) => row.entity),
      actions: actions.map((row) => row.action),
    };
  }
}
