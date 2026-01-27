// Yerleşik fetch kullanımı (Node 18+)

const apiKey = "AIzaSyA8jCu32Ei9yHo-2vtH8AwDOsDexRUHCIE";

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error listing models:", err.message);
    }
}

listModels();
