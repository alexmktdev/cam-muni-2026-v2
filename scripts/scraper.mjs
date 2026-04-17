import { chromium } from "playwright"
import fs from "fs"

// ---- CONFIGURACIÓN ----
const URL_LOGIN = "https://cam-wine.vercel.app/login"
const URL_DATOS = "https://cam-wine.vercel.app/buscar-miembros"
const USUARIO = "correo@prueba.cl"
const PASSWORD = "123456"
// -----------------------

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

try {
  // 1. Login
  console.log("🔐 Iniciando sesión...")
  await page.goto(URL_LOGIN)
  await page.waitForLoadState("domcontentloaded")
  await page.fill('input[type="email"]', USUARIO)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 15000 })
  console.log("✅ Login exitoso")

  // 2. Ir a buscar-miembros
  console.log("🌐 Navegando a buscar-miembros...")
  await page.goto(URL_DATOS)
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(3000)

  // 3. Hacer clic en "Ver Todos"
  console.log("🖱️ Buscando botón 'Ver Todos'...")
  const boton = await page.waitForSelector("button.bg-green-600", { timeout: 10000 })
  await boton.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await boton.click()
  console.log("✅ Clic en 'Ver Todos' exitoso")

  // 4. Esperar que cargue la tabla
  console.log("⏳ Esperando que carguen todos los registros...")
  await page.waitForSelector("table tbody tr", { timeout: 20000 })
  await page.waitForTimeout(6000)

  // 5. Extraer headers
  const headers = await page.$$eval("table th", ths =>
    ths.map(th => th.innerText.trim()).filter(h => h !== "")
  )
  console.log("Headers encontrados:", headers)

  // 6. Extraer filas manejando clubes con múltiples items
  const filas = await page.$$eval("table tbody tr", rows =>
    rows.map(row => {
      const celdas = [...row.querySelectorAll("td")]
      return celdas.map(td => {
        // Si la celda tiene spans de clubes, extrae cada uno separado por |
        const spans = td.querySelectorAll("span.truncate")
        if (spans.length > 0) {
          return [...spans].map(s => s.innerText.trim()).join(" | ")
        }
        // Si no, extrae el texto normal
        return td.innerText.trim()
      })
    }).filter(row => row.length > 0)
  )
  console.log(`📊 ${filas.length} registros encontrados`)

  // 7. Guardar CSV
  const csv = [
    headers.join(","),
    ...filas.map(fila =>
      fila.map(val =>
        val.includes(",") || val.includes("\n") || val.includes("|")
          ? `"${val.replace(/"/g, '""')}"` 
          : val
      ).join(",")
    )
  ].join("\n")

  fs.writeFileSync("datos.csv", csv, "utf-8")
  console.log("✅ Guardado en datos.csv")
  console.log(`📁 datos.csv con ${filas.length} filas`)

} catch (err) {
  console.error("❌ Error:", err.message)
  await page.screenshot({ path: "error.png" })
  console.log("📸 Screenshot del error guardado: error.png")
} finally {
  await browser.close()
}