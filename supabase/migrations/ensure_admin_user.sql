-- Garantir que existe pelo menos um usuário administrador
-- Esta migração define o primeiro usuário (mais antigo) como admin se não houver nenhum

DO $$
DECLARE
    admin_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Contar quantos usuários admin existem
    SELECT COUNT(*) INTO admin_count 
    FROM usuarios 
    WHERE is_admin = true AND ativo = true;
    
    -- Se não houver nenhum admin, definir o primeiro usuário como admin
    IF admin_count = 0 THEN
        -- Buscar o ID do primeiro usuário (mais antigo)
        SELECT id INTO first_user_id 
        FROM usuarios 
        WHERE ativo = true 
        ORDER BY created_at 
        LIMIT 1;
        
        -- Se encontrou um usuário, torná-lo admin
        IF first_user_id IS NOT NULL THEN
            UPDATE usuarios 
            SET is_admin = true 
            WHERE id = first_user_id;
            
            RAISE NOTICE 'Usuário % definido como administrador', first_user_id;
        ELSE
            RAISE NOTICE 'Nenhum usuário encontrado para definir como admin';
        END IF;
    ELSE
        RAISE NOTICE 'Já existem % usuário(s) administrador(es)', admin_count;
    END IF;
END $$;

-- Verificar o resultado final
SELECT 
    id,
    email,
    nome,
    is_admin,
    ativo,
    created_at
FROM usuarios 
WHERE ativo = true
ORDER BY created_at;