import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactOrderItem } from './entities/fact-order-item.entity';
import { FactOrder } from './entities/fact-order.entity';

interface DemographicRow {
  ageGroup: string;
  category: string;
  totalQuantity: number;
  totalSpent: number;
}

interface DemographicsSummary {
  totalOrders: number;
  totalRevenue: number;
  topCategory: string;
  topAgeGroup: string;
}

export interface DemographicsResponse {
  breakdown: DemographicRow[];
  summary: DemographicsSummary;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(FactOrderItem, 'analytics')
    private readonly factOrderItemRepo: Repository<FactOrderItem>,
    @InjectRepository(FactOrder, 'analytics')
    private readonly factOrderRepo: Repository<FactOrder>,
  ) {}

  async getDemographics(): Promise<DemographicsResponse> {
    const breakdown = await this.factOrderItemRepo
      .createQueryBuilder('oi')
      .select('p."ageBucket"', 'ageGroup')
      .addSelect('m.category', 'category')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi."lineTotal")', 'totalSpent')
      .innerJoin('fact_orders', 'o', 'oi."orderId" = o."orderId"')
      .innerJoin('dim_patrons', 'p', 'o."patronId" = p."patronId"')
      .innerJoin('dim_menu_items', 'm', 'oi."menuItemId" = m."itemId"')
      .groupBy('p."ageBucket"')
      .addGroupBy('m.category')
      .orderBy('p."ageBucket"')
      .getRawMany<{
        ageGroup: string;
        category: string;
        totalQuantity: string;
        totalSpent: string;
      }>();

    const rows: DemographicRow[] = breakdown.map((row) => ({
      ageGroup: row.ageGroup,
      category: row.category,
      totalQuantity: Number(row.totalQuantity),
      totalSpent: Number(row.totalSpent),
    }));

    const orderStats = await this.factOrderRepo
      .createQueryBuilder('o')
      .select('COUNT(DISTINCT o."orderId")', 'totalOrders')
      .addSelect('SUM(o.total)', 'totalRevenue')
      .getRawOne<{ totalOrders: string; totalRevenue: string }>();

    const categoryTotals = new Map<string, number>();
    const ageGroupTotals = new Map<string, number>();
    for (const row of rows) {
      categoryTotals.set(
        row.category,
        (categoryTotals.get(row.category) ?? 0) + row.totalQuantity,
      );
      ageGroupTotals.set(
        row.ageGroup,
        (ageGroupTotals.get(row.ageGroup) ?? 0) + row.totalQuantity,
      );
    }

    const topCategory =
      [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const topAgeGroup =
      [...ageGroupTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

    return {
      breakdown: rows,
      summary: {
        totalOrders: Number(orderStats?.totalOrders ?? 0),
        totalRevenue: Number(orderStats?.totalRevenue ?? 0),
        topCategory,
        topAgeGroup,
      },
    };
  }
}
