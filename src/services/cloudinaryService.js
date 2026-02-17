/**
 * SERVIÇO DE UPLOAD CLOUDINARY
 */

const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

/**
 * Faz upload de um arquivo
 */
async function uploadFile(file, folder = 'card-flags') {
    try {
        // Detecta se é PDF
        const isPDF = file.mimetype === 'application/pdf';

        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: isPDF ? 'raw' : 'auto', // ← MUDANÇA AQUI
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            // Adiciona configurações para PDFs
            ...(isPDF && {
                flags: 'attachment', // Força download ao invés de exibir inline
                access_mode: 'public'
            })
        });

        // Deleta arquivo temporário
        await fs.unlink(file.path);

        return {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            size: result.bytes,
            resource_type: result.resource_type // ← ADICIONE ISTO
        };
    } catch (error) {
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {
            console.error('Erro ao deletar arquivo temporário:', unlinkError);
        }

        throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
}

/**
 * Faz upload de múltiplos arquivos
 */
async function uploadMultipleFiles(files) {
    try {
        if (!files.document || !files.invoice || !files.energy_bill) {
            throw new Error('Todos os arquivos são obrigatórios');
        }

        const [documentResult, invoiceResult, energyBillResult] = await Promise.all([
            uploadFile(files.document[0], 'card-flags/documents'),
            uploadFile(files.invoice[0], 'card-flags/invoices'),
            uploadFile(files.energy_bill[0], 'card-flags/energy-bills')
        ]);

        return {
            document_url: documentResult.url,
            invoice_url: invoiceResult.url,
            energy_bill_url: energyBillResult.url
        };
    } catch (error) {
        throw new Error(`Erro ao processar uploads: ${error.message}`);
    }
}

/**
 * Deleta arquivo do Cloudinary
 */
async function deleteFile(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
}

/**
 * Limpa arquivos temporários
 */
async function cleanupTempFiles(files) {
    try {
        if (!files) return;

        const deletePromises = [];

        if (files.document && files.document[0]) {
            deletePromises.push(fs.unlink(files.document[0].path).catch(() => { }));
        }
        if (files.invoice && files.invoice[0]) {
            deletePromises.push(fs.unlink(files.invoice[0].path).catch(() => { }));
        }
        if (files.energy_bill && files.energy_bill[0]) {
            deletePromises.push(fs.unlink(files.energy_bill[0].path).catch(() => { }));
        }

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Erro ao limpar arquivos temporários:', error);
    }
}

/**
 * Extrai public_id de uma URL do Cloudinary
 */
function extractPublicId(url) {
    try {
        // URL exemplo: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');

        if (uploadIndex === -1) return null;

        // Pega tudo depois de 'upload/v1234567890/'
        const pathParts = parts.slice(uploadIndex + 2); // Pula 'upload' e versão
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extensão

        return publicId;
    } catch (error) {
        console.error('Erro ao extrair public_id:', error);
        return null;
    }
}

/**
 * Deleta arquivo antigo e faz upload do novo
 */
async function replaceFile(oldUrl, newFile, folder) {
    try {
        // Faz upload do novo arquivo
        const uploadResult = await uploadFile(newFile, folder);

        // Deleta o arquivo antigo
        if (oldUrl) {
            const publicId = extractPublicId(oldUrl);
            if (publicId) {
                await deleteFile(publicId);
                console.log(`✅ Arquivo antigo deletado: ${publicId}`);
            }
        }

        return uploadResult;
    } catch (error) {
        throw new Error(`Erro ao substituir arquivo: ${error.message}`);
    }
}

module.exports = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    cleanupTempFiles,
    extractPublicId,
    replaceFile
};