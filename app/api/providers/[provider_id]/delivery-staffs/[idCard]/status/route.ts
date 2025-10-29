import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ provider_id: string, idCard: string }> }) {
    try {

        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) {
            logger.error('No token found redirect to login');
            redirect('/login');
        } 

        const { provider_id, idCard } = await params;

        const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/deliveries/${idCard}/status`;
        const response = await fetch(backendUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            logger.error('Update delivery staffs status error:', response);
            return NextResponse.json(
                { error: response.statusText },
                { status: response.status }
            );
        }

        return NextResponse.json(await response.json());

    } catch (error) {
        logger.error('Update delivery staffs status error:', error);
        return NextResponse.json(
            { error: '服务器错误，请稍后再试' },
            { status: 500 }
        );
    }
}