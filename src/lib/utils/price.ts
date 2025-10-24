/**
 * 价格相关工具函数
 */

import React, { type ReactElement } from 'react'

/**
 * 格式化价格显示
 * @param price 价格字符串
 * @param currency 货币符号
 * @returns 格式化后的价格元素
 */
export function formatPrice(price: string, currency: string = ''): ReactElement {
    return React.createElement(
        'span',
        { className: 'inline-flex items-baseline font-mono tabular-nums' },
        currency && React.createElement(
            'span',
            { className: 'text-sm font-sm text-gray-500 mr-1' },
            currency
        ),
        React.createElement(
            'span',
            { className: 'text-xs font-semibold' },
            Number(price).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        )
    )
}

/**
 * 格式化价格字符串
 * @param price 价格字符串
 * @param currency 货币符号
 * @returns 格式化后的价格字符串
 */
export function formatPriceString(price: string, currency: string = ''): string {
    const formattedPrice = Number(price).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
    return currency ? `${currency}${formattedPrice}` : formattedPrice
}