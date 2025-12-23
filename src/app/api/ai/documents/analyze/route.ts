import { NextRequest, NextResponse } from "next/server";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { lookup as lookupMimeType } from "mime-types";
import { FieldValue } from "firebase-admin/firestore";
import { parseStringPromise } from "xml2js";

import { adminAuth, adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { documentAIConfig } from "@/ai/config";
import { firebaseConfig } from "@/firebase/config";

// Get Document AI client with service account credentials
function getDocumentAIClient(): DocumentProcessorServiceClient {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountJson) {
    try {
      let cleanJson = serviceAccountJson.trim();
      const jsonStart = cleanJson.indexOf('{');
      if (jsonStart > 0) {
        cleanJson = cleanJson.substring(jsonStart);
      }
      const credentials = JSON.parse(cleanJson);
      
      return new DocumentProcessorServiceClient({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        projectId: credentials.project_id,
      });
    } catch (e) {
      console.error("Failed to parse service account for Document AI:", e);
    }
  }
  
  // Fallback to default credentials (will fail without GOOGLE_APPLICATION_CREDENTIALS)
  return new DocumentProcessorServiceClient();
}

type AnalyzeRequestBody = {
  docId: string;
};

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

async function requireAuth(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return NextResponse.json({ error: "invalid_auth" }, { status: 401 });
  }
}

function pickProcessorKey(input: { documentType?: string; fileName?: string }) {
  const t = (input.documentType || "").toLowerCase();
  const n = (input.fileName || "").toLowerCase();

  // Facturas
  if (t.includes("factura") || n.includes("factura") || n.includes("invoice") || n.includes("cfdi")) return "invoice";
  // Estados de cuenta
  if (n.includes("estado") || n.includes("statement") || n.includes("cuenta")) return "bankStatement";
  // Recibos y gastos
  if (n.includes("recibo") || n.includes("ticket") || t.includes("gasto") || n.includes("pago") || n.includes("comprobante")) return "expense";
  // Contratos y formularios
  if (t.includes("contrato") || n.includes("contrato")) return "form";

  // Default: usar invoice para mejor extracción de datos estructurados
  return "invoice";
}

