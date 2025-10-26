import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/src/lib/api/api-utils';

export async function POST(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;

        // Get request body
        const body = await request.json();

        const endpoint = `/users/${username}/product_prices`;

        // Use fetchRemoteData to call the remote API
        const response = await fetchRemoteData({
            endpoint,
            method: 'POST',
            body,
            needToken: true,
            tags: ['user-product-prices'],
            revalidate: 0 // No cache for POST requests
        });

        if (!response.success) {
            return NextResponse.json(
                { error: response.error || 'Failed to submit product prices' },
                { status: response.status }
            );
        }

        return NextResponse.json(response.data);

    } catch (error) {
        console.error('Error in user product prices API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}