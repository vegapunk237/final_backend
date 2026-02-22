const fs = require('fs').promises;
const path = require('path');

// Décoder base64 → buffer
const base64ToBuffer = (base64) => {
  const data = base64.split(';base64,').pop();
  return Buffer.from(data, 'base64');
};

// Sauvegarde CV
async function saveCvFile(base64, originalName, teacherId) {
  const cvDir = path.join(__dirname, '../uploads/cvs');
  await fs.mkdir(cvDir, { recursive: true });

  const fileName = `cv_${teacherId}_${originalName}`;
  const filePath = path.join(cvDir, fileName);

  const buffer = base64ToBuffer(base64);
  await fs.writeFile(filePath, buffer);

  return fileName;
}

// Sauvegarde documents obligatoires
async function saveDocuments(documents, teacherId) {
  const docsDir = path.join(__dirname, `../uploads/documents/${teacherId}`);
  await fs.mkdir(docsDir, { recursive: true });

  const savedDocs = [];

  for (const doc of documents) {
    const filePath = path.join(docsDir, doc.fileName);
    const buffer = base64ToBuffer(doc.file);

    await fs.writeFile(filePath, buffer);

    savedDocs.push({
      type: doc.type,
      fileName: doc.fileName,
      path: `uploads/documents/${teacherId}/${doc.fileName}`
    });
  }

  return savedDocs;
}

module.exports = {
  saveCvFile,
  saveDocuments
};
