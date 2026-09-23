import { authFetch } from './authService';

const BASE_URL = 'http://localhost:3000/api';

/**
 * Obtener datos consolidados del reporte (KPIs, distribución y listado de transacciones)
 * GET /api/reportes
 * @param {Object} filtros - { fechaDesde, fechaHasta, sector, tipo }
 */
export async function obtenerReporte(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros.sector && filtros.sector !== 'Todos') params.append('sector', filtros.sector);
  if (filtros.tipo && filtros.tipo !== 'Todos') params.append('tipo', filtros.tipo);

  const queryString = params.toString();
  const url = queryString ? `${BASE_URL}/reportes?${queryString}` : `${BASE_URL}/reportes`;

  const response = await authFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener el reporte analítico.');
  }

  return await response.json();
}

/**
 * Obtener registros inmutables de auditoría
 * GET /api/auditoria
 */
export async function obtenerLogsAuditoria() {
  const response = await authFetch(`${BASE_URL}/auditoria`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener los logs de auditoría.');
  }

  return await response.json();
}

/**
 * Descargar reporte oficial institucional en PDF del inventario de equipos activos (PDFKit)
 * GET /api/reportes/pdf-equipos o /api/backup/pdf
 */
export async function descargarReporteEquiposPDF() {
  const response = await authFetch(`${BASE_URL}/reportes/pdf-equipos`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al generar el reporte PDF de equipos.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fechaStr = new Date().toISOString().slice(0, 10);
  a.download = `Reporte_Inventario_Equipos_${fechaStr}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Descargar copia de seguridad SQL completa de la base de datos (RF-07.3)
 * GET /api/backup/sql
 */
export async function descargarBackupSQL() {
  const response = await authFetch(`${BASE_URL}/backup/sql`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al descargar la copia de seguridad SQL.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fechaStr = new Date().toISOString().slice(0, 10);
  a.download = `backup_tep_inventario_${fechaStr}.sql`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
