/**
 * Aspose.Tasks Cloud — converts .mpp bytes to MS Project XML string.
 *
 * Flow:
 *   1) upload .mpp → Aspose storage (temp path)
 *   2) request XML format download
 *   3) delete temp file (cleanup)
 *
 * Env required:
 *   ASPOSE_CLIENT_ID
 *   ASPOSE_CLIENT_SECRET
 */

import {
  TasksApi,
  UploadFileRequest,
  GetTaskDocumentWithFormatRequest,
  DeleteFileRequest,
  ProjectFileFormat,
} from '@asposecloud/aspose-tasks-cloud'

function getApi(): TasksApi {
  const id     = process.env.ASPOSE_CLIENT_ID
  const secret = process.env.ASPOSE_CLIENT_SECRET
  if (!id || !secret) {
    throw new Error('ASPOSE_CLIENT_ID / ASPOSE_CLIENT_SECRET no configurados')
  }
  return new TasksApi(id, secret)
}

function extractAsposeError(e: unknown): string {
  if (!e) return 'Error desconocido'
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message || e.toString()
  // Aspose SDK throws objects like { response: { statusCode, body } } or { body: { error: {...} } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = e as any
  const parts: string[] = []
  if (any.statusCode)                 parts.push(`status=${any.statusCode}`)
  if (any.response?.statusCode)       parts.push(`status=${any.response.statusCode}`)
  if (any.response?.statusMessage)    parts.push(any.response.statusMessage)
  if (any.body?.error?.message)       parts.push(any.body.error.message)
  if (any.body?.Error?.Message)       parts.push(any.body.Error.Message)
  if (any.response?.body?.error?.message) parts.push(any.response.body.error.message)
  if (any.response?.body?.Error?.Message) parts.push(any.response.body.Error.Message)
  if (any.response?.body?.Error?.Description) parts.push(any.response.body.Error.Description)
  if (any.response?.body?.Error?.Code) parts.push(`aspose_code=${any.response.body.Error.Code}`)
  if (any.message)                    parts.push(any.message)
  if (any.code)                       parts.push(`code=${any.code}`)
  if (any.error_description)          parts.push(any.error_description)
  if (parts.length === 0) {
    try { return JSON.stringify(any).slice(0, 500) } catch { return String(any) }
  }
  return parts.join(' · ')
}

export async function convertMppToXml(mppBytes: Buffer, originalName: string): Promise<string> {
  const api = getApi()

  // Temp path inside Aspose storage — unique per request
  const ts   = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const remotePath = `erp-mm-temp/${ts}-${rand}-${safeName}`

  try {
    // 1) upload
    const up = new UploadFileRequest()
    up.path = remotePath
    up.file = mppBytes
    try {
      await api.uploadFile(up)
    } catch (e) {
      console.error('[Aspose uploadFile] raw error:', JSON.stringify(e, null, 2))
      throw new Error('uploadFile: ' + extractAsposeError(e))
    }

    // 2) get as XML
    const req = new GetTaskDocumentWithFormatRequest()
    req.name   = remotePath
    req.format = ProjectFileFormat.Xml
    let res
    try {
      res = await api.getTaskDocumentWithFormat(req)
    } catch (e) {
      console.error('[Aspose getTaskDocumentWithFormat] raw error:', e)
      throw new Error('convert: ' + extractAsposeError(e))
    }

    const buf: Buffer = res.body as unknown as Buffer
    const xml = Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf)
    if (!xml || xml.length < 50) {
      throw new Error('convert: XML vacío recibido de Aspose')
    }
    return xml
  } finally {
    // 3) cleanup (best-effort)
    try {
      const del = new DeleteFileRequest()
      del.path = remotePath
      await api.deleteFile(del)
    } catch {
      /* ignore cleanup errors */
    }
  }
}
