-- Migración: Agregar campos para restablecimiento de contraseña
-- Fecha: 2026-03-12

-- Agregar columnas para reset token
ALTER TABLE usuarios 
ADD COLUMN reset_token VARCHAR(64) NULL,
ADD COLUMN reset_token_expiry DATETIME NULL;

-- Crear índice para búsqueda eficiente de tokens
CREATE INDEX idx_usuarios_reset_token ON usuarios(reset_token);
