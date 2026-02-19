import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText, LinkIcon, Search, Trash2, Unlink, FileOutput, Eye } from "lucide-react";
import { format } from "date-fns";
import { Product } from "@shared/schema";
import { IssueCertificateForm } from "@/components/certificates/issue-certificate-form";

interface IssuanceQueueItem {
    id: number;
    status: string;
    priority: number;
    createdAt: string;
    updatedAt: string;
    errorMessage?: string;
    invoiceItem: {
        id: number;
        sequenceNumber?: number;
        productCode: string;
        productName: string;
        quantity: string;
        unit: string;
        unitValue: string;
    };
    invoice: {
        id: number;
        number: string;
        series: string;
        issuerName: string;
        issuerCnpj: string;
        recipientName: string;
        recipientCnpj: string;
        emissionDate: string;
    };
}

// Sub-component: Lot Selector for certificate issuance
function LotSelector({ queueId, onSelectLot }: { queueId: number; onSelectLot: (lotId: number) => void }) {
    const { data: lots, isLoading } = useQuery<any[]>({
        queryKey: [`/api/nfe/queue/${queueId}/lots`],
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!lots || lots.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground border rounded-md bg-yellow-50">
                <p className="font-medium text-yellow-600">⚠️ Nenhum lote disponível para este produto.</p>
                <p className="text-sm mt-1">Verifique se existe um boletim de entrada com saldo para o produto vinculado.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium">Selecione o boletim de entrada (lote):</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {lots.map((lot: any) => (
                    <button
                        key={lot.id}
                        type="button"
                        className="w-full text-left p-3 border rounded-md hover:bg-accent hover:border-primary/50 transition-colors"
                        onClick={() => onSelectLot(lot.id)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium">Lote: {lot.internalLot}</span>
                                <p className="text-xs text-muted-foreground">
                                    Validade: {lot.expirationDate ? format(new Date(lot.expirationDate), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-green-600">{lot.balance} {lot.measureUnit}</span>
                                <p className="text-xs text-muted-foreground">disponível</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function NfeImportPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedQueueItem, setSelectedQueueItem] = useState<IssuanceQueueItem | null>(null); // For Mapping
    const [issuingItem, setIssuingItem] = useState<IssuanceQueueItem | null>(null); // For Certificate Issuance
    const [selectedLotId, setSelectedLotId] = useState<number | null>(null); // Selected entry certificate for issuance
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [productSearch, setProductSearch] = useState("");

    // Fetch Queue
    const { data: queue, isLoading: isLoadingQueue } = useQuery<IssuanceQueueItem[]>({
        queryKey: ["/api/nfe/queue"],
    });

    // Fetch Products for Mapping
    const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
        queryKey: ["/api/products"],
    });

    // Filter products for dropdown
    const filteredProducts = products?.filter(p =>
        p.technicalName.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.internalCode && p.internalCode.toLowerCase().includes(productSearch.toLowerCase()))
    ) || [];

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('xml', file);
            const response = await fetch('/api/nfe/import', { method: 'POST', body: formData });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao importar XML');
            }
            return response.json();
        },
        onSuccess: (data) => {
            toast({ title: "Sucesso", description: data.message });
            queryClient.invalidateQueries({ queryKey: ["/api/nfe/queue"] });
        },
        onError: (error: Error) => {
            toast({ title: "Erro na importação", description: error.message, variant: "destructive" });
        },
        onSettled: () => setIsUploading(false)
    });

    // Mapping Mutation
    const mappingMutation = useMutation({
        mutationFn: async ({ queueId, productId }: { queueId: number, productId: number }) => {
            const response = await fetch('/api/nfe/mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queueId, productId }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao salvar mapeamento');
            }
            return response.json();
        },
        onSuccess: (data) => {
            toast({ title: "Mapeamento salvo", description: data.message });
            queryClient.invalidateQueries({ queryKey: ["/api/nfe/queue"] });
            setSelectedQueueItem(null);
            setSelectedProductId("");
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao mapear", description: error.message, variant: "destructive" });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (queueId: number) => {
            const response = await fetch(`/api/nfe/queue/${queueId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao excluir item');
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "Item excluído" });
            queryClient.invalidateQueries({ queryKey: ["/api/nfe/queue"] });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    // Unlink Mutation
    const unlinkMutation = useMutation({
        mutationFn: async (queueId: number) => {
            const response = await fetch(`/api/nfe/queue/${queueId}/unlink`, { method: 'POST' });
            if (!response.ok) throw new Error('Erro ao desvincular');
            return response.json();
        },
        onSuccess: (data) => {
            toast({ title: "Desvinculado", description: data.message });
            queryClient.invalidateQueries({ queryKey: ["/api/nfe/queue"] });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    const handleResolveMapping = () => {
        if (selectedQueueItem && selectedProductId) {
            mappingMutation.mutate({
                queueId: selectedQueueItem.id,
                productId: parseInt(selectedProductId)
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'READY':
                return <Badge className="bg-green-500 hover:bg-green-600">Pronto</Badge>;
            case 'MAPPING_REQUIRED':
                return <Badge variant="destructive">Mapeamento</Badge>;
            case 'MANUAL_REVIEW':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Revisão Manual</Badge>;
            case 'PENDING':
                return <Badge variant="secondary">Pendente</Badge>;
            case 'ISSUED':
                return <Badge variant="outline" className="border-green-500 text-green-500">Emitido</Badge>;
            case 'ERROR':
                return <Badge variant="destructive">Erro</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Importação de NF-e</h1>
                        <p className="text-muted-foreground">Importe notas fiscais (XML) e gerencie a fila de emissão de certificados.</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" disabled={isUploading} className="relative cursor-pointer">
                            <input
                                type="file"
                                id="nfe-upload"
                                accept=".xml"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Importar XML
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Fila de Processamento</CardTitle>
                        <CardDescription>Itens importados aguardando emissão ou ação do usuário.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingQueue ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : queue?.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Nenhuma nota importada ou fila vazia.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data/Hora</TableHead>
                                            <TableHead>Nota Fiscal</TableHead>
                                            <TableHead>Destinatário</TableHead>
                                            <TableHead className="text-center">Seq.</TableHead>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Qtd.</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {queue?.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.invoice.number}-{item.invoice.series}</span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={item.invoice.issuerName}>
                                                            {item.invoice.issuerName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="truncate max-w-[150px] block" title={item.invoice.recipientName}>
                                                        {item.invoice.recipientName}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.invoiceItem.sequenceNumber || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">{item.invoiceItem.productCode}</span>
                                                        <span className="font-medium truncate max-w-[200px]" title={item.invoiceItem.productName}>
                                                            {item.invoiceItem.productName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {item.invoiceItem.quantity} {item.invoiceItem.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(item.status)}
                                                    {item.errorMessage && (
                                                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={item.errorMessage}>
                                                            {item.errorMessage}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {/* Vincular - para MAPPING_REQUIRED */}
                                                        {item.status === 'MAPPING_REQUIRED' && (
                                                            <Button size="sm" variant="secondary" onClick={() => {
                                                                setSelectedQueueItem(item);
                                                                setProductSearch("");
                                                                setSelectedProductId("");
                                                            }} title="Vincular Produto">
                                                                <LinkIcon className="h-4 w-4 mr-1" />
                                                                Vincular
                                                            </Button>
                                                        )}

                                                        {/* Desvincular - para READY ou MANUAL_REVIEW */}
                                                        {(item.status === 'READY' || item.status === 'MANUAL_REVIEW') && (
                                                            <Button size="sm" variant="ghost" onClick={() => {
                                                                if (confirm("Deseja desvincular este produto?")) {
                                                                    unlinkMutation.mutate(item.id);
                                                                }
                                                            }} title="Desvincular Produto">
                                                                <Unlink className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Emitir - para READY ou MANUAL_REVIEW */}
                                                        {(item.status === 'READY' || item.status === 'MANUAL_REVIEW') && (
                                                            <Button size="sm" variant="outline" onClick={() => setIssuingItem(item)} title="Emitir Certificado">
                                                                <FileOutput className="h-4 w-4 mr-1" />
                                                                Emitir
                                                            </Button>
                                                        )}

                                                        {/* Ver Certificado - para ISSUED */}
                                                        {item.status === 'ISSUED' && (
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                window.location.href = '/issued-certificates';
                                                            }} title="Ver Boletins Emitidos">
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Ver
                                                            </Button>
                                                        )}

                                                        {/* Excluir - para todos os status */}
                                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => {
                                                            if (confirm("Deseja realmente excluir este item da fila?")) {
                                                                deleteMutation.mutate(item.id);
                                                            }
                                                        }} title="Excluir">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Mapping Dialog */}
                <Dialog open={!!selectedQueueItem} onOpenChange={(open) => !open && setSelectedQueueItem(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Vincular Produto</DialogTitle>
                            <DialogDescription>
                                Vincule o produto da nota fiscal a um produto interno para permitir a emissão do certificado.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedQueueItem && (
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Dados do XML</h4>
                                    <div className="text-sm text-muted-foreground rounded-md bg-muted p-3">
                                        <p><span className="font-semibold">Código:</span> {selectedQueueItem.invoiceItem.productCode}</p>
                                        <p><span className="font-semibold">Descrição:</span> {selectedQueueItem.invoiceItem.productName}</p>
                                        <p><span className="font-semibold">Emitente:</span> {selectedQueueItem.invoice.issuerName}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Produto Interno Correspondente</h4>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Search className="w-4 h-4 opacity-50" />
                                        <Input
                                            placeholder="Buscar produto..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um produto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingProducts ? (
                                                <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                            ) : filteredProducts.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">Nenhum produto encontrado.</div>
                                            ) : (
                                                filteredProducts.slice(0, 50).map((product) => (
                                                    <SelectItem key={product.id} value={product.id.toString()}>
                                                        {product.technicalName} ({product.internalCode || 'S/ Cód'})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Este vínculo será salvo para futuras importações deste emitente e produto.
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedQueueItem(null)}>Cancelar</Button>
                            <Button onClick={handleResolveMapping} disabled={mappingMutation.isPending || !selectedProductId}>
                                {mappingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Vínculo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Certificate Issuance Dialog */}
                <Dialog open={!!issuingItem} onOpenChange={(open) => { if (!open) { setIssuingItem(null); setSelectedLotId(null); } }}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Emitir Certificado</DialogTitle>
                            <DialogDescription>
                                NF-e {issuingItem?.invoice.number}-{issuingItem?.invoice.series} • Item {issuingItem?.invoiceItem.sequenceNumber || '-'}: {issuingItem?.invoiceItem.productName}
                            </DialogDescription>
                        </DialogHeader>

                        {issuingItem && (
                            <>
                                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                                    <p><span className="font-semibold">Destinatário:</span> {issuingItem.invoice.recipientName}</p>
                                    <p><span className="font-semibold">Quantidade:</span> {issuingItem.invoiceItem.quantity} {issuingItem.invoiceItem.unit}</p>
                                    <p><span className="font-semibold">NF-e:</span> {issuingItem.invoice.number}</p>
                                </div>

                                {!selectedLotId ? (
                                    <LotSelector
                                        queueId={issuingItem.id}
                                        onSelectLot={(lotId) => setSelectedLotId(lotId)}
                                    />
                                ) : (
                                    <IssueCertificateForm
                                        entryCertificateId={selectedLotId}
                                        defaultValues={{
                                            invoiceNumber: issuingItem.invoice.number,
                                            soldQuantity: issuingItem.invoiceItem.quantity,
                                            measureUnit: issuingItem.invoiceItem.unit,
                                        }}
                                        onSuccess={(data) => {
                                            setIssuingItem(null);
                                            setSelectedLotId(null);
                                            queryClient.invalidateQueries({ queryKey: ["/api/nfe/queue"] });
                                            // Redirecionar para o certificado emitido
                                            if (data && data.id) {
                                                window.location.href = `/issued-certificates/${data.id}`;
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
