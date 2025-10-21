// 辅助函数
export const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };
  
  export const formatDeadline = (date: Date) => {
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return '已逾期';
    } else if (diffHours < 1) {
      return '不足1小时';
    } else if (diffHours < 24) {
      return `${diffHours}小时内`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  export const isUrgent = (date: Date) => {
    const now = new Date();
    return date.getTime() - now.getTime() < 3600000; // 1小时内
  };
  
  export const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  export const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'update': return 'bg-green-100 text-green-600';
      case 'alert': return 'bg-red-100 text-red-600';
      case 'task': return 'bg-blue-100 text-blue-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };