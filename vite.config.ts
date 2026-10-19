import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.GITHUB_ACTIONS ? '/comissao-festas-pedidos/' : './' });
