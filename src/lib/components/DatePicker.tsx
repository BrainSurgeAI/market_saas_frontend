'use client'

import { useState } from "react"
import { format, parse, startOfMonth, endOfMonth, isSameDay, isAfter, getDay, addDays } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon } from "@heroicons/react/24/outline"
import { Popover } from "@headlessui/react"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  format?: string
  placeholder?: string
  className?: string
}

/**
 * 日期选择器组件
 * @param props 组件属性
 * @returns 日期选择器组件
 */
export function DatePicker({
  value,
  onChange,
  format: dateFormat = 'yyyy-MM-dd',
  placeholder = '选择日期',
  className = ''
}: DatePickerProps) {
  // 日期相关的常量
  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

  // 解析日期并处理无效日期
  const parseDate = (dateStr: string) => {
    const parsedDate = parse(dateStr, dateFormat, new Date());
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const selectedDate = parseDate(value);
  const [viewDate, setViewDate] = useState(selectedDate);
  
  // 获取当月的第一天
  const firstDayOfMonth = startOfMonth(viewDate);
  // 获取当月的最后一天
  const lastDayOfMonth = endOfMonth(viewDate);
  // 获取当月第一天是星期几（0-6，0表示星期日）
  const firstDayOfWeek = getDay(firstDayOfMonth);
  
  // 创建日历网格数据
  const calendarDays: (Date | null)[] = [];
  
  // 添加上个月的日期填充
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // 添加当月的日期
  let currentDay = firstDayOfMonth;
  while (currentDay <= lastDayOfMonth) {
    calendarDays.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }
  
  // 添加下个月的日期填充，使总数为7的倍数
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      calendarDays.push(null);
    }
  }

  // 将日历天数分成每周一行
  const calendarWeeks: (Date | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    calendarWeeks.push(calendarDays.slice(i, i + 7));
  }

  // 格式化显示日期
  const displayDate = () => {
    try {
      return format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN });
    } catch {
      return format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });
    }
  };

  return (
    <Popover className={`relative ${className}`}>
      {({ close }) => (
        <>
          <Popover.Button className="w-full flex items-center justify-between px-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <span className="text-gray-700">{value ? displayDate() : placeholder}</span>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </Popover.Button>

          <Popover.Panel className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="space-y-4">
              {/* 月份导航 */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-sm font-medium">
                  {format(viewDate, 'yyyy年MM月', { locale: zhCN })}
                </h3>
                <button
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 星期标题 */}
              <div className="flex w-full">
                {WEEKDAYS.map((day, index) => (
                  <div key={index} className="flex-1 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日历网格 - 每周一行 */}
              <div className="space-y-1">
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="flex w-full">
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={`empty-${weekIndex}-${dayIndex}`} className="flex-1 h-8"></div>;
                      }
                      
                      const isSelected = isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());
                      const isFutureDate = isAfter(day, new Date());
                      const dateButtonProps = {
                        onClick: () => {
                          if (!isFutureDate) {
                            onChange(format(day, dateFormat));
                            close(); // 选择日期后关闭日期选择器
                          }
                        },
                        disabled: isFutureDate,
                        type: 'button' as const,
                        className: `
                          h-8 w-8 rounded-full flex items-center justify-center text-xs
                          ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                          ${isToday && !isSelected ? 'border border-blue-600 text-blue-600' : ''}
                          ${isFutureDate ? 'text-gray-300 cursor-not-allowed hover:bg-white' : ''}
                        `
                      };
                      
                      return (
                        <div key={`day-${weekIndex}-${dayIndex}`} className="flex-1 flex justify-center">
                          <button {...dateButtonProps}>
                            {day.getDate()}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* 快捷按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    onChange(format(new Date(), dateFormat));
                    close(); // 选择"今天"后关闭日期选择器
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  type="button"
                >
                  今天
                </button>
              </div>
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
} 