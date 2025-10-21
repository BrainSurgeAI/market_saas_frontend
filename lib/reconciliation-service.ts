'use server'

import { fetchRemoteData } from "./api-utils";
import { 
  ReconciliationStatement, 
  ReconciliationStatementsResponse,
  ReconciliationStatementsQuery,
  ReconciliationOrder,
  ReconciliationOrdersResponse,
  EntityType,
  EntityReconciliationQuery
} from "@/app/types/reconciliationTypes";
import { logger } from "./logger";

/**
 * 获取客户对账单列表
 * @param customerId 客户ID
 * @param query 查询参数
 * @returns 对账单列表
 */
export async function getReconciliationStatements(
  customerId: string,
  query?: ReconciliationStatementsQuery
): Promise<ReconciliationStatement[]> {
  try {
    // 构建查询参数
    const searchParams = new URLSearchParams();
    
    // 添加客户ID参数
    searchParams.append('customerId', customerId);
    
    // 添加其他查询参数
    if (query?.status) {
      searchParams.append('status', query.status);
    }
    if (query?.startDate) {
      searchParams.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      searchParams.append('endDate', query.endDate);
    }
    if (query?.page) {
      searchParams.append('page', query.page.toString());
    }
    if (query?.pageSize) {
      searchParams.append('pageSize', query.pageSize.toString());
    }

    const endpoint = `/reconciliation_statements?${searchParams.toString()}`;
    
    const response = await fetchRemoteData<ReconciliationStatementsResponse>({
      endpoint,
      method: 'GET',
      tags: [`reconciliation-statements-${customerId}`],
      needToken: true
    });

    if (!response.success) {
      logger.error(`获取对账单失败: ${response.error}`);
      return [];
    }

    return response.data?.data || [];
  } catch (error) {
    logger.error(`获取对账单异常: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * 通用获取实体对账单列表
 * @param entityQuery 实体查询参数
 * @returns 对账单列表
 */
export async function getEntityReconciliationStatements(
  entityQuery: EntityReconciliationQuery
): Promise<ReconciliationStatement[]> {
  try {
    const { entityType, entityId, query } = entityQuery;
    
    // 构建查询参数
    const searchParams = new URLSearchParams();
    
    // 根据实体类型添加对应的ID参数
    switch (entityType) {
      case 'customer':
        searchParams.append('customerId', entityId);
        break;
      case 'provider':
        searchParams.append('providerId', entityId);
        break;
      case 'market':
        searchParams.append('marketId', entityId);
        break;
    }
    
    // 添加其他查询参数
    if (query?.status) {
      searchParams.append('status', query.status);
    }
    if (query?.startDate) {
      searchParams.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      searchParams.append('endDate', query.endDate);
    }
    if (query?.page) {
      searchParams.append('page', query.page.toString());
    }
    if (query?.pageSize) {
      searchParams.append('pageSize', query.pageSize.toString());
    }

    const endpoint = `/reconciliation_statements?${searchParams.toString()}`;
    
    const response = await fetchRemoteData<ReconciliationStatementsResponse>({
      endpoint,
      method: 'GET',
      tags: [`reconciliation-statements-${entityType}-${entityId}`],
      needToken: true
    });

    if (!response.success) {
      logger.error(`获取${entityType}对账单失败: ${response.error}`);
      return [];
    }

    return response.data?.data || [];
  } catch (error) {
    logger.error(`获取${entityQuery.entityType}对账单异常: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * 获取对账单订单详情
 * @param statementId 对账单ID
 * @returns 订单列表
 */
export async function getReconciliationOrders(
  statementId: number
): Promise<ReconciliationOrder[]> {
  try {
    const endpoint = `/reconciliation_statements/${statementId}`;
    
    const response = await fetchRemoteData<ReconciliationOrdersResponse>({
      endpoint,
      method: 'GET',
      tags: [`reconciliation-orders-${statementId}`],
      needToken: true
    });

    if (!response.success) {
      logger.error(`获取对账单订单失败: ${response.error}`);
      return [];
    }

    return response.data?.data || [];
  } catch (error) {
    logger.error(`获取对账单订单异常: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
} 