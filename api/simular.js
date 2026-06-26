export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Aja como um Simulador de Capacidade Fabril profissional focado em gestão industrial. Analise o seguinte cenário e traga os gargalos e diagnósticos: ${prompt}` }] }]
            })
        });

        const data = await response.json();
        const textoResposta = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ resultado: textoResposta });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao processar simulação na IA' });
    }
}
