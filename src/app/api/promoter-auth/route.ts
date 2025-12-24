import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { accessCode } = await req.json();

    if (!accessCode || typeof accessCode !== 'string' || accessCode.length !== 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de acceso inválido' 
      }, { status: 400 });
    }

    // Query promoters collection for matching access code
    const promotersRef = adminDb.collection('promoters');
    const snapshot = await promotersRef
      .where('accessCode', '==', accessCode.trim())
      .where('status', '==', 'Activo')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código incorrecto o promotor inactivo' 
      }, { status: 401 });
    }

    const promoterDoc = snapshot.docs[0];
    const promoter = { id: promoterDoc.id, ...promoterDoc.data() };

    return NextResponse.json({
      success: true,
      promoter: {
        id: promoter.id,
        name: (promoter as any).name,
      }
    });

  } catch (error: any) {
    console.error('Promoter auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error del servidor' 
    }, { status: 500 });
  }
}
