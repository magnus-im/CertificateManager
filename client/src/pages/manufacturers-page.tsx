import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Factory, Pencil, Search, Trash2, Plus } from "lucide-react";
import { insertManufacturerSchema, Manufacturer } from "@shared/schema";
import { COUNTRIES, getCountryByCode, getTaxIdLabel, getTaxIdPlaceholder, formatTaxId } from "@shared/countries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BulkImportModal } from "@/components/bulk-import-modal";

export default function ManufacturersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);

  // Fetch manufacturers
  const { data: manufacturers, isLoading } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  // Filter manufacturers based on search query
  const filteredManufacturers = manufacturers
    ? manufacturers.filter(manufacturer =>
      manufacturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manufacturer.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manufacturer.taxId && manufacturer.taxId.includes(searchQuery)) ||
      (manufacturer.internalCode && manufacturer.internalCode.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : [];

  // Form for adding/editing manufacturers
  const form = useForm({
    resolver: zodResolver(insertManufacturerSchema.omit({ tenantId: true })),
    defaultValues: {
      name: "",
      country: "BR",
      taxId: "",
      phone: "",
      address: "",
      internalCode: "",
    },
  });

  const selectedCountry = form.watch("country");

  // Set form values when editing
  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    form.reset({
      name: manufacturer.name,
      country: manufacturer.country || "BR",
      taxId: manufacturer.taxId || "",
      phone: manufacturer.phone || "",
      address: manufacturer.address || "",
      internalCode: manufacturer.internalCode || "",
    });
    setIsDialogOpen(true);
  };

  // Reset form when adding new
  const handleAddNew = () => {
    setEditingManufacturer(null);
    form.reset({
      name: "",
      country: "BR",
      taxId: "",
      phone: "",
      address: "",
      internalCode: "",
    });
    setIsDialogOpen(true);
  };

  // Mutation for adding/editing manufacturer
  const manufacturerMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        taxId: data.taxId?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        internalCode: data.internalCode?.trim() || null,
      };
      if (editingManufacturer) {
        await apiRequest("PATCH", `/api/manufacturers/${editingManufacturer.id}`, payload);
      } else {
        await apiRequest("POST", "/api/manufacturers", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsDialogOpen(false);
      toast({
        title: editingManufacturer ? "Fabricante atualizado" : "Fabricante adicionado",
        description: editingManufacturer
          ? "O fabricante foi atualizado com sucesso."
          : "O fabricante foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete manufacturer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/manufacturers/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      toast({
        title: "Fabricante removido",
        description: "O fabricante foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja remover este fabricante?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: any) => {
    manufacturerMutation.mutate(data);
  };

  const renderCountryFlag = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    return country ? `${country.flag} ${country.name}` : countryCode;
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Fabricantes</h1>
          <div className="flex gap-2">
            <BulkImportModal entity="manufacturers" />
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fabricante
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Fabricantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, país, ID fiscal ou código interno..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nome</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>ID Fiscal</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Código Interno</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManufacturers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <Factory className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          {searchQuery
                            ? "Nenhum fabricante encontrado com os critérios de busca"
                            : "Nenhum fabricante cadastrado ainda"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredManufacturers.map((manufacturer) => (
                        <TableRow key={manufacturer.id}>
                          <TableCell className="font-medium">{manufacturer.name}</TableCell>
                          <TableCell>
                            <span className="whitespace-nowrap">{renderCountryFlag(manufacturer.country)}</span>
                          </TableCell>
                          <TableCell>{manufacturer.taxId || "-"}</TableCell>
                          <TableCell>{manufacturer.phone || "-"}</TableCell>
                          <TableCell>{manufacturer.address || "-"}</TableCell>
                          <TableCell>{manufacturer.internalCode || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(manufacturer)}
                              disabled={manufacturerMutation.isPending}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(manufacturer.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingManufacturer ? "Editar Fabricante" : "Novo Fabricante"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fabricante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País de Origem *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getTaxIdLabel(selectedCountry)}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={getTaxIdPlaceholder(selectedCountry)}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const formatted = formatTaxId(e.target.value, selectedCountry);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Interno (ERP)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: FAB-001" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={manufacturerMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={manufacturerMutation.isPending}
                >
                  {manufacturerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingManufacturer ? "Atualizar Fabricante" : "Adicionar Fabricante"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
