import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,120}$/;

export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { fileId } = await context.params;
  if (!FILE_ID_REGEX.test(fileId)) {
    return new NextResponse('Invalid file ID', { status: 400 });
  }

  const url = new URL(request.url);
  const isDownload = url.searchParams.get('download') === '1';
  const rawName = url.searchParams.get('name') || 'bukti-home-visit.jpg';
  const safeName =
    rawName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) ||
    'bukti-home-visit.jpg';

  try {
    const driveRes = await fetch(
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`,
      {
        redirect: 'follow',
        headers: {
          'User-Agent': 'SiKAP-BK-Skanada/1.0',
        },
      }
    );

    if (!driveRes.ok) {
      return new NextResponse('Foto tidak ditemukan', {
        status: 404,
      });
    }

    const contentType = driveRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await driveRes.arrayBuffer();

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    };
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch {
    return new NextResponse('Gagal memuat foto', {
      status: 502,
    });
  }
}
