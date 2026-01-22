const { PDFDocument } = PDFLib;

// PDF Compressor Logic
async function compressPDF() {
    const fileInput = document.getElementById('pdf-input');
    if (!fileInput.files[0]) return;

    // Note: True compression client-side is hard. We will optimize by rewriting the PDF
    // which often drops unused objects. For real compression, normally ghostscript is needed server-side.
    // This is a "best effort" client-side optimization.

    try {
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();

        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Flatten forms/annotations to save space
        // pdfDoc.getForm().flatten(); // Only if form exists

        const pdfBytes = await pdfDoc.save({ useObjectStreams: true }); // Object streams help compression
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `optimized-${file.name}`;
        link.onload = () => { URL.revokeObjectURL(link.href) }; // Free memory
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        document.getElementById('status-msg').textContent = "PDF Processed! (Optimized structure)";
        document.getElementById('status-msg').classList.remove('hidden', 'text-gray-500');
        document.getElementById('status-msg').classList.add('text-green-400');

    } catch (e) {
        console.error(e);
        alert("Error processing PDF");
    }
}

// Convert Helpers (Mock/Basic Text Extraction for PDF->Word)
// Real PDF->Word is extremely complex for client-side JS.
// We will focus on the UI and specific limitations or text-extraction libraries if requested,
// but for now, we'll setup the structure.
