import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ org_name: string }> }
) {
    try {
        const { org_name } = await params;

        // Get request body
        const body = await request.json();

        // Validate request body
        const { status, products, remark } = body;

        if (!status || !products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request body. status and products array are required' },
                { status: 400 }
            );
        }

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be "approved" or "rejected"' },
                { status: 400 }
            );
        }

        const endpoint = `/tenants/${org_name}/prices/approve_price`;

        // Use fetchRemoteData to call the remote API
        const response = await fetchRemoteData({
            endpoint,
            method: 'PATCH',
            body: {
                status,
                products,
                remark: remark || ''
            },
            needToken: true,
            tags: ['tenant-prices', 'price-approvals'],
            revalidate: 0 // No cache for PATCH requests
        });

        if (!response.success) {
            return NextResponse.json(
                { error: response.error || 'Failed to approve/reject product prices' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully ${status} ${products.length} product(s)`,
            data: response.data
        });

    } catch (error) {
        console.error('Error in price approval API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}