// import { NextRequest, NextResponse } from 'next/server';
// import { logger } from '@/lib/logger';

// import { cookies } from 'next/headers';
// import { redirect } from 'next/navigation';

// export async function PATCH(request: NextRequest, { params }: { params: Promise<{  order_code: string }> }) {
//     const {  order_code } = await params;

//     const cookieStore = await cookies();
//     const token = cookieStore.get('auth-token')?.value;
//     if (!token) {
//         logger.warn('No token found');
//         redirect('/login');
//     }

//     try {
//         const body = await request.json();
//         logger.debug(`Processing order: ${JSON.stringify(body)}`);

//         const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/orders/${order_code}/preparing`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`,
//             },
//             body: JSON.stringify(body)
//         });

//         const data = await response.json();
//         if (!response.ok) {
//             logger.error(`Failed to process order: ${response.statusText}`);
//             return NextResponse.json({ message: data.message }, { status: data.code });
//         }

//         return NextResponse.json(data.data);
//     } catch (error) {
//         logger.error(`Failed to process order: ${error}`);
//         return NextResponse.json({ message: 'Failed to process order' }, { status: 500 });
//     }
// }