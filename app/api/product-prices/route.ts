import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '1';
        const page_size = searchParams.get('page_size') || '10';
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        // Build query parameters for the backend API
        const queryParams = new URLSearchParams({
            page,
            page_size,
            ...(search && { search }),
            ...(category && { category })
        });

        const endpoint = `/product_prices?${queryParams.toString()}`;

        console.log('API Route - Calling endpoint:', endpoint);

        // Use fetchRemoteData to call the remote API
        const response = await fetchRemoteData({
            endpoint,
            method: 'GET',
            tags: ['product-prices']
        });

        console.log('API Route - Response:', response);

        if (!response.success) {
            console.error('API Route - Error response:', response);
            return NextResponse.json(
                { error: response.error || 'Failed to fetch product prices' },
                { status: response.status }
            );
        }

        console.log('API Route - Success, returning data:', response.data);
        return NextResponse.json(response.data);

    } catch (error) {
        console.error('Error in product prices API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}