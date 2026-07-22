import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const scratchDir = path.resolve('scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

// 1. Generate 1x1 PNG image
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
fs.writeFileSync(path.join(scratchDir, 'test.png'), Buffer.from(pngBase64, 'base64'));
console.log('Generated test.png');

// 2. Generate a valid simple DOCX file using jszip
async function generateDocx() {
  const zip = new JSZip();

  // Add [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/markup-compatibility/2006">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  // Add _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // Add word/document.xml
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Project Title: Mid-Century Furniture Vintage Store</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Target Audience: Interior design lovers and premium collectors who value high-end curation</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Core User Flow: Browse catalog, filter by decade/designer, customize wood finishes, view in immersive 3D, and complete checkout</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Must-Have Features: Interactive 3D Hero Canvas, Product Search &amp; Filter Grid, Shopping Cart &amp; Pre-Order Checkout</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(scratchDir, 'test.docx'), buffer);
  console.log('Generated test.docx');
}

generateDocx().catch(console.error);
