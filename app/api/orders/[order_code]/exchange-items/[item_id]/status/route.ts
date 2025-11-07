// import { NextRequest, NextResponse } from 'next/server';

// import { logger } from '@/lib/logger';
// import { fetchRemoteData } from '@/lib/api-utils';

// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: Promise<{ order_code: string; item_id: string }> }
// ) {
//   const { order_code, item_id } = await params;

//   try {
//     const payload = await request.json();
//     logger.debug(JSON.stringify(payload));

//     const response = await fetchRemoteData({
//       endpoint: `/orders/${order_code}/update-exchange-item-actual`,
//       method: 'PATCH',
//       body: {
//         orderDetailId: parseInt(item_id),
//         actualQuantity: payload.actualQuantity || payload.quantity || 0,
//       },
//       needToken: true,
//       revalidate: 0,
//     });

//     if (!response.success) {
//       logger.error(`更新换货商品状态失败: ${response.error}`);
//       return NextResponse.json({ message: '更新换货商品状态失败' }, { status: response.status });
//     }

//     return NextResponse.json(response.data);
//   } catch (error) {
//     logger.error(`更新换货商品状态时出错: ${error}`);
//     return NextResponse.json({ message: '更新换货商品状态时出错' }, { status: 500 });
//   }
// }
