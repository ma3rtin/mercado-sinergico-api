// 🚦 MERCADO SINERGICO - STRESS & SECURITY TEST SUITE
// Ejecutar con: npx tsx stress-test.ts

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const CONCURRENT_REQUESTS = 50;

async function testLoad() {
    console.log(`🚀 Iniciando Test de Carga: ${CONCURRENT_REQUESTS} reqs simultáneas...`);
    const promises = Array.from({ length: CONCURRENT_REQUESTS }).map(() => 
        axios.get(`${API_URL}/productos`).catch(err => err.response?.status)
    );
    const results = await Promise.all(promises);
    const success = results.filter(r => typeof r === 'object' && r.status === 200).length;
    console.log(`✅ Resultado: ${success}/${CONCURRENT_REQUESTS} exitosas.`);
}

async function testAbuseAuth() {
    console.log('🛡️ Probando Rate Limit en Login...');
    let blocked = false;
    for (let i = 0; i < 10; i++) {
        try {
            await axios.post(`${API_URL}/usuarios/login`, { email: 'test@test.com', contraseña: 'wrong' });
        } catch (err: any) {
            if (err.response?.status === 429) {
                blocked = true;
                break;
            }
        }
    }
    console.log(blocked ? '✅ Rate limit funciona (429 Detectado)' : '❌ Rate limit FALLÓ');
}

async function testSecurityBypass() {
    console.log('🔒 Probando Bypass de Seguridad (Admin Route)...');
    try {
        await axios.post(`${API_URL}/productos/excel/importar`, {});
        console.log('❌ FALLO: Acceso concedido sin token');
    } catch (err: any) {
        console.log(`✅ Protegido: ${err.response?.status} ${err.response?.statusText || 'Unauthorized'}`);
    }
}


async function runAll() {
    try {
        await testLoad();
        await testAbuseAuth();
        await testSecurityBypass();
    } catch (e) {
        console.error('Test fallido (¿Server apagado?)');
    }
}

runAll();
