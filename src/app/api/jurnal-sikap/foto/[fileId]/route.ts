import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,120}$/;

export async function GET(
  _request: Request,
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
      return new NextResponse('Foto tidak ditemukan di Google Drive', {
        status: 404,
      });
    }

    const contentType = driveRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await driveRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Gagal memuat foto dari Google Drive', {
      status: 502,
    });
  }
}
