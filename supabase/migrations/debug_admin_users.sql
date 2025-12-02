-- Debug e correção de usuários administradores

-- 1. Verificar usuários existentes e seus status de admin
SELECT 
    id,
    email,
    nome,
    is_admin,
    ativo,
    created_at
FROM usuarios 
ORDER BY created_at;

-- 2. Verificar quantos usuários são admin
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as usuarios_admin,
    COUNT(CASE WHEN is_admin = false OR is_admin IS NULL THEN 1 END) as usuarios_normais
FROM usuarios;

-- 3. Se não houver nenhum admin, definir o primeiro usuário como admin
-- (Descomente a linha abaixo se necessário)
-- UPDATE usuarios SET is_admin = true WHERE id = (SELECT id FROM usuarios ORDER BY created_at LIMIT 1);

-- 4. Verificar pacientes por usuário para debug
SELECT 
    u.id as usuario_id,
    u.email,
    u.nome,
    u.is_admin,
    COUNT(p.id_paciente) as total_pacientes
FROM usuarios u
LEFT JOIN dpacientes p ON u.id = p.usuario_id AND p.ativo = true
GROUP BY u.id, u.email, u.nome, u.is_admin
ORDER BY u.created_at;