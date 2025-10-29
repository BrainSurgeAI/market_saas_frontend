import { logger } from "@/lib/logger";
import { da } from "date-fns/locale";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider_id: string }> }) {
    try {

        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) {
            logger.error('No token found redirect to login');
            redirect('/login');
        } 

        const { provider_id } = await params;

        const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/deliveries`;
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip'
            }
        });

        if (!response.ok) {
            logger.error('Get delivery staffs error:', response);
            return NextResponse.json(
                { error: response.statusText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        logger.error('Get delivery staffs error:', error);
        return NextResponse.json(
            { error: '服务器错误，请稍后再试' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider_id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) {
            logger.error('No token found redirect to login');
            redirect('/login');
        } 

        const { provider_id } = await params;
        const body = await req.json();

        const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/deliveries`;
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) {
            logger.error('Add delivery staffs error:', data.code);
            return NextResponse.json(
                { error: data.message },
                { status: data.code }
            );
        }

        return NextResponse.json(data);    
    } catch (error) {
        logger.error('Add delivery staffs error:', error);
        return NextResponse.json(
            { error: '服务器错误，请稍后再试' },
            { status: 500 }
        );
    }
}