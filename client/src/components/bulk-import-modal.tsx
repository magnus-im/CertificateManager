import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Upload, FileDown, AlertCircle, CheckCircle, XCircle, FileIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface BulkImportModalProps {
    entity: string; // 'suppliers', 'manufacturers', 'clients', etc.
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

interface ImportResult {
    total: number;
    processed: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
        row: number;
        message: string;
        data: any;
    }>;
}

export function BulkImportModal({ entity, trigger, onSuccess }: BulkImportModalProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<ImportResult | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setProgress(0);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const ext = droppedFile.name.split('.').pop()?.toLowerCase();
            if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
                setFile(droppedFile);
                setResult(null);
                setProgress(0);
            } else {
                toast({
                    title: "Formato inválido",
                    description: "Por favor, envie um arquivo .csv, .xlsx ou .xls",
                    variant: "destructive",
                });
            }
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await fetch(`/api/import/template/${entity}`);
            if (!response.ok) throw new Error("Erro ao baixar template");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `modelo_importacao_${entity}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível baixar o modelo.",
                variant: "destructive",
            });
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setProgress(10); // Iniciar progresso

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Simular progresso enquanto envia
            const progInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 300);

            const response = await fetch(`/api/import/${entity}`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progInterval);
            setProgress(100);

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data: ImportResult = await response.json();
            setResult(data);

            if (data.successCount > 0) {
                toast({
                    title: "Importação concluída",
                    description: `${data.successCount} registros importados com sucesso.`,
                });
                queryClient.invalidateQueries(); // Atualizar listas
                if (onSuccess) onSuccess();
            }

            if (data.errorCount > 0) {
                toast({
                    title: "Atenção",
                    description: `${data.errorCount} registros falharam. Verifique o relatório.`,
                    variant: "destructive",
                });
            }

        } catch (error: any) {
            toast({
                title: "Erro na importação",
                description: error.message || "Ocorreu um erro ao processar o arquivo.",
                variant: "destructive",
            });
            setProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setProgress(0);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Importar
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importação em Lote</DialogTitle>
                    <DialogDescription>
                        Faça upload de um arquivo CSV ou Excel para importar registros.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!result ? (
                        <>
                            {/* Área de Upload */}
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                    file ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50"
                                )}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileIcon className="h-10 w-10 text-primary" />
                                        <p className="font-medium text-sm">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-10 w-10 text-slate-300" />
                                        <p className="text-sm">Arraste um arquivo ou clique para selecionar</p>
                                        <p className="text-xs">Suporta .csv, .xlsx, .xls</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-xs flex items-center gap-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        downloadTemplate();
                                    }}
                                >
                                    <FileDown className="h-3 w-3" />
                                    Baixar Modelo de Exemplo
                                </Button>
                            </div>

                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Processando...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            )}
                        </>
                    ) : (
                        /* Resultados */
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-4 rounded-lg text-center border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
                                    <p className="text-2xl font-bold">{result.total}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                                    <p className="text-xs text-green-700 uppercase font-bold flex items-center justify-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Sucesso
                                    </p>
                                    <p className="text-2xl font-bold text-green-700">{result.successCount}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                                    <p className="text-xs text-red-700 uppercase font-bold flex items-center justify-center gap-1">
                                        <XCircle className="h-3 w-3" /> Erros
                                    </p>
                                    <p className="text-2xl font-bold text-red-700">{result.errorCount}</p>
                                </div>
                            </div>

                            {result.errorCount > 0 && (
                                <div className="border rounded-md">
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="errors" className="border-none">
                                            <AccordionTrigger className="px-4 py-2 hover:no-underline text-red-600">
                                                <span className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Ver relatório de erros ({result.errorCount})
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ScrollArea className="h-[200px] w-full bg-slate-50 p-4">
                                                    <div className="space-y-3">
                                                        {result.errors.map((error, idx) => (
                                                            <div key={idx} className="text-sm bg-white p-2 border rounded shadow-sm">
                                                                <div className="font-semibold text-red-600 mb-1">Linha {error.row}: {error.message}</div>
                                                                {/* Exibir dados da linha se necessário? Talvez polua muito */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!result ? (
                        <Button onClick={handleImport} disabled={!file || isUploading}>
                            {isUploading ? 'Importando...' : 'Iniciar Importação'}
                        </Button>
                    ) : (
                        <Button onClick={reset} variant="outline">
                            Nova Importação
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
