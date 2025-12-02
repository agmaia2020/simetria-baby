-- Verificar e corrigir registros de dpacientes sem usuario_id
-- Associar pacientes órfãos ao usuário administrador

-- Primeiro, vamos ver quantos pacientes não têm usuario_id
SELECT 
    COUNT(*) as total_pacientes,
    COUNT(usuario_id) as pacientes_com_usuario,
    COUNT(*) - COUNT(usuario_id) as pacientes_sem_usuario
FROM dpacientes 
WHERE ativo = true;

-- Mostrar os pacientes sem usuario_id
SELECT id_paciente, nome, data_cadastro, usuario_id
FROM dpacientes 
WHERE ativo = true AND usuario_id IS NULL
ORDER BY data_cadastro;

-- Encontrar o usuário administrador
SELECT id, email, is_admin
FROM usuarios 
WHERE is_admin = true
LIMIT 1;

-- Atualizar pacientes sem usuario_id para o usuário administrador
-- (Descomente as linhas abaixo após verificar os dados)
/*
UPDATE dpacientes 
SET usuario_id = (
    SELECT id 
    FROM usuarios 
    WHERE is_admin = true 
    LIMIT 1
)
WHERE ativo = true AND usuario_id IS NULL;
*/

-- Verificar o resultado após a atualização
/*
SELECT 
    COUNT(*) as total_pacientes,
    COUNT(usuario_id) as pacientes_com_usuario,
    COUNT(*) - COUNT(usuario_id) as pacientes_sem_usuario
FROM dpacientes 
WHERE ativo = true;
*/