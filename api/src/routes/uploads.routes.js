const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { auth, isAdminOrVendedor } = require('../middleware/auth.middleware');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/productos');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Crear el directorio si no existe
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WebP, GIF).'));
    }
  }
});

// POST /api/uploads/imagen
router.post('/imagen', auth, isAdminOrVendedor, (req, res) => {
  upload.single('imagen')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'La imagen supera el tamaño máximo de 5 MB.'
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error al procesar la imagen.'
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo.'
      });
    }

    const url = `/uploads/productos/${req.file.filename}`;
    res.status(201).json({
      success: true,
      data: { url }
    });
  });
});

module.exports = router;
