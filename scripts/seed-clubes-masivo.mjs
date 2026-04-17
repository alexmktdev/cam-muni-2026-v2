import fs from 'node:fs'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// 1. Forzar modo Emulador ANTES de inicializar
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const PROJECT_ID = 'club-adulto-mayor-muni-2026'

// 2. Inicializar con credenciales dummy (no se validan en el emulador)
const app = initializeApp({
  projectId: PROJECT_ID,
})

const db = getFirestore(app)

async function seed() {
  console.log('--- Iniciando Sembrado de Clubes en Emulador ---')
  
  const csvPath = path.resolve('datos.csv')
  if (!fs.existsSync(csvPath)) {
    console.error('Error: No se encontró datos.csv')
    return
  }

  const contenido = fs.readFileSync(csvPath, 'utf-8')
  const lineas = contenido.split(/\r?\n/).filter(line => line.trim())

  // Saltar encabezados
  const datos = lineas.slice(1)
  const nombresUnicos = new Set([
     "CAM NUEVO DESPERTAR",
     "CAM PADRE CARLOS VILLAGRA",
     "CAM Población San carlos",
     "CAM SIN FRONTERAS",
     "CAM SUEÑOS DE OTOÑO",
     "CAM Usuarios activos centro diurno",
     "CAM ayuda social UCAM"
  ])

  for (const linea of datos) {
    if (!linea.trim()) continue
    
    // Parser de CSV robusto que maneja comas dentro de comillas
    const parts = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < linea.length; i++) {
        const char = linea[i]
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            parts.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    parts.push(current.trim())

    if (parts.length < 5) continue

    // En las líneas con errores de comas extras (RUTs o Nombres con comas), 
    // el club suele ser la última columna.
    const clubesRaw = parts[parts.length - 1].replace(/^"|"$/g, '') 
    const clubesArray = clubesRaw.split(/\||;/).map(c => c.trim()).filter(Boolean)
    
    for (const c of clubesArray) {
      let nombre = c
      // Limpiar ruidos comunes de comas mal parseadas si los hay
      if (nombre.length < 2) continue 
      
      if (!nombre.toUpperCase().startsWith('CAM ')) {
        nombre = 'CAM ' + nombre
      }
      nombresUnicos.add(nombre)
    }
  }

  console.log(`Detectados ${nombresUnicos.size} clubes únicos para sembrar.`)

  let creados = 0
  const colRef = db.collection('clubes')
  const MAX_BATCH = 400 // Firestore máx. 500 ops por batch

  let batch = db.batch()
  let opsEnBatch = 0

  async function flushBatch() {
    if (opsEnBatch === 0) return
    await batch.commit()
    batch = db.batch()
    opsEnBatch = 0
  }

  for (const nombre of nombresUnicos) {
    const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    const id = slug || `club-${Math.random().toString(36).substring(2, 7)}`

    const docRef = colRef.doc(id)
    batch.set(
      docRef,
      {
        nombre,
        slugUrl: id,
        comuna: 'Molina',
        region: 'Del Maule',
        activo: true,
        miembros: 0,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    )
    opsEnBatch++
    creados++

    if (opsEnBatch >= MAX_BATCH) {
      await flushBatch()
    }
  }

  console.log('Listado de clubes detectados:')
  const sortedNames = Array.from(nombresUnicos).sort()
  sortedNames.forEach((n) => console.log(`- ${n}`))
  console.log(`Total únicos: ${nombresUnicos.size}`)

  await flushBatch()
  console.log(`✅ ¡Éxito! Se han creado/actualizado ${creados} clubes en el emulador local.`)

  // --- NUEVO: Sincronizar el Dashboard (aggregates/panel) ---
  console.log('Sincronizando Dashboard...')
  const snapCount = await colRef.count().get()
  const snapActivos = await colRef.where('activo', '==', true).count().get()
  const totalClubes = snapCount.data().count
  const totalClubesActivos = snapActivos.data().count

  await db.collection('aggregates').doc('panel').set({
    totalClubes,
    totalClubesActivos,
    totalMiembros: 0, // Recién empezamos, miembros están en 0
    updatedAt: new Date().toISOString()
  }, { merge: true })

  console.log('✅ Dashboard sincronizado con éxito.')
  console.log('--- Proceso terminado ---')
}

seed().catch(err => {
  console.error('Error fatal durante el sembrado:', err)
  process.exit(1)
})
