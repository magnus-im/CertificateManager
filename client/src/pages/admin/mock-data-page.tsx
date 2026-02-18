
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Database, Trash2, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminMockDataPage() {
    const { toast } = useToast();
    const [lastAction, setLastAction] = useState<"generated" | "cleared" | null>(null);

    // Mutation to generate mock data
    const generateMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('POST', '/api/admin/mock-data');
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao gerar dados mock');
            }
            return response.json();
        },
        onSuccess: (data) => {
            setLastAction("generated");
            toast({
                title: "Dados Mock Gerados",
                description: data.message || "Os dados mock foram gerados com sucesso.",
                variant: "default",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro ao gerar dados",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    // Mutation to clear mock data
    const clearMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('DELETE', '/api/admin/mock-data');
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao limpar dados mock');
            }
            return response.json();
        },
        onSuccess: (data) => {
            setLastAction("cleared");
            toast({
                title: "Dados Mock Removidos",
                description: data.message || "Os dados mock foram removidos com sucesso.",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro ao limpar dados",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const isLoading = generateMutation.isPending || clearMutation.isPending;

    return (
        <AdminLayout>
            <div className="container mx-auto py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Gerenciador de Dados Mock</h1>
                    <p className="text-muted-foreground mt-2">
                        Ferramentas para gerar e limpar dados de teste no sistema.
                        Estes dados são isolados no tenant "Empresa Mock".
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Gerar Dados
                            </CardTitle>
                            <CardDescription>
                                Cria um conjunto completo de dados para testes, incluindo:
                                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                    <li>Tenant Mock e Usuários</li>
                                    <li>Produtos, Categorias e Famílias</li>
                                    <li>Fornecedores, Fabricantes e Clientes</li>
                                    <li>Certificados de Entrada e Emitidos</li>
                                </ul>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => generateMutation.mutate()}
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <Database className="mr-2 h-4 w-4" />
                                        Gerar Dados Mock
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5" />
                                Limpar Dados
                            </CardTitle>
                            <CardDescription>
                                Remove APENAS os dados gerados automaticamente (Tenant Mock e relacionados).
                                Dados de outros tenants não serão afetados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => clearMutation.mutate()}
                                disabled={isLoading}
                                variant="destructive"
                                className="w-full"
                            >
                                {clearMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Limpando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Limpar Dados Mock
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {lastAction === "generated" && (
                    <Alert className="mt-8 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Dados gerados com sucesso!</AlertTitle>
                        <AlertDescription className="text-green-700 mt-2">
                            Você pode acessar o sistema com o usuário <strong>admin_mock</strong> e senha <strong>mock123</strong> (se logar diretamente) ou
                            navegar pelo painel de admin para ver os dados criados.
                        </AlertDescription>
                    </Alert>
                )}

                {lastAction === "cleared" && (
                    <Alert className="mt-8">
                        <Trash2 className="h-4 w-4" />
                        <AlertTitle>Dados limpos!</AlertTitle>
                        <AlertDescription>
                            Todos os dados do tenant de teste foram removidos do sistema.
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Como usar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            1. <strong>Evite gerar dados duplicados</strong>: O sistema impedirá que você gere dados se o tenant de mock já existir.
                            Nesse caso, limpe os dados primeiro.
                        </p>
                        <p>
                            2. <strong>Segurança</strong>: Esta funcionalidade só está disponível para administradores globais do sistema.
                        </p>
                        <p>
                            3. <strong>Escopo</strong>: A limpeza de dados é "em cascata". Isso significa que ao deletar o tenant de mock,
                            todos os certificados, produtos e usuários vinculados a ele também serão excluídos.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
