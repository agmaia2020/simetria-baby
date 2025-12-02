-- Atualizar pacientes órfãos (sem usuario_id) para o usuário administrador
UPDATE dpacientes 
SET usuario_id = (
    SELECT id 
    FROM usuarios 
    WHERE is_admin = true 
    LIMIT 1
)
WHERE ativo = true AND usuario_id IS NULL;

-- Verificar o resultado
SELECT 
    'Pacientes atualizados' as status,
    COUNT(*) as total_pacientes_ativos,
    COUNT(usuario_id) as pacientes_com_usuario,
    COUNT(*) - COUNT(usuario_id) as pacientes_sem_usuario
FROM dpacientes 
WHERE ativo = true;