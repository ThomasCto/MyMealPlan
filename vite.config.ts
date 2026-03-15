import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MyMealPlan/', // TRÈS IMPORTANT : met le nom exact de ton dépôt GitHub ici
})