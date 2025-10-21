// 定义日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

// 日志级别权重映射
const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

// 默认日志级别，可以从环境变量中读取
const DEFAULT_LOG_LEVEL: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';

// 当前日志级别
let currentLogLevel: LogLevel = DEFAULT_LOG_LEVEL;

// 日志工具
export const logger = {
  // 设置日志级别的方法
  setLevel: (level: LogLevel) => {
    currentLogLevel = level;
    logger.info(`Logger level set to: ${level}`);
  },
  
  // 获取当前日志级别
  getLevel: (): LogLevel => {
    return currentLogLevel;
  },
  
  // 判断给定级别是否应该被记录
  shouldLog: (level: LogLevel): boolean => {
    return LOG_LEVEL_WEIGHT[level] >= LOG_LEVEL_WEIGHT[currentLogLevel];
  },
  
  // 日志方法
  debug: (message: string) => {
    if (logger.shouldLog('debug')) {
      const timestamp = new Date().toISOString();
      process.stdout.write(`${timestamp} [DEBUG] ${message}\n`);
    }
  },
  
  info: (message: string) => {
    if (logger.shouldLog('info')) {
      const timestamp = new Date().toISOString();
      process.stdout.write(`${timestamp} [INFO] ${message}\n`);
    }
  },
  
  warn: (message: string) => {
    if (logger.shouldLog('warn')) {
      const timestamp = new Date().toISOString();
      process.stdout.write(`${timestamp} [WARN] ${message}\n`);
    }
  },
  
  error: (message: string, error?: any) => {
    if (logger.shouldLog('error')) {
      const timestamp = new Date().toISOString();
      process.stdout.write(`${timestamp} [ERROR] ${message}\n`);
      if (error) {
        process.stdout.write(`${timestamp} [ERROR] ${JSON.stringify(error)}\n`);
      }
    }
  }
};