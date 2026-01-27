'use client';

export default function GlobalError({ error, reset }) {
    return (
        <html>
            <body className="bg-black text-white flex flex-col items-center justify-center h-screen p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Bir şeyler ters gitti!</h2>
                <p className="text-gray-400 mb-4">{error.message || 'Bilinmeyen bir hata oluştu.'}</p>
                <button
                    className="bg-yellow-500 text-black font-bold py-2 px-6 rounded hover:bg-yellow-400 transition"
                    onClick={() => reset()}
                >
                    Tekrar Dene
                </button>
            </body>
        </html>
    );
}
