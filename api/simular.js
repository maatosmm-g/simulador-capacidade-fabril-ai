export default async function handler(req, res) {
    // Garante que só aceita requisições do tipo POST (envio de dados)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Se a chave não estiver configurada na Vercel, avisa o desenvolvedor
    if (!apiKey) {
        return res.status(500).json({ resultado: "Erro de configuração: A variável GEMINI_API_KEY não foi encontrada na Vercel." });
    }

    try {
        // Chamada utilizando a API estável do Gemini 1.5 / 2.5 Flash de forma compatível
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Aja como um especialista em Gestão Industrial e Engenharia de Produção. Analise o seguinte cenário fabril, gerando um Parecer de Realismo e Auditoria da capacidade (gargalos, turnos, eficiência OEE e restrições): ${prompt}`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            return res.status(response.status).json({ resultado: `Erro na API do Gemini: ${response.statusText}. Detalhes: ${errorDetails}` });
        }

        const data = await response.json();
        
        // Validação se a IA retornou texto válido
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const textoResposta = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ resultado: textoResposta });
        } else {
            return res.status(500).json({ resultado: "A IA recebeu os dados, mas retornou uma estrutura vazia. Verifique o formato do prompt." });
        }

    } catch (error) {
        return res.status(500).json({ resultado: `Erro interno no servidor ao processar o diagnóstico: ${error.message}` });
    }
}
