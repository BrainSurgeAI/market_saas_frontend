// 模拟数据
export const pendingTasks = [
    { id: 1, category: "蔬菜类", productCount: 24, market: "融链-军采服务中心", deadline: new Date(Date.now() + 3600000), status: "待报价" },
    { id: 2, category: "水果类", productCount: 18, market: "融链-军采服务中心", deadline: new Date(Date.now() + 7200000), status: "待报价" },
    { id: 3, category: "肉类", productCount: 12, market: "融链-军采服务中心", deadline: new Date(Date.now() + 1800000), status: "进行中" },
    { id: 4, category: "海鲜类", productCount: 15, market: "融链-军采服务中心", deadline: new Date(Date.now() - 1800000), status: "已逾期" },
  ];
  
  export const vegetablePriceData = [
    { date: '6/1', 白菜: 2.5, 土豆: 3.2, 西红柿: 4.8, 黄瓜: 3.5 },
    { date: '6/2', 白菜: 2.3, 土豆: 3.2, 西红柿: 4.5, 黄瓜: 3.6 },
    { date: '6/3', 白菜: 2.4, 土豆: 3.1, 西红柿: 4.3, 黄瓜: 3.8 },
    { date: '6/4', 白菜: 2.6, 土豆: 3.0, 西红柿: 4.2, 黄瓜: 3.7 },
    { date: '6/5', 白菜: 2.7, 土豆: 2.9, 西红柿: 4.0, 黄瓜: 3.5 },
    { date: '6/6', 白菜: 2.8, 土豆: 2.8, 西红柿: 3.8, 黄瓜: 3.4 },
    { date: '6/7', 白菜: 2.6, 土豆: 2.7, 西红柿: 3.9, 黄瓜: 3.3 },
  ];
  
  export const fruitPriceData = [
    { date: '6/1', 苹果: 5.5, 香蕉: 4.2, 橙子: 6.8, 葡萄: 12.5 },
    { date: '6/2', 苹果: 5.3, 香蕉: 4.2, 橙子: 6.5, 葡萄: 12.6 },
    { date: '6/3', 苹果: 5.4, 香蕉: 4.1, 橙子: 6.3, 葡萄: 12.8 },
    { date: '6/4', 苹果: 5.6, 香蕉: 4.0, 橙子: 6.2, 葡萄: 12.7 },
    { date: '6/5', 苹果: 5.7, 香蕉: 3.9, 橙子: 6.0, 葡萄: 12.5 },
    { date: '6/6', 苹果: 5.8, 香蕉: 3.8, 橙子: 5.8, 葡萄: 12.4 },
    { date: '6/7', 苹果: 5.6, 香蕉: 3.7, 橙子: 5.9, 葡萄: 12.3 },
  ];
  
  export const meatPriceData = [
    { date: '6/1', 猪肉: 22.5, 牛肉: 58.2, 羊肉: 62.8, 鸡肉: 18.5 },
    { date: '6/2', 猪肉: 22.3, 牛肉: 58.2, 羊肉: 62.5, 鸡肉: 18.6 },
    { date: '6/3', 猪肉: 22.4, 牛肉: 58.1, 羊肉: 62.3, 鸡肉: 18.8 },
    { date: '6/4', 猪肉: 22.6, 牛肉: 58.0, 羊肉: 62.2, 鸡肉: 18.7 },
    { date: '6/5', 猪肉: 22.7, 牛肉: 57.9, 羊肉: 62.0, 鸡肉: 18.5 },
    { date: '6/6', 猪肉: 22.8, 牛肉: 57.8, 羊肉: 61.8, 鸡肉: 18.4 },
    { date: '6/7', 猪肉: 22.6, 牛肉: 57.7, 羊肉: 61.9, 鸡肉: 18.3 },
  ];
  
  export const activities = [
    { id: 1, type: 'update', title: '价格更新完成', description: '已完成城东农贸市场蔬菜类价格更新', time: new Date(Date.now() - 1800000) },
    { id: 2, type: 'alert', title: '价格异常提醒', description: '西红柿价格较昨日上涨超过15%', time: new Date(Date.now() - 3600000) },
    { id: 3, type: 'task', title: '新任务分配', description: '您有一个新的肉类价格采集任务', time: new Date(Date.now() - 7200000) },
    { id: 4, type: 'system', title: '系统维护通知', description: '系统将于今晚22:00-23:00进行维护', time: new Date(Date.now() - 86400000) },
  ];