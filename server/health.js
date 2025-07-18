/**
 * Sets up a health check endpoint for deployment
 * This must be the first middleware registered to avoid any potential blocking
 */
export function setupHealthCheck(app) {
    console.log("Setting up health check endpoint at /api/health")
  
    // Railway health check endpoint - must be first
    app.get("/api/health", (req, res) => {
      console.log(`${new Date().toISOString()} - Health check received`)
      res.status(200).send("OK")
    })
  
    // Fallback health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).send("OK")
    })
  }
  