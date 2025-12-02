-- Definir o primeiro usuário como administrador se não houver nenhum admin
DO $$
BEGIN
    -- Verificar se já existe algum usuário admin
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE is_admin = true) THEN
        -- Definir o primeiro usuário (mais antigo) como admin
        UPDATE usuarios 
        SET is_admin = true 
        WHERE id = (SELECT id FROM usuarios ORDER BY created_at LIMIT 1);
        
        RAISE NOTICE 'Usuário administrador definido com sucesso!';
    ELSE
        RAISE NOTICE 'Já existe um usuário administrador.';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    id,
    email,
    nome,
    is_admin,
    ativo,
    created_at
FROM usuarios 
ORDER BY created_at;