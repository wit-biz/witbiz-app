import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const promoterId = req.nextUrl.searchParams.get('id');

    if (!promoterId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de promotor requerido' 
      }, { status: 400 });
    }

    // Get promoter by ID
    const promoterDoc = await adminDb.collection('promoters').doc(promoterId).get();

    if (!promoterDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Promotor no encontrado' 
      }, { status: 404 });
    }

    const promoterData = promoterDoc.data();
    
    if (promoterData?.status !== 'Activo') {
      return NextResponse.json({ 
        success: false, 
        error: 'Promotor inactivo' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      promoter: {
        id: promoterDoc.id,
        name: promoterData.name,
        email: promoterData.email,
        phone: promoterData.phone,
        status: promoterData.status,
        accessCode: promoterData.accessCode,
        referredClients: promoterData.referredClients || 0,
        totalCommissions: promoterData.totalCommissions || 0,
        createdAt: promoterData.createdAt,
      }
    });

  } catch (error: any) {
    console.error('Promoter data error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error del servidor' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { promoterId, accessCode } = await req.json();

    if (!promoterId || !accessCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos' 
      }, { status: 400 });
    }

    if (accessCode.length !== 6 || !/^\d+$/.test(accessCode)) {
      return NextResponse.json({ 
        success: false, 
        error: 'El código debe ser de 6 dígitos numéricos' 
      }, { status: 400 });
    }

    // Update promoter access code
    await adminDb.collection('promoters').doc(promoterId).update({
      accessCode: accessCode,
    });

    return NextResponse.json({
      success: true,
      message: 'Código actualizado'
    });

  } catch (error: any) {
    console.error('Promoter update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error del servidor' 
    }, { status: 500 });
  }
}
