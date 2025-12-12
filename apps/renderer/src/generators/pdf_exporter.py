"""
PDF Exporter - Converts PPTX to PDF
"""

from io import BytesIO
from typing import Optional
import subprocess
import tempfile
import os


class PDFExporter:
    """Export presentations to PDF format"""

    def convert_pptx_to_pdf(self, pptx_buffer: bytes) -> bytes:
        """
        Convert PPTX buffer to PDF buffer.
        
        In production, this would use LibreOffice or a similar tool.
        For now, returns a placeholder message.
        """
        try:
            # Try using LibreOffice if available
            return self._convert_with_libreoffice(pptx_buffer)
        except Exception:
            # Fallback: return a simple PDF placeholder
            return self._create_placeholder_pdf()

    def _convert_with_libreoffice(self, pptx_buffer: bytes) -> bytes:
        """Use LibreOffice to convert PPTX to PDF"""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save PPTX to temp file
            pptx_path = os.path.join(tmpdir, "presentation.pptx")
            with open(pptx_path, "wb") as f:
                f.write(pptx_buffer)

            # Convert using LibreOffice
            result = subprocess.run(
                [
                    "libreoffice",
                    "--headless",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    tmpdir,
                    pptx_path,
                ],
                capture_output=True,
                timeout=60,
            )

            if result.returncode != 0:
                raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")

            # Read PDF
            pdf_path = os.path.join(tmpdir, "presentation.pdf")
            with open(pdf_path, "rb") as f:
                return f.read()

    def _create_placeholder_pdf(self) -> bytes:
        """Create a placeholder PDF when conversion is not available"""
        # Simple PDF structure
        pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 89 >>
stream
BT
/F1 24 Tf
100 700 Td
(PDF Export - Install LibreOffice for full support) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000406 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
478
%%EOF
"""
        return pdf_content
