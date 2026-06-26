export default async function handler(req, res) {
    // Permite que o front-end envie os dados via POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Variável GEMINI_API_KEY não configurada na Vercel." });
    }

    try {
        // Chamada oficial para o Gemini processar o cenário industrial
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Aja como um analista especialista em Gestão Industrial e Engenharia de Produção. Faça um Parecer de Realismo e Auditoria técnica de capacidade (gargalos, turnos, eficiência e restrições) para o seguinte cenário fabril: ${prompt}`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            return res.status(response.status).json({ error: `Erro na API do Gemini: ${errorDetails}` });
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const textoResposta = data.candidates[0].content.parts[0].text;
            
            // Retorna o resultado no formato esperado pelo seu index.js
            return res.status(200).json({ resultado: textoResposta });
        } else {
            return res.status(500).json({ error: "Estrutura de resposta da IA vazia." });
        }

    } catch (error) {
        return res.status(500).json({ error: `Erro interno: ${error.message}` });
    }
}
