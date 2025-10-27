import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/src/lib/api/api-utils';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ org_name: string }> }
) {
    try {
        const { org_name } = await params;

        // Get request body
        const body = await request.json();

        const endpoint = `/tenants/${org_name}/prices/aprox_price`;

        // Use fetchRemoteData to call the remote API
        const response = await fetchRemoteData({
            endpoint,
            method: 'PATCH',
            body,
            needToken: true,
            tags: ['tenant-prices'],
            revalidate: 0 // No cache for PATCH requests
        });

        if (!response.success) {
            return NextResponse.json(
                { error: response.error || 'Failed to update product prices' },
                { status: response.status }
            );
        }

        return NextResponse.json(response.data);

    } catch (error) {
        console.error('Error in tenant prices API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}