function getEntityText(entity: any): string | undefined {
  if (!entity) return undefined;
  const normalized = entity.normalizedValue;
  const normalizedText = normalized?.text || normalized?.moneyValue?.amount;
  if (normalizedText !== undefined && normalizedText !== null) return String(normalizedText);
  if (entity.mentionText) return String(entity.mentionText);
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// XML/CFDI PARSING (Mexican Electronic Invoices)
// ═══════════════════════════════════════════════════════════════════════════

async function parseXMLDocument(xmlContent: string): Promise<any> {
  try {
    const result = await parseStringPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [(name) => name.replace(/^.*:/, '')], // Remove namespace prefixes
    });
    return result;
  } catch (e) {
    console.error("Error parsing XML:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CFDI EXTRACTION - COMPLETE SPECIFICATION (150+ FIELDS)
// ═══════════════════════════════════════════════════════════════════════════

interface CFDIExtraction {
  // I. IDENTIFICACIÓN Y VERSIONAMIENTO
  cfdi_version?: string;
  cfdi_tipo_comprobante_clave?: string;
  cfdi_tipo_comprobante_descripcion?: string;
  cfdi_serie?: string;
  cfdi_folio?: string;
  cfdi_fecha_emision?: string;
  cfdi_hora_emision?: string;
  cfdi_lugar_expedicion_cp?: string;
  cfdi_exportacion_clave?: string;
  cfdi_exportacion_descripcion?: string;
  cfdi_confirmacion?: string;
  cfdi_no_certificado?: string;
  cfdi_sello?: string;
  cfdi_leyenda_sat?: string;

  // II. IMPORTES Y CONDICIONES
  cfdi_subtotal?: number;
  cfdi_descuento?: number;
  cfdi_total?: number;
  cfdi_moneda_clave?: string;
  cfdi_moneda_descripcion?: string;
  cfdi_tipo_cambio?: number;
  cfdi_total_letra?: string;
  cfdi_condiciones_pago?: string;
  cfdi_leyenda?: string;

  // III. EMISOR
  emisor_rfc?: string;
  emisor_nombre?: string;
  emisor_regimen_fiscal_clave?: string;
  emisor_regimen_fiscal_descripcion?: string;
  emisor_domicilio_fiscal_cp?: string;
  emisor_residencia_fiscal?: string;
  emisor_num_reg_id_trib?: string;
  emisor_tipo_persona?: string;

  // IV. RECEPTOR
  receptor_rfc?: string;
  receptor_nombre?: string;
  receptor_domicilio_fiscal_cp?: string;
  receptor_domicilio_completo?: string;
  receptor_regimen_fiscal_clave?: string;
  receptor_regimen_fiscal_descripcion?: string;
  receptor_uso_cfdi_clave?: string;
  receptor_uso_cfdi_descripcion?: string;
  receptor_residencia_fiscal?: string;
  receptor_num_reg_id_trib?: string;
  receptor_tipo_persona?: string;

  // V. INFORMACIÓN DE PAGO
  pago_forma_clave?: string;
  pago_forma_descripcion?: string;
  pago_metodo_clave?: string;
  pago_metodo_descripcion?: string;
  pago_fecha?: string;
  pago_moneda?: string;
  pago_tipo_cambio?: number;
  pago_monto?: number;

  // VI. CONCEPTOS
  conceptos?: CFDIConcepto[];
  conceptos_count?: number;

  // VII. IMPUESTOS GLOBALES
  impuesto_trasladado_base?: number;
  impuesto_trasladado_impuesto_clave?: string;
  impuesto_trasladado_tipo_factor?: string;
  impuesto_trasladado_tasa_o_cuota?: number;
  impuesto_trasladado_importe?: number;
  impuesto_retenido_impuesto_clave?: string;
  impuesto_retenido_importe?: number;
  total_impuestos_trasladados?: number;
  total_impuestos_retenidos?: number;

  // VIII. CFDI RELACIONADOS
  cfdi_relacion_tipo_clave?: string;
  cfdi_relacion_tipo_descripcion?: string;
  cfdi_relacion_uuid?: string;

  // IX. TIMBRADO FISCAL
  timbre_uuid?: string;
  timbre_fecha_timbrado?: string;
  timbre_rfc_proveedor_certificacion?: string;
  timbre_no_certificado_sat?: string;
  timbre_sello_cfdi?: string;
  timbre_sello_sat?: string;
  timbre_cadena_original?: string;

  // X. CICLO DE VIDA
  cfdi_estatus_sat?: string;
  cfdi_estatus_cancelacion?: string;
  cfdi_fecha_cancelacion?: string;
  cfdi_motivo_cancelacion_clave?: string;
  cfdi_motivo_cancelacion_descripcion?: string;
  cfdi_uuid_sustitucion?: string;

  // XI. COMPLEMENTOS
  complemento_pagos_version?: string;
  complemento_nomina?: any;
  complemento_comercio_exterior?: any;
  complemento_carta_porte?: any;

  // Legacy compatibility fields
  supplierName?: string;
  supplierTaxId?: string;
  receiverName?: string;
  receiverTaxId?: string;
  invoiceId?: string;
  date?: string;
  totalAmount?: number;
  netAmount?: number;
  totalTaxAmount?: number;
  currency?: string;
  primaryAmount?: number;
  lineItems?: any[];
  lineItemsCount?: number;
  fullText?: string;
  rawEntities?: any[];
  totalEntitiesFound?: number;
}

interface CFDIConcepto {
  concepto_numero_linea: number;
  concepto_clave_producto_sat?: string;
  concepto_descripcion?: string;
  concepto_cantidad?: number;
  concepto_clave_unidad_sat?: string;
  concepto_unidad_descripcion?: string;
  concepto_valor_unitario?: number;
  concepto_importe?: number;
  concepto_descuento?: number;
  concepto_objeto_impuesto_clave?: string;
  concepto_objeto_impuesto_descripcion?: string;
  // Impuestos por concepto
  concepto_impuesto_trasladado_base?: number;
  concepto_impuesto_trasladado_impuesto_clave?: string;
  concepto_impuesto_trasladado_tipo_factor?: string;
  concepto_impuesto_trasladado_tasa_o_cuota?: number;
  concepto_impuesto_trasladado_importe?: number;
  concepto_impuesto_retenido_base?: number;
  concepto_impuesto_retenido_impuesto_clave?: string;
  concepto_impuesto_retenido_tasa_o_cuota?: number;
  concepto_impuesto_retenido_importe?: number;
}

// Catálogos SAT para descripciones
const TIPO_COMPROBANTE: Record<string, string> = {
  'I': 'Ingreso', 'E': 'Egreso', 'P': 'Pago', 'N': 'Nómina', 'T': 'Traslado'
};

const FORMA_PAGO: Record<string, string> = {
  '01': 'Efectivo', '02': 'Cheque nominativo', '03': 'Transferencia electrónica',
  '04': 'Tarjeta de crédito', '05': 'Monedero electrónico', '06': 'Dinero electrónico',
  '08': 'Vales de despensa', '12': 'Dación en pago', '13': 'Pago por subrogación',
  '14': 'Pago por consignación', '15': 'Condonación', '17': 'Compensación',
  '23': 'Novación', '24': 'Confusión', '25': 'Remisión de deuda',
  '26': 'Prescripción o caducidad', '27': 'A satisfacción del acreedor',
  '28': 'Tarjeta de débito', '29': 'Tarjeta de servicios', '30': 'Aplicación de anticipos',
  '31': 'Intermediario pagos', '99': 'Por definir'
};

const METODO_PAGO: Record<string, string> = {
  'PUE': 'Pago en una sola exhibición', 'PPD': 'Pago en parcialidades o diferido'
};

const USO_CFDI: Record<string, string> = {
  'G01': 'Adquisición de mercancías', 'G02': 'Devoluciones, descuentos o bonificaciones',
  'G03': 'Gastos en general', 'I01': 'Construcciones', 'I02': 'Mobiliario y equipo de oficina',
  'I03': 'Equipo de transporte', 'I04': 'Equipo de cómputo', 'I05': 'Dados, troqueles, moldes',
  'I06': 'Comunicaciones telefónicas', 'I07': 'Comunicaciones satelitales', 'I08': 'Otra maquinaria',
  'D01': 'Honorarios médicos', 'D02': 'Gastos médicos por incapacidad', 'D03': 'Gastos funerales',
  'D04': 'Donativos', 'D05': 'Intereses hipotecarios', 'D06': 'Aportaciones voluntarias SAR',
  'D07': 'Primas de seguros', 'D08': 'Gastos de transportación escolar',
  'D09': 'Depósitos cuentas de ahorro', 'D10': 'Pagos por servicios educativos',
  'S01': 'Sin efectos fiscales', 'CP01': 'Pagos', 'CN01': 'Nómina'
};

const REGIMEN_FISCAL: Record<string, string> = {
  '601': 'General de Ley Personas Morales', '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios', '606': 'Arrendamiento', '607': 'Régimen de Enajenación',
  '608': 'Demás ingresos', '610': 'Residentes en el Extranjero', '611': 'Ingresos por Dividendos',
  '612': 'Personas Físicas con Actividades Empresariales', '614': 'Ingresos por intereses',
  '615': 'Régimen de los ingresos por obtención de premios', '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Producción', '621': 'Incorporación Fiscal',
  '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', '623': 'Opcional para Grupos',
  '624': 'Coordinados', '625': 'Régimen Simplificado de Confianza', '626': 'RESICO Personas Morales'
};

function extractFieldsFromXML(xmlData: any): CFDIExtraction {
  // Navigate through possible CFDI structures (handle namespaces)
  const root = xmlData?.Comprobante || xmlData?.comprobante || 
               xmlData?.['cfdi:Comprobante'] || xmlData;
  const attrs = root?.$ || root;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EMISOR
  // ═══════════════════════════════════════════════════════════════════════════
  const emisor = root?.Emisor || root?.emisor || root?.['cfdi:Emisor'];
  const emisorAttrs = emisor?.$ || emisor || {};
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RECEPTOR
  // ═══════════════════════════════════════════════════════════════════════════
  const receptor = root?.Receptor || root?.receptor || root?.['cfdi:Receptor'];
  const receptorAttrs = receptor?.$ || receptor || {};
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONCEPTOS
  // ═══════════════════════════════════════════════════════════════════════════
  const conceptosNode = root?.Conceptos || root?.conceptos || root?.['cfdi:Conceptos'];
  const conceptosRaw = conceptosNode?.Concepto || conceptosNode?.concepto || 
                       conceptosNode?.['cfdi:Concepto'] || [];
  const conceptosArray = Array.isArray(conceptosRaw) ? conceptosRaw : [conceptosRaw].filter(Boolean);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPUESTOS
  // ═══════════════════════════════════════════════════════════════════════════
  const impuestos = root?.Impuestos || root?.impuestos || root?.['cfdi:Impuestos'];
  const impuestosAttrs = impuestos?.$ || impuestos || {};
  const traslados = impuestos?.Traslados?.Traslado || impuestos?.['cfdi:Traslados']?.['cfdi:Traslado'];
  const retenciones = impuestos?.Retenciones?.Retencion || impuestos?.['cfdi:Retenciones']?.['cfdi:Retencion'];
  const trasladoAttrs = (Array.isArray(traslados) ? traslados[0] : traslados)?.$ || traslados || {};
  const retencionAttrs = (Array.isArray(retenciones) ? retenciones[0] : retenciones)?.$ || retenciones || {};
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLEMENTO Y TIMBRE
  // ═══════════════════════════════════════════════════════════════════════════
  const complemento = root?.Complemento || root?.complemento || root?.['cfdi:Complemento'];
  const timbre = complemento?.TimbreFiscalDigital || complemento?.['tfd:TimbreFiscalDigital'] ||
                 complemento?.timbrefiscaldigital;
  const timbreAttrs = timbre?.$ || timbre || {};
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CFDI RELACIONADOS
  // ═══════════════════════════════════════════════════════════════════════════
  const cfdiRelacionados = root?.CfdiRelacionados || root?.['cfdi:CfdiRelacionados'];
  const cfdiRelacionadosAttrs = cfdiRelacionados?.$ || {};
  const cfdiRelacionado = cfdiRelacionados?.CfdiRelacionado || cfdiRelacionados?.['cfdi:CfdiRelacionado'];
  const cfdiRelacionadoAttrs = (Array.isArray(cfdiRelacionado) ? cfdiRelacionado[0] : cfdiRelacionado)?.$ || cfdiRelacionado || {};

  // ═══════════════════════════════════════════════════════════════════════════
  // PARSE VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  const tipoComprobante = attrs?.TipoDeComprobante || attrs?.tipodecomprobante || '';
  const formaPago = attrs?.FormaPago || attrs?.formapago || '';
  const metodoPago = attrs?.MetodoPago || attrs?.metodopago || '';
  const usoCFDI = receptorAttrs?.UsoCFDI || receptorAttrs?.usocfdi || '';
  const regimenEmisor = emisorAttrs?.RegimenFiscal || emisorAttrs?.regimenfiscal || '';
  const regimenReceptor = receptorAttrs?.RegimenFiscalReceptor || receptorAttrs?.regimenfiscalreceptor || '';
  
  // Parse fecha/hora
  const fechaCompleta = attrs?.Fecha || attrs?.fecha || '';
  const [fechaEmision, horaEmision] = fechaCompleta.includes('T') 
    ? fechaCompleta.split('T') 
    : [fechaCompleta, ''];

  // Parse conceptos completos
  const conceptos: CFDIConcepto[] = conceptosArray.map((concepto: any, index: number) => {
    const c = concepto?.$ || concepto || {};
    const impConcepto = concepto?.Impuestos || concepto?.['cfdi:Impuestos'];
    const trasConcepto = impConcepto?.Traslados?.Traslado || impConcepto?.['cfdi:Traslados']?.['cfdi:Traslado'];
    const retConcepto = impConcepto?.Retenciones?.Retencion || impConcepto?.['cfdi:Retenciones']?.['cfdi:Retencion'];
    const trasC = (Array.isArray(trasConcepto) ? trasConcepto[0] : trasConcepto)?.$ || trasConcepto || {};
    const retC = (Array.isArray(retConcepto) ? retConcepto[0] : retConcepto)?.$ || retConcepto || {};

    return {
      concepto_numero_linea: index + 1,
      concepto_clave_producto_sat: c?.ClaveProdServ || c?.claveprodserv,
      concepto_descripcion: c?.Descripcion || c?.descripcion,
      concepto_cantidad: parseFloat(c?.Cantidad || c?.cantidad) || undefined,
      concepto_clave_unidad_sat: c?.ClaveUnidad || c?.claveunidad,
      concepto_unidad_descripcion: c?.Unidad || c?.unidad,
      concepto_valor_unitario: parseFloat(c?.ValorUnitario || c?.valorunitario) || undefined,
      concepto_importe: parseFloat(c?.Importe || c?.importe) || undefined,
      concepto_descuento: parseFloat(c?.Descuento || c?.descuento) || undefined,
      concepto_objeto_impuesto_clave: c?.ObjetoImp || c?.objetoimp,
      concepto_impuesto_trasladado_base: parseFloat(trasC?.Base || trasC?.base) || undefined,
      concepto_impuesto_trasladado_impuesto_clave: trasC?.Impuesto || trasC?.impuesto,
      concepto_impuesto_trasladado_tipo_factor: trasC?.TipoFactor || trasC?.tipofactor,
      concepto_impuesto_trasladado_tasa_o_cuota: parseFloat(trasC?.TasaOCuota || trasC?.tasaocuota) || undefined,
      concepto_impuesto_trasladado_importe: parseFloat(trasC?.Importe || trasC?.importe) || undefined,
      concepto_impuesto_retenido_base: parseFloat(retC?.Base || retC?.base) || undefined,
      concepto_impuesto_retenido_impuesto_clave: retC?.Impuesto || retC?.impuesto,
      concepto_impuesto_retenido_tasa_o_cuota: parseFloat(retC?.TasaOCuota || retC?.tasaocuota) || undefined,
      concepto_impuesto_retenido_importe: parseFloat(retC?.Importe || retC?.importe) || undefined,
    };
  });

  // Parse amounts
  const subtotal = parseFloat(attrs?.SubTotal || attrs?.subtotal || '0') || undefined;
  const descuento = parseFloat(attrs?.Descuento || attrs?.descuento || '0') || undefined;
  const total = parseFloat(attrs?.Total || attrs?.total || '0') || undefined;
  const tipoCambio = parseFloat(attrs?.TipoCambio || attrs?.tipocambio || '1') || undefined;
  const moneda = (attrs?.Moneda || attrs?.moneda || 'MXN').toUpperCase();

  // Build full extraction
  const extraction: CFDIExtraction = {
    // ═══════════════════════════════════════════════════════════════════════
    // I. IDENTIFICACIÓN Y VERSIONAMIENTO
    // ═══════════════════════════════════════════════════════════════════════
    cfdi_version: attrs?.Version || attrs?.version,
    cfdi_tipo_comprobante_clave: tipoComprobante,
    cfdi_tipo_comprobante_descripcion: TIPO_COMPROBANTE[tipoComprobante] || tipoComprobante,
    cfdi_serie: attrs?.Serie || attrs?.serie,
    cfdi_folio: attrs?.Folio || attrs?.folio,
    cfdi_fecha_emision: fechaEmision,
    cfdi_hora_emision: horaEmision,
    cfdi_lugar_expedicion_cp: attrs?.LugarExpedicion || attrs?.lugarexpedicion,
    cfdi_exportacion_clave: attrs?.Exportacion || attrs?.exportacion,
    cfdi_exportacion_descripcion: attrs?.Exportacion === '01' ? 'No aplica' : attrs?.Exportacion === '02' ? 'Definitiva' : attrs?.Exportacion === '03' ? 'Temporal' : attrs?.Exportacion,
    cfdi_confirmacion: attrs?.Confirmacion || attrs?.confirmacion,
    cfdi_no_certificado: attrs?.NoCertificado || attrs?.nocertificado,
    cfdi_sello: attrs?.Sello || attrs?.sello,
    cfdi_leyenda_sat: 'Este documento es una representación impresa de un CFDI',

    // ═══════════════════════════════════════════════════════════════════════
    // II. IMPORTES Y CONDICIONES
    // ═══════════════════════════════════════════════════════════════════════
    cfdi_subtotal: subtotal,
    cfdi_descuento: descuento,
    cfdi_total: total,
    cfdi_moneda_clave: moneda,
    cfdi_moneda_descripcion: moneda === 'MXN' ? 'Peso Mexicano' : moneda === 'USD' ? 'Dólar' : moneda,
    cfdi_tipo_cambio: tipoCambio,
    cfdi_condiciones_pago: attrs?.CondicionesDePago || attrs?.condicionesdepago,

    // ═══════════════════════════════════════════════════════════════════════
    // III. EMISOR
    // ═══════════════════════════════════════════════════════════════════════
    emisor_rfc: emisorAttrs?.Rfc || emisorAttrs?.rfc,
    emisor_nombre: emisorAttrs?.Nombre || emisorAttrs?.nombre,
    emisor_regimen_fiscal_clave: regimenEmisor,
    emisor_regimen_fiscal_descripcion: REGIMEN_FISCAL[regimenEmisor] || regimenEmisor,
    emisor_domicilio_fiscal_cp: emisorAttrs?.DomicilioFiscal || emisorAttrs?.domiciliofiscal || 
                                 attrs?.LugarExpedicion || attrs?.lugarexpedicion,
    emisor_residencia_fiscal: emisorAttrs?.ResidenciaFiscal,
    emisor_num_reg_id_trib: emisorAttrs?.NumRegIdTrib,
    emisor_tipo_persona: (emisorAttrs?.Rfc || '').length === 12 ? 'Moral' : 'Física',

    // ═══════════════════════════════════════════════════════════════════════
    // IV. RECEPTOR
    // ═══════════════════════════════════════════════════════════════════════
    receptor_rfc: receptorAttrs?.Rfc || receptorAttrs?.rfc,
    receptor_nombre: receptorAttrs?.Nombre || receptorAttrs?.nombre,
    receptor_domicilio_fiscal_cp: receptorAttrs?.DomicilioFiscalReceptor || receptorAttrs?.domiciliofiscalreceptor,
    receptor_regimen_fiscal_clave: regimenReceptor,
    receptor_regimen_fiscal_descripcion: REGIMEN_FISCAL[regimenReceptor] || regimenReceptor,
    receptor_uso_cfdi_clave: usoCFDI,
    receptor_uso_cfdi_descripcion: USO_CFDI[usoCFDI] || usoCFDI,
    receptor_residencia_fiscal: receptorAttrs?.ResidenciaFiscal,
    receptor_num_reg_id_trib: receptorAttrs?.NumRegIdTrib,
    receptor_tipo_persona: (receptorAttrs?.Rfc || '').length === 12 ? 'Moral' : 'Física',

    // ═══════════════════════════════════════════════════════════════════════
    // V. INFORMACIÓN DE PAGO
    // ═══════════════════════════════════════════════════════════════════════
    pago_forma_clave: formaPago,
    pago_forma_descripcion: FORMA_PAGO[formaPago] || formaPago,
    pago_metodo_clave: metodoPago,
    pago_metodo_descripcion: METODO_PAGO[metodoPago] || metodoPago,

    // ═══════════════════════════════════════════════════════════════════════
    // VI. CONCEPTOS
    // ═══════════════════════════════════════════════════════════════════════
    conceptos: conceptos.length > 0 ? conceptos : undefined,
    conceptos_count: conceptos.length || undefined,

    // ═══════════════════════════════════════════════════════════════════════
    // VII. IMPUESTOS GLOBALES
    // ═══════════════════════════════════════════════════════════════════════
    impuesto_trasladado_base: parseFloat(trasladoAttrs?.Base || trasladoAttrs?.base) || undefined,
    impuesto_trasladado_impuesto_clave: trasladoAttrs?.Impuesto || trasladoAttrs?.impuesto,
    impuesto_trasladado_tipo_factor: trasladoAttrs?.TipoFactor || trasladoAttrs?.tipofactor,
    impuesto_trasladado_tasa_o_cuota: parseFloat(trasladoAttrs?.TasaOCuota || trasladoAttrs?.tasaocuota) || undefined,
    impuesto_trasladado_importe: parseFloat(trasladoAttrs?.Importe || trasladoAttrs?.importe) || undefined,
    impuesto_retenido_impuesto_clave: retencionAttrs?.Impuesto || retencionAttrs?.impuesto,
    impuesto_retenido_importe: parseFloat(retencionAttrs?.Importe || retencionAttrs?.importe) || undefined,
    total_impuestos_trasladados: parseFloat(impuestosAttrs?.TotalImpuestosTrasladados || impuestosAttrs?.totalimpuestostrasladados) || undefined,
    total_impuestos_retenidos: parseFloat(impuestosAttrs?.TotalImpuestosRetenidos || impuestosAttrs?.totalimpuestosretenidos) || undefined,

    // ═══════════════════════════════════════════════════════════════════════
    // VIII. CFDI RELACIONADOS
    // ═══════════════════════════════════════════════════════════════════════
    cfdi_relacion_tipo_clave: cfdiRelacionadosAttrs?.TipoRelacion,
    cfdi_relacion_uuid: cfdiRelacionadoAttrs?.UUID || cfdiRelacionadoAttrs?.uuid,

    // ═══════════════════════════════════════════════════════════════════════
    // IX. TIMBRADO FISCAL
    // ═══════════════════════════════════════════════════════════════════════
    timbre_uuid: timbreAttrs?.UUID || timbreAttrs?.uuid,
    timbre_fecha_timbrado: timbreAttrs?.FechaTimbrado || timbreAttrs?.fechatimbrado,
    timbre_rfc_proveedor_certificacion: timbreAttrs?.RfcProvCertif || timbreAttrs?.rfcprovcertif,
    timbre_no_certificado_sat: timbreAttrs?.NoCertificadoSAT || timbreAttrs?.nocertificadosat,
    timbre_sello_cfdi: timbreAttrs?.SelloCFD || timbreAttrs?.sellocfd,
    timbre_sello_sat: timbreAttrs?.SelloSAT || timbreAttrs?.sellosat,

    // ═══════════════════════════════════════════════════════════════════════
    // LEGACY COMPATIBILITY (for existing UI)
    // ═══════════════════════════════════════════════════════════════════════
    supplierName: emisorAttrs?.Nombre || emisorAttrs?.nombre,
    supplierTaxId: emisorAttrs?.Rfc || emisorAttrs?.rfc,
    receiverName: receptorAttrs?.Nombre || receptorAttrs?.nombre,
    receiverTaxId: receptorAttrs?.Rfc || receptorAttrs?.rfc,
    invoiceId: timbreAttrs?.UUID || timbreAttrs?.uuid || attrs?.Folio || attrs?.folio,
    date: fechaEmision,
    totalAmount: total,
    netAmount: subtotal,
    totalTaxAmount: parseFloat(impuestosAttrs?.TotalImpuestosTrasladados || '0') || undefined,
    currency: moneda,
    primaryAmount: total,
    lineItems: conceptos.map(c => ({
      description: c.concepto_descripcion,
      quantity: c.concepto_cantidad,
      unit: c.concepto_unidad_descripcion,
      unit_price: c.concepto_valor_unitario,
      amount: c.concepto_importe,
      product_code: c.concepto_clave_producto_sat,
    })),
    lineItemsCount: conceptos.length || undefined,
    fullText: `CFDI ${tipoComprobante} - ${emisorAttrs?.Nombre || ''} - $${total || 0} ${moneda}`,
    rawEntities: [],
    totalEntitiesFound: 0,
  };

  return extraction;
}

function detectCurrencyFromText(text: string): string | undefined {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return undefined;

  if (
    t.includes(" mxn") ||
    t.includes("mxn ") ||
    t.includes("pesos") ||
    t.includes("peso") ||
    t.includes("m.n") ||
    t.includes("moneda nacional")
  ) {
    return "MXN";
  }

  if (
    t.includes(" usd") ||
    t.includes("usd ") ||
    t.includes("us$") ||
    t.includes("dolar") ||
    t.includes("dólar")
  ) {
    return "USD";
  }

  if (t.includes(" eur") || t.includes("eur ") || t.includes("€") || t.includes("euro")) {
    return "EUR";
  }

  return undefined;
}

function parseAmount(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const cleaned = String(text).replace(/[^0-9.-]+/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

// Extract line items from Document AI entities
function extractLineItems(entities: any[]): any[] {
  const lineItems: any[] = [];
  const lineItemEntities = entities.filter(e => 
    String(e.type || "").toLowerCase() === "line_item" ||
    String(e.type || "").toLowerCase() === "table_item"
  );

  for (const item of lineItemEntities) {
    const properties = item.properties || [];
    const lineItem: any = {};
    
    for (const prop of properties) {
      const propType = String(prop.type || "").toLowerCase().replace("line_item/", "").replace("table_item/", "");
      const propValue = getEntityText(prop);
      if (propValue) {
        lineItem[propType] = propValue;
      }
    }
    
    if (Object.keys(lineItem).length > 0) {
      lineItems.push(lineItem);
    }
  }

  return lineItems;
}

// Extract VAT/tax details from Document AI entities
function extractVatDetails(entities: any[]): any[] {
  const vatItems: any[] = [];
  const vatEntities = entities.filter(e => 
    String(e.type || "").toLowerCase() === "vat"
  );

  for (const item of vatEntities) {
    const properties = item.properties || [];
    const vatItem: any = {};
    
    for (const prop of properties) {
      const propType = String(prop.type || "").toLowerCase().replace("vat/", "");
      const propValue = getEntityText(prop);
      if (propValue) {
        vatItem[propType] = propValue;
      }
    }
    
    if (Object.keys(vatItem).length > 0) {
      vatItems.push(vatItem);
    }
  }

  return vatItems;
}

function extractFields(doc: any) {
  const entities: any[] = Array.isArray(doc?.entities) ? doc.entities : [];
  const byType = new Map<string, any>();
  const fullText = doc?.text || "";

  // Log all entities for debugging
  console.log("📋 Document AI Entities:", entities.length);
  for (const e of entities) {
    const type = String(e.type || "").toLowerCase();
    const text = getEntityText(e);
    console.log(`  - ${type}: ${text}`);
    if (!type) continue;
    if (!byType.has(type)) byType.set(type, e);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE PARSER FIELDS (COMPLETE)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Supplier/Vendor Information
  const supplierName = getEntityText(byType.get("supplier_name")) 
    || getEntityText(byType.get("vendor_name"))
    || getEntityText(byType.get("remit_to_name"));
  const supplierAddress = getEntityText(byType.get("supplier_address"))
    || getEntityText(byType.get("vendor_address"))
    || getEntityText(byType.get("remit_to_address"));
  const supplierEmail = getEntityText(byType.get("supplier_email"));
  const supplierPhone = getEntityText(byType.get("supplier_phone"));
  const supplierWebsite = getEntityText(byType.get("supplier_website"));
  const supplierTaxId = getEntityText(byType.get("supplier_tax_id"));
  const supplierIban = getEntityText(byType.get("supplier_iban"));
  const supplierRegistration = getEntityText(byType.get("supplier_registration"));
  const supplierPaymentRef = getEntityText(byType.get("supplier_payment_ref"));
  const supplierCity = getEntityText(byType.get("supplier_city"));

  // Receiver/Customer Information
  const receiverName = getEntityText(byType.get("receiver_name"))
    || getEntityText(byType.get("ship_to_name"))
    || getEntityText(byType.get("client_name"));
  const receiverAddress = getEntityText(byType.get("receiver_address"))
    || getEntityText(byType.get("ship_to_address"))
    || getEntityText(byType.get("client_address"));
  const receiverEmail = getEntityText(byType.get("receiver_email"));
  const receiverPhone = getEntityText(byType.get("receiver_phone"));
  const receiverTaxId = getEntityText(byType.get("receiver_tax_id"));
  const receiverWebsite = getEntityText(byType.get("receiver_website"));

  // Shipping Information
  const shipFromName = getEntityText(byType.get("ship_from_name"));
  const shipFromAddress = getEntityText(byType.get("ship_from_address"));
  const carrier = getEntityText(byType.get("carrier"));

  // Invoice/Document Identification
  const invoiceId = getEntityText(byType.get("invoice_id"))
    || getEntityText(byType.get("receipt_id"))
    || getEntityText(byType.get("reservation_id"));
  const purchaseOrder = getEntityText(byType.get("purchase_order"));

  // Dates
  const invoiceDate = getEntityText(byType.get("invoice_date")) 
    || getEntityText(byType.get("receipt_date"))
    || getEntityText(byType.get("statement_date"));
  const dueDate = getEntityText(byType.get("due_date"));
  const deliveryDate = getEntityText(byType.get("delivery_date"));
  const purchaseTime = getEntityText(byType.get("purchase_time"));
  const startDate = getEntityText(byType.get("start_date"))
    || getEntityText(byType.get("statement_start_date"));
  const endDate = getEntityText(byType.get("end_date"))
    || getEntityText(byType.get("statement_end_date"));

  // Amounts
  const totalAmount = parseAmount(getEntityText(byType.get("total_amount")));
  const netAmount = parseAmount(getEntityText(byType.get("net_amount")));
  const totalTaxAmount = parseAmount(getEntityText(byType.get("total_tax_amount")));
  const freightAmount = parseAmount(getEntityText(byType.get("freight_amount")));
  const tipAmount = parseAmount(getEntityText(byType.get("tip_amount")));
  const amountPaidSinceLastInvoice = parseAmount(getEntityText(byType.get("amount_paid_since_last_invoice")));

  // Currency
  const currencyRaw = getEntityText(byType.get("currency"));
  const currency = (currencyRaw || detectCurrencyFromText(fullText) || "MXN").toUpperCase();
  const currencyExchangeRate = getEntityText(byType.get("currency_exchange_rate"));

  // Payment Information
  const paymentTerms = getEntityText(byType.get("payment_terms"));
  const paymentType = getEntityText(byType.get("payment_type"));
  const creditCardLastFourDigits = getEntityText(byType.get("credit_card_last_four_digits"));

  // ═══════════════════════════════════════════════════════════════════════════
  // BANK STATEMENT PARSER FIELDS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const bankName = getEntityText(byType.get("bank_name"));
  const bankAddress = getEntityText(byType.get("bank_address"));
  const accountNumber = getEntityText(byType.get("account_number"));
  const accountType = getEntityText(byType.get("account_type"));
  const startingBalance = parseAmount(getEntityText(byType.get("starting_balance")));
  const endingBalance = parseAmount(getEntityText(byType.get("ending_balance")));

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPENSE PARSER FIELDS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const travelerName = getEntityText(byType.get("traveler_name"));

  // ═══════════════════════════════════════════════════════════════════════════
  // LINE ITEMS & VAT DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const lineItems = extractLineItems(entities);
  const vatDetails = extractVatDetails(entities);

  // Calculate primary amount (prioritize total, then net)
  const primaryAmount = totalAmount ?? netAmount;

  return {
    // ─────────────────────────────────────────────────────────────────────────
    // PROVEEDOR / SUPPLIER
    // ─────────────────────────────────────────────────────────────────────────
    supplierName,
    supplierAddress,
    supplierCity,
    supplierEmail,
    supplierPhone,
    supplierWebsite,
    supplierTaxId,
    supplierIban,
    supplierRegistration,
    supplierPaymentRef,

    // ─────────────────────────────────────────────────────────────────────────
    // CLIENTE / RECEIVER
    // ─────────────────────────────────────────────────────────────────────────
    receiverName,
    receiverAddress,
    receiverEmail,
    receiverPhone,
    receiverTaxId,
    receiverWebsite,

    // ─────────────────────────────────────────────────────────────────────────
    // ENVÍO / SHIPPING
    // ─────────────────────────────────────────────────────────────────────────
    shipFromName,
    shipFromAddress,
    carrier,

    // ─────────────────────────────────────────────────────────────────────────
    // IDENTIFICACIÓN DEL DOCUMENTO
    // ─────────────────────────────────────────────────────────────────────────
    invoiceId,
    purchaseOrder,

    // ─────────────────────────────────────────────────────────────────────────
    // FECHAS
    // ─────────────────────────────────────────────────────────────────────────
    date: invoiceDate,
    dueDate,
    deliveryDate,
    purchaseTime,
    startDate,
    endDate,

    // ─────────────────────────────────────────────────────────────────────────
    // MONTOS / AMOUNTS
    // ─────────────────────────────────────────────────────────────────────────
    totalAmount,
    netAmount,
    totalTaxAmount,
    freightAmount,
    tipAmount,
    amountPaidSinceLastInvoice,
    primaryAmount, // El monto principal para usar en transacciones

    // ─────────────────────────────────────────────────────────────────────────
    // DIVISA / CURRENCY
    // ─────────────────────────────────────────────────────────────────────────
    currency,
    currencyExchangeRate,

    // ─────────────────────────────────────────────────────────────────────────
    // INFORMACIÓN DE PAGO
    // ─────────────────────────────────────────────────────────────────────────
    paymentTerms,
    paymentType,
    creditCardLastFourDigits,

    // ─────────────────────────────────────────────────────────────────────────
    // BANCO / BANK (para estados de cuenta)
    // ─────────────────────────────────────────────────────────────────────────
    bankName,
    bankAddress,
    accountNumber,
    accountType,
    startingBalance,
    endingBalance,

    // ─────────────────────────────────────────────────────────────────────────
    // GASTOS / EXPENSE
    // ─────────────────────────────────────────────────────────────────────────
    travelerName,

    // ─────────────────────────────────────────────────────────────────────────
    // LÍNEAS DE DETALLE / LINE ITEMS
    // ─────────────────────────────────────────────────────────────────────────
    lineItems: lineItems.length > 0 ? lineItems : undefined,
    lineItemsCount: lineItems.length > 0 ? lineItems.length : undefined,

    // ─────────────────────────────────────────────────────────────────────────
    // IVA / VAT DETAILS
    // ─────────────────────────────────────────────────────────────────────────
    vatDetails: vatDetails.length > 0 ? vatDetails : undefined,

    // ─────────────────────────────────────────────────────────────────────────
    // TEXTO Y ENTIDADES RAW
    // ─────────────────────────────────────────────────────────────────────────
    fullText: fullText.substring(0, 1000), // Más contexto: 1000 chars
    rawEntities: entities.map((e) => ({
      type: e.type,
      text: getEntityText(e),
      confidence: e.confidence,
    })),
    totalEntitiesFound: entities.length,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: AnalyzeRequestBody;
  try {
    body = (await req.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.docId) {
    return NextResponse.json({ error: "missing_docId" }, { status: 400 });
  }

  const docRef = adminDb.collection("documents").doc(body.docId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  }

  const docData = docSnap.data() as any;
  const storagePath: string | undefined = docData.storagePath;
  if (!storagePath) {
    return NextResponse.json({ error: "missing_storagePath" }, { status: 400 });
  }

  const processorKey = pickProcessorKey({ documentType: docData.type, fileName: docData.name });
  const processorName = (documentAIConfig.processors as any)[processorKey] as string | undefined;
  if (!processorName) {
    return NextResponse.json({ error: "processor_not_configured" }, { status: 500 });
  }

  const mimeType = (lookupMimeType(storagePath) as string) || "application/pdf";
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
  const isXML = storagePath.toLowerCase().endsWith('.xml') || mimeType.includes('xml');

  try {
    await docRef.set(
      {
        ai: {
          status: "analyzing",
          audit: {
            proposedAt: FieldValue.serverTimestamp(),
            proposedBy: auth.uid,
          },
        },
      },
      { merge: true }
    );

    const [fileBuffer] = await adminStorage.bucket(bucketName).file(storagePath).download();

    let extracted: any;

    if (isXML) {
      // ═══════════════════════════════════════════════════════════════════════
      // XML/CFDI Processing - Parse directly without Document AI
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📄 Processing XML/CFDI file directly");
      console.log("📄 File size:", fileBuffer.length, "bytes");
      
      const xmlContent = fileBuffer.toString('utf-8');
      const xmlData = await parseXMLDocument(xmlContent);
      
      if (!xmlData) {
        throw new Error("Failed to parse XML document");
      }
      
      extracted = extractFieldsFromXML(xmlData);
      console.log("✅ XML/CFDI parsed successfully");
      console.log("📋 Extracted:", extracted.supplierName, extracted.totalAmount, extracted.currency);
    } else {
      // ═══════════════════════════════════════════════════════════════════════
      // Document AI Processing - For PDFs and Images
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📄 Calling Document AI with processor:", processorName);
      console.log("📄 File size:", fileBuffer.length, "bytes, mimeType:", mimeType);
      
      const client = getDocumentAIClient();
      const [result] = await client.processDocument({
        name: processorName,
        rawDocument: {
          content: fileBuffer,
          mimeType,
        },
      });
      
      console.log("✅ Document AI processed successfully");
      extracted = extractFields(result.document);
    }
    
    // Helper to remove undefined values (Firestore doesn't accept them)
    const cleanObject = (obj: Record<string, any>): Record<string, any> => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
      );
    };

    // Determine document type based on processor and extracted data
    const suggestedType = isXML ? "CFDI (Factura Electrónica)"
      : processorKey === "invoice" ? "Factura" 
      : processorKey === "expense" ? "Comprobante de Gasto"
      : processorKey === "bankStatement" ? "Estado de Cuenta"
      : processorKey === "form" ? "Contrato/Formulario"
      : docData.type || "Documento";

    // ═══════════════════════════════════════════════════════════════════════
    // BUSCAR COINCIDENCIAS EN BASE DE DATOS (Suppliers, Clients, Promoters)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Extraer RFCs del documento (usar as any para acceso dinámico a campos que varían según tipo de documento)
    const ext = extracted as any;
    const emisorRfc = ext.emisor_rfc || ext.supplierTaxId || null;
    const receptorRfc = ext.receptor_rfc || ext.receiverTaxId || null;
    const emisorNombre = ext.emisor_nombre || ext.supplierName || null;
    const receptorNombre = ext.receptor_nombre || ext.receiverName || null;

    // Buscar proveedor existente por RFC o nombre
    let matchedSupplier: { id: string; name: string; rfc?: string; matchType: 'rfc' | 'name' } | null = null;
    if (emisorRfc || emisorNombre) {
      // Primero buscar por RFC (más preciso)
      if (emisorRfc) {
        const rfcQuery = await adminDb.collection("suppliers")
          .where("rfc", "==", emisorRfc)
          .where("status", "==", "Activo")
          .limit(1)
          .get();
        if (!rfcQuery.empty) {
          const doc = rfcQuery.docs[0];
          matchedSupplier = { id: doc.id, name: doc.data().name, rfc: doc.data().rfc, matchType: 'rfc' };
        }
      }
      // Si no hay match por RFC, buscar por nombre similar
      if (!matchedSupplier && emisorNombre) {
        const nameQuery = await adminDb.collection("suppliers")
          .where("status", "==", "Activo")
          .get();
        const normalizedSearch = emisorNombre.toLowerCase().trim();
        for (const doc of nameQuery.docs) {
          const supplierName = (doc.data().name || '').toLowerCase().trim();
          if (supplierName === normalizedSearch || supplierName.includes(normalizedSearch) || normalizedSearch.includes(supplierName)) {
            matchedSupplier = { id: doc.id, name: doc.data().name, rfc: doc.data().rfc, matchType: 'name' };
            break;
          }
        }
      }
    }

    // Buscar cliente existente por RFC o nombre
    let matchedClient: { id: string; name: string; rfc?: string; matchType: 'rfc' | 'name' } | null = null;
    if (receptorRfc || receptorNombre) {
      // Primero buscar por RFC
      if (receptorRfc) {
        const rfcQuery = await adminDb.collection("clients")
          .where("rfc", "==", receptorRfc)
          .where("status", "==", "Activo")
          .limit(1)
          .get();
        if (!rfcQuery.empty) {
          const doc = rfcQuery.docs[0];
          matchedClient = { id: doc.id, name: doc.data().name, rfc: doc.data().rfc, matchType: 'rfc' };
        }
      }
      // Si no hay match por RFC, buscar por nombre similar
      if (!matchedClient && receptorNombre) {
        const nameQuery = await adminDb.collection("clients")
          .where("status", "==", "Activo")
          .get();
        const normalizedSearch = receptorNombre.toLowerCase().trim();
        for (const doc of nameQuery.docs) {
          const clientName = (doc.data().name || '').toLowerCase().trim();
          if (clientName === normalizedSearch || clientName.includes(normalizedSearch) || normalizedSearch.includes(clientName)) {
            matchedClient = { id: doc.id, name: doc.data().name, rfc: doc.data().rfc, matchType: 'name' };
            break;
          }
        }
      }
    }

    // Obtener listas para selector en frontend
    const suppliersSnap = await adminDb.collection("suppliers").where("status", "==", "Activo").get();
    const clientsSnap = await adminDb.collection("clients").where("status", "==", "Activo").get();
    const promotersSnap = await adminDb.collection("promoters").where("status", "==", "Activo").get();

    const availableSuppliers = suppliersSnap.docs.map(d => ({ id: d.id, name: d.data().name || '', rfc: d.data().rfc || '' }));
    const availableClients = clientsSnap.docs.map(d => ({ id: d.id, name: d.data().name || '', rfc: d.data().rfc || '' }));
    const availablePromoters = promotersSnap.docs.map(d => ({ id: d.id, name: d.data().name || '' }));

    console.log("🔍 Entity matching:", { 
      emisorRfc, emisorNombre, matchedSupplier,
      receptorRfc, receptorNombre, matchedClient,
      availableSuppliers: availableSuppliers.length,
      availableClients: availableClients.length 
    });

    // Calculate confidence based on extracted data quality
    const dataPoints = [
      extracted.supplierName,
      extracted.primaryAmount,
      extracted.invoiceId,
      extracted.date,
      extracted.currency,
      extracted.receiverName,
      extracted.totalTaxAmount,
    ].filter(Boolean).length;
    
    const hasLineItems = (extracted.lineItemsCount || 0) > 0;
    const hasEntityMatch = matchedSupplier || matchedClient;
    const confidence = Math.min(0.95, 0.5 + (dataPoints * 0.07) + (hasLineItems ? 0.1 : 0) + (hasEntityMatch ? 0.05 : 0));

    // Build comprehensive transaction description
    const transactionParts = [];
    if (extracted.supplierName) transactionParts.push(extracted.supplierName);
    if (extracted.invoiceId) transactionParts.push(`#${extracted.invoiceId}`);
    const transactionDescription = transactionParts.length > 0 
      ? transactionParts.join(" - ") 
      : docData.name || "Documento";

    // Build comprehensive task title
    const taskTitle = processorKey === "invoice" 
      ? `Revisar factura${extracted.supplierName ? ` de ${extracted.supplierName}` : ""}${extracted.primaryAmount ? ` por $${extracted.primaryAmount.toLocaleString()} ${extracted.currency}` : ""}`
      : processorKey === "expense" 
      ? `Revisar gasto${extracted.supplierName ? ` en ${extracted.supplierName}` : ""}${extracted.primaryAmount ? ` $${extracted.primaryAmount.toLocaleString()} ${extracted.currency}` : ""}`
      : processorKey === "bankStatement"
      ? `Revisar estado de cuenta${extracted.bankName ? ` de ${extracted.bankName}` : ""}${extracted.accountNumber ? ` (****${extracted.accountNumber.slice(-4)})` : ""}`
      : "Revisar documento";

    const proposal = {
      suggestedType,
      confidence,
      processorKey,
      
      // ═══════════════════════════════════════════════════════════════════════
      // TODOS LOS DATOS EXTRAÍDOS
      // ═══════════════════════════════════════════════════════════════════════
      extracted: cleanObject(extracted),
      
      // ═══════════════════════════════════════════════════════════════════════
      // RESUMEN EJECUTIVO (para mostrar rápidamente)
      // ═══════════════════════════════════════════════════════════════════════
      summary: cleanObject({
        // Identificación
        documentId: extracted.invoiceId || extracted.purchaseOrder || null,
        documentDate: extracted.date || null,
        dueDate: extracted.dueDate || null,
        
        // Partes involucradas
        from: extracted.supplierName || extracted.bankName || null,
        fromTaxId: extracted.supplierTaxId || null,
        fromContact: extracted.supplierEmail || extracted.supplierPhone || null,
        to: extracted.receiverName || null,
        toTaxId: extracted.receiverTaxId || null,
        
        // Montos principales
        subtotal: extracted.netAmount || null,
        tax: extracted.totalTaxAmount || null,
        total: extracted.primaryAmount || null,
        currency: extracted.currency || "MXN",
        
        // Items
        itemCount: extracted.lineItemsCount || 0,
        
        // Para estados de cuenta
        startingBalance: extracted.startingBalance || null,
        endingBalance: extracted.endingBalance || null,
      }),
      
      // ═══════════════════════════════════════════════════════════════════════
      // SUGERENCIAS DE ACCIONES
      // ═══════════════════════════════════════════════════════════════════════
      suggested: {
        // Transacción sugerida
        transaction: cleanObject({
          type: processorKey === "invoice" || processorKey === "expense" ? "Egreso" 
            : processorKey === "bankStatement" ? "Movimiento Bancario" 
            : null,
          amount: extracted.primaryAmount || null,
          currency: extracted.currency || "MXN",
          date: extracted.date || null,
          dueDate: extracted.dueDate || null,
          description: transactionDescription,
          reference: extracted.invoiceId || extracted.purchaseOrder || null,
          
          // Datos del proveedor para crear/vincular
          supplierName: extracted.supplierName || null,
          supplierTaxId: extracted.supplierTaxId || null,
          supplierEmail: extracted.supplierEmail || null,
          supplierPhone: extracted.supplierPhone || null,
          
          // Datos del cliente
          clientId: docData.clientId || null,
          clientName: extracted.receiverName || null,
          
          // Impuestos
          taxAmount: extracted.totalTaxAmount || null,
          netAmount: extracted.netAmount || null,
          
          // Términos de pago
          paymentTerms: extracted.paymentTerms || null,
          paymentType: extracted.paymentType || null,
        }),
        
        // Tarea sugerida
        task: cleanObject({
          title: taskTitle,
          description: `Documento: ${docData.name}\nProveedor: ${extracted.supplierName || "No identificado"}\nMonto: ${extracted.primaryAmount ? `$${extracted.primaryAmount.toLocaleString()} ${extracted.currency}` : "No identificado"}\nFecha: ${extracted.date || "No identificada"}`,
          clientId: docData.clientId || matchedClient?.id || null,
          dueDate: extracted.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          priority: extracted.dueDate ? "high" : "medium",
        }),
        
        // Proveedor sugerido (para crear si no existe)
        supplier: extracted.supplierName ? cleanObject({
          name: extracted.supplierName,
          taxId: extracted.supplierTaxId || null,
          email: extracted.supplierEmail || null,
          phone: extracted.supplierPhone || null,
          website: extracted.supplierWebsite || null,
          address: extracted.supplierAddress || null,
          city: extracted.supplierCity || null,
          iban: extracted.supplierIban || null,
          registration: extracted.supplierRegistration || null,
        }) : null,
        
        // Cliente sugerido (si se detectó receptor)
        client: extracted.receiverName ? cleanObject({
          name: extracted.receiverName,
          taxId: extracted.receiverTaxId || null,
          email: extracted.receiverEmail || null,
          phone: extracted.receiverPhone || null,
          address: extracted.receiverAddress || null,
        }) : null,
      },
      
      // ═══════════════════════════════════════════════════════════════════════
      // ASOCIACIONES AUTOMÁTICAS (entidades detectadas en el documento)
      // ═══════════════════════════════════════════════════════════════════════
      associations: {
        // Proveedor detectado (emisor del CFDI)
        supplier: matchedSupplier ? {
          matched: true,
          matchType: matchedSupplier.matchType,
          id: matchedSupplier.id,
          name: matchedSupplier.name,
          rfc: matchedSupplier.rfc || emisorRfc,
        } : emisorNombre ? {
          matched: false,
          matchType: null,
          id: null,
          name: emisorNombre,
          rfc: emisorRfc,
          suggestCreate: true,
        } : null,
        
        // Cliente detectado (receptor del CFDI)
        client: matchedClient ? {
          matched: true,
          matchType: matchedClient.matchType,
          id: matchedClient.id,
          name: matchedClient.name,
          rfc: matchedClient.rfc || receptorRfc,
        } : receptorNombre ? {
          matched: false,
          matchType: null,
          id: null,
          name: receptorNombre,
          rfc: receptorRfc,
          suggestCreate: true,
        } : null,
        
        // Listas disponibles para selector en frontend
        availableSuppliers,
        availableClients,
        availablePromoters,
      },
      
      // ═══════════════════════════════════════════════════════════════════════
      // METADATOS DEL ANÁLISIS
      // ═══════════════════════════════════════════════════════════════════════
      metadata: {
        entitiesFound: extracted.totalEntitiesFound || 0,
        lineItemsFound: extracted.lineItemsCount || 0,
        vatDetailsFound: extracted.vatDetails?.length || 0,
        processorUsed: processorKey,
        analysisTimestamp: new Date().toISOString(),
      },
    };

    await docRef.set(
      {
        ai: {
          status: "proposed",
          proposal,
        },
      },
      { merge: true }
    );

    return NextResponse.json({ docId: body.docId, proposal });
  } catch (e: any) {
    console.error("❌ Document AI Error:", e?.message || e);
    console.error("Full error:", JSON.stringify(e, null, 2));
    
    await docRef.set(
      {
        ai: {
          status: "failed",
          error: {
            message: e?.message || String(e),
          },
        },
      },
      { merge: true }
    );

    return NextResponse.json({ error: "analyze_failed", details: e?.message }, { status: 500 });
  }
}
