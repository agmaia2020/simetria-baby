import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validateCrefito, normalizeCrefito } from "@/utils/crefito";
import { validateEspecialidade, normalizeEspecialidade, formatEspecialidade } from "@/utils/especialidade";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [crefitoNumber, setCrefitoNumber] = useState<string>("");
  const [crefitoInput, setCrefitoInput] = useState<string>("");
  const [crefitoLoading, setCrefitoLoading] = useState<boolean>(false);
  const [crefitoError, setCrefitoError] = useState<string>("");
  const [crefitoEditing, setCrefitoEditing] = useState<boolean>(false);
  const [especialidade, setEspecialidade] = useState<string>("");
  const [especialidadeInput, setEspecialidadeInput] = useState<string>("");
  const [especialidadeLoading, setEspecialidadeLoading] = useState<boolean>(false);
  const [especialidadeError, setEspecialidadeError] = useState<string>("");
  const [especialidadeEditing, setEspecialidadeEditing] = useState<boolean>(false);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Carregar dados do usuário da tabela usuarios
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        setUserDataLoading(true);
        const { data: nomeData, error: nomeError } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', user.id)
          .maybeSingle();
        
        if (nomeError) {
          console.error('Erro ao carregar nome do usuário:', nomeError);
          const metaName = (user as unknown as {user_metadata?: {name?: string; full_name?: string}}).user_metadata?.name 
            || (user as unknown as {user_metadata?: {name?: string; full_name?: string}}).user_metadata?.full_name 
            || user.email 
            || '';
          setUserName(metaName);
        } else {
          const nome = (nomeData as {nome?: string})?.nome;
          const metaName = (user as unknown as {user_metadata?: {name?: string; full_name?: string}}).user_metadata?.name 
            || (user as unknown as {user_metadata?: {name?: string; full_name?: string}}).user_metadata?.full_name 
            || user.email 
            || '';
          setUserName(nome || metaName);
          try {
            const { data: profileData } = await supabase
              .from('usuarios')
              .select('crefito_number, especialidade')
              .eq('id', user.id)
              .maybeSingle();
            const cref = (profileData as {crefito_number?: string})?.crefito_number || "";
            const esp = (profileData as {especialidade?: string})?.especialidade || "";
            setCrefitoNumber(cref);
            setCrefitoInput(cref);
            setEspecialidade(esp);
            setEspecialidadeInput(esp);
          } catch {}
        }
        // Validação: evitar exibir e-mail no campo de nome
        if (userName && userName.includes('@')) {
          const { data: authUser } = await supabase.auth.getUser();
          const metaName2 = authUser?.user?.user_metadata?.full_name 
            || authUser?.user?.user_metadata?.name 
            || '';
          if (metaName2) setUserName(metaName2);
        }
      } catch (error) {
        console.error('Erro inesperado ao carregar dados do usuário:', error);
        setUserName('');
      } finally {
        setUserDataLoading(false);
      }
    };
    
    loadUserData();
  }, [user?.id]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'crefitoInput') {
      const { valid, errors, value: v } = validateCrefito(value);
      setCrefitoInput(v);
      setCrefitoError(valid ? '' : errors[0]);
      return;
    }
    if (name === 'especialidadeInput') {
      const { valid, errors, value: v } = validateEspecialidade(value, false);
      setEspecialidadeInput(v);
      setEspecialidadeError(valid ? '' : errors[0]);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveCrefito = async () => {
    if (!user?.id) return;
    const { valid, errors, value: v } = validateCrefito(crefitoInput);
    if (!valid) {
      toast.error('Corrija o Crefito Nº antes de salvar');
      setCrefitoError(errors[0]);
      return;
    }
    setCrefitoLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ crefito_number: v })
        .eq('id', user.id)
        .select('id, crefito_number')
        .maybeSingle();
      if (error || !data || (data as {crefito_number?: string}).crefito_number !== v) {
        // Fallback para salvar em metadados quando coluna não existir
        const isMissingColumn = String(error?.message || '').toLowerCase().includes('column')
        if (isMissingColumn) {
          const { error: metaErr } = await supabase.auth.updateUser({ data: { crefito_number: v } });
          if (metaErr) {
            toast.error('Erro ao salvar Crefito Nº');
          } else {
            setCrefitoNumber(v);
            setCrefitoEditing(false);
            toast.success('Crefito Nº salvo no perfil');
          }
        } else {
          toast.error('Erro ao salvar Crefito Nº no banco');
        }
      } else {
        setCrefitoNumber(v);
        setCrefitoEditing(false);
        toast.success('Crefito Nº atualizado com sucesso no banco');
      }
    } catch (err) {
      toast.error('Falha de conexão ao salvar Crefito Nº');
    } finally {
      setCrefitoLoading(false);
    }
  };

  const saveEspecialidade = async () => {
    if (!user?.id) return;
    const { valid, errors, value: v } = validateEspecialidade(especialidadeInput, true);
    if (!valid) {
      setEspecialidadeError(errors[0]);
      toast.error('Corrija a Especialidade antes de salvar');
      return;
    }
    setEspecialidadeLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ especialidade: formatEspecialidade(v) })
        .eq('id', user.id)
        .select('id, especialidade')
        .maybeSingle();
      if (error || !data || (data as {especialidade?: string}).especialidade !== formatEspecialidade(v)) {
        const isMissingColumn = String(error.message || '').toLowerCase().includes('column')
        if (isMissingColumn) {
          const { error: metaErr } = await supabase.auth.updateUser({ data: { especialidade: formatEspecialidade(v) } });
          if (metaErr) {
            toast.error('Erro ao salvar Especialidade');
          } else {
            setEspecialidade(formatEspecialidade(v));
            setEspecialidadeEditing(false);
            toast.success('Especialidade salva no perfil');
          }
        } else {
          toast.error('Erro ao salvar Especialidade');
        }
      } else {
        setEspecialidade(formatEspecialidade(v));
        setEspecialidadeEditing(false);
        toast.success('Especialidade atualizada com sucesso no banco');
      }
    } catch {
      toast.error('Falha de conexão ao salvar Especialidade');
    } finally {
      setEspecialidadeLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword) {
      toast.error("Digite sua senha atual");
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    
    try {
      // Primeiro, re-autentica o usuário com a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: formData.currentPassword
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Se a re-autenticação foi bem-sucedida, atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        toast.error("Erro ao alterar senha: " + updateError.message);
      } else {
        toast.success("Senha alterada com sucesso!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Meu Perfil">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Informações da Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={userDataLoading ? "Carregando..." : userName}
                disabled
                className="bg-gray-50 text-[14px]"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="created">Data de Cadastro</Label>
              <Input
                id="created"
                value={new Date(user.created_at).toLocaleDateString('pt-BR')}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="crefitoInput">Crefito Nº</Label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <Input
                  id="crefitoInput"
                  name="crefitoInput"
                  value={crefitoInput}
                  onChange={handleInputChange}
                  aria-invalid={!!crefitoError}
                  aria-describedby="crefito-help"
                  placeholder="Ex.: 123456F"
                  className={`sm:w-64 text-[14px] ${crefitoEditing || !crefitoNumber ? '' : 'bg-gray-50'} ${crefitoError ? 'border-red-500' : ''}`}
                  disabled={!crefitoEditing && !!crefitoNumber}
                />
                <div className="flex items-center gap-2">
                  {!crefitoNumber ? (
                    <Button
                      type="button"
                      variant="default"
                      disabled={crefitoLoading || !!crefitoError || !normalizeCrefito(crefitoInput)}
                      onClick={saveCrefito}
                    >
                      {crefitoLoading ? 'Salvando...' : 'Inserir'}
                    </Button>
                  ) : (
                    <>
                      {!crefitoEditing ? (
                        <Button type="button" variant="secondary" onClick={() => setCrefitoEditing(true)}>Editar</Button>
                      ) : (
                        <>
                          <Button type="button" variant="default" disabled={crefitoLoading || !!crefitoError || !crefitoInput} onClick={saveCrefito}>
                            {crefitoLoading ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => { setCrefitoEditing(false); setCrefitoInput(crefitoNumber); setCrefitoError(''); }}>Cancelar</Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p id="crefito-help" className="text-xs text-gray-500 mt-1">Somente letras e números, entre 5 e 12 caracteres. Exemplo: 123456F</p>
              {crefitoError && <p className="text-xs text-red-600 mt-1" role="alert">{crefitoError}</p>}
            </div>
            <div>
              <Label htmlFor="especialidadeInput">Especialidade</Label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <Input
                  id="especialidadeInput"
                  name="especialidadeInput"
                  value={especialidadeInput}
                  onChange={handleInputChange}
                  aria-invalid={!!especialidadeError}
                  aria-describedby="especialidade-help"
                  placeholder="Ex.: Fisioterapeuta Neurofuncional"
                  className={`sm:w-80 text-[14px] ${especialidadeEditing || !especialidade ? '' : 'bg-gray-50'} ${especialidadeError ? 'border-red-500' : ''}`}
                  disabled={!especialidadeEditing && !!especialidade}
                  required
                />
                <div className="flex items-center gap-2">
                  {!especialidade ? (
                    <Button type="button" variant="default" disabled={especialidadeLoading || !!especialidadeError || !normalizeEspecialidade(especialidadeInput)} onClick={saveEspecialidade}>
                      {especialidadeLoading ? 'Salvando...' : 'Inserir'}
                    </Button>
                  ) : (
                    <>
                      {!especialidadeEditing ? (
                        <Button type="button" variant="secondary" onClick={() => setEspecialidadeEditing(true)}>Editar</Button>
                      ) : (
                        <>
                          <Button type="button" variant="default" disabled={especialidadeLoading || !!especialidadeError || !normalizeEspecialidade(especialidadeInput)} onClick={saveEspecialidade}>
                            {especialidadeLoading ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => { setEspecialidadeEditing(false); setEspecialidadeInput(especialidade); setEspecialidadeError(''); }}>Cancelar</Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p id="especialidade-help" className="text-xs text-gray-500 mt-1">Campo obrigatório. Use apenas letras, espaços e hífen. Ex.: Fisioterapeuta Neurofuncional</p>
              {especialidadeError && <p className="text-xs text-red-600 mt-1" role="alert">{especialidadeError}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                    className="pr-10"
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    className="pr-10"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="pr-10"
                    placeholder="Digite a nova senha novamente"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserProfile;