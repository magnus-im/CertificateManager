import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend, ComposedChart } from "recharts";
import { Loader2, ListChecks, FileCheck, Users, Factory, Package, Building2, FileOutput, TrendingUp } from "lucide-react";
import { Link } from "wouter";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function HomePage() {
  const { user } = useAuth();

  const { data: entryCertificatesData, isLoading: isLoadingEntryCertificates } = useQuery({ queryKey: ["/api/entry-certificates"] });
  const { data: issuedCertificatesData, isLoading: isLoadingIssuedCertificates } = useQuery({ queryKey: ["/api/issued-certificates"] });
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({ queryKey: ["/api/products"] });
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({ queryKey: ["/api/suppliers"] });
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({ queryKey: ["/api/clients"] });
  const { data: manufacturersData, isLoading: isLoadingManufacturers } = useQuery({ queryKey: ["/api/manufacturers"] });
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({ queryKey: ["/api/tenants/self/subscription"] });

  const isLoading = isLoadingEntryCertificates || isLoadingIssuedCertificates ||
    isLoadingProducts || isLoadingSuppliers ||
    isLoadingClients || isLoadingManufacturers || isLoadingSubscription;

  const entryCertificates = entryCertificatesData || [] as any[];
  const issuedCertificates = issuedCertificatesData || [] as any[];
  const products = productsData || [] as any[];
  const suppliers = suppliersData || [] as any[];
  const clients = clientsData || [] as any[];
  const manufacturers = manufacturersData || [] as any[];

  const planCode = subscriptionData?.planCode || "A";
  const isIntermediateOrBetter = ["B", "C"].includes(planCode);
  const isCompleteOnly = planCode === "C";

  // Helpers de Data
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const getRecentMonths = (count = 6) => {
    const currentMonth = new Date().getMonth();
    const result = [];
    for (let i = count - 1; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      result.push(months[m]);
    }
    return result;
  };
  const recentMonths = getRecentMonths();

  // Gráfico 1: Boletins de Entrada vs Emitidos (Qtd) - PLANO A, B, C
  const generateChartData = () => {
    if (isLoading) return [];
    const monthlyCounts: { [key: string]: { entrada: number; emitidos: number } } = {};
    recentMonths.forEach(month => {
      monthlyCounts[month] = { entrada: 0, emitidos: 0 };
    });

    entryCertificates.forEach(cert => {
      const date = new Date(cert.createdAt || cert.entryDate || Date.now());
      const m = months[date.getMonth()];
      if (monthlyCounts[m]) monthlyCounts[m].entrada += 1;
    });

    issuedCertificates.forEach(cert => {
      const date = new Date(cert.createdAt || cert.issueDate || Date.now());
      const m = months[date.getMonth()];
      if (monthlyCounts[m]) monthlyCounts[m].emitidos += 1;
    });

    return recentMonths.map(month => ({
      name: month,
      entrada: monthlyCounts[month].entrada,
      emitidos: monthlyCounts[month].emitidos
    }));
  };

  // Gráfico 2: Top Produtos Cadastrados/Movimentados - PLANO A, B, C
  const generateTopProductsData = () => {
    if (isLoading) return [];
    const productCounts: Record<number, number> = {};
    entryCertificates.forEach(cert => {
      if (cert.productId) {
        productCounts[cert.productId] = (productCounts[cert.productId] || 0) + 1;
      }
    });

    return Object.entries(productCounts)
      .map(([productId, count]) => {
        const product = products.find(p => p.id === Number(productId));
        return {
          name: product ? (product.commercialName || product.technicalName).substring(0, 15) : `Produto ${productId}`,
          value: count
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Traz os Top 5
  };

  // Gráfico 3: Evolução de Volumes (Entrada vs Saída) - PLANO B, C
  const generateVolumeChartData = () => {
    if (isLoading || !isIntermediateOrBetter) return [];
    const monthlyVolumes: { [key: string]: { entrada: number; saida: number } } = {};
    recentMonths.forEach(month => {
      monthlyVolumes[month] = { entrada: 0, saida: 0 };
    });

    entryCertificates.forEach(cert => {
      const date = new Date(cert.createdAt || cert.entryDate || Date.now());
      const m = months[date.getMonth()];
      if (monthlyVolumes[m]) monthlyVolumes[m].entrada += Number(cert.receivedQuantity) || 0;
    });

    issuedCertificates.forEach(cert => {
      const date = new Date(cert.createdAt || cert.issueDate || Date.now());
      const m = months[date.getMonth()];
      if (monthlyVolumes[m]) monthlyVolumes[m].saida += Number(cert.soldQuantity) || 0;
    });

    return recentMonths.map(month => ({
      name: month,
      entrada: monthlyVolumes[month].entrada,
      saida: monthlyVolumes[month].saida
    }));
  };

  // Gráfico 4: Consumo vs Disponibilidade por Produto - PLANO B, C
  const generateProductVolumeData = () => {
    if (isLoading || !isIntermediateOrBetter) return [];
    const productVolumes: Record<number, { entrado: number; consumido: number }> = {};

    entryCertificates.forEach(cert => {
      if (!productVolumes[cert.productId]) {
        productVolumes[cert.productId] = { entrado: 0, consumido: 0 };
      }
      productVolumes[cert.productId].entrado += Number(cert.receivedQuantity) || 0;
    });

    issuedCertificates.forEach(cert => {
      const entryCert = entryCertificates.find(c => c.id === cert.entryCertificateId);
      if (entryCert) {
        productVolumes[entryCert.productId].consumido += Number(cert.soldQuantity) || 0;
      }
    });

    return Object.entries(productVolumes)
      .map(([productId, vols]) => {
        const product = products.find(p => p.id === Number(productId));
        return {
          name: product ? (product.commercialName || product.technicalName).substring(0, 15) + "..." : `Prod ${productId}`,
          entrado: vols.entrado,
          consumido: vols.consumido,
          disponivel: vols.entrado - vols.consumido
        };
      })
      .sort((a, b) => b.entrado - a.entrado)
      .slice(0, 5);
  };

  // Gráfico 5: Evolução da Taxa de Aprovação - PLANO C
  const generateApprovalRateData = () => {
    if (isLoading || !isCompleteOnly) return [];
    const monthlyStats: { [key: string]: { total: number; aprovado: number } } = {};
    recentMonths.forEach(month => {
      monthlyStats[month] = { total: 0, aprovado: 0 };
    });

    entryCertificates.forEach(cert => {
      const date = new Date(cert.createdAt || cert.entryDate || Date.now());
      const m = months[date.getMonth()];
      if (monthlyStats[m]) {
        monthlyStats[m].total += 1;
        if (cert.status === 'Aprovado') {
          monthlyStats[m].aprovado += 1;
        }
      }
    });

    return recentMonths.map(month => {
      const total = monthlyStats[month].total;
      const rate = total > 0 ? (monthlyStats[month].aprovado / total) * 100 : 0;
      return {
        name: month,
        taxa: Math.round(rate)
      };
    });
  };

  // Gráfico 6: Performance de Fornecedores - PLANO C
  const generateSupplierPerformanceData = () => {
    if (isLoading || !isCompleteOnly) return [];
    const supplierStats: Record<number, { total: number; aprovado: number }> = {};

    entryCertificates.forEach(cert => {
      if (cert.supplierId) {
        if (!supplierStats[cert.supplierId]) {
          supplierStats[cert.supplierId] = { total: 0, aprovado: 0 };
        }
        supplierStats[cert.supplierId].total += 1;
        if (cert.status === 'Aprovado') {
          supplierStats[cert.supplierId].aprovado += 1;
        }
      }
    });

    return Object.entries(supplierStats)
      .map(([supplierId, stats]) => {
        const supplier = suppliers.find(s => s.id === Number(supplierId));
        return {
          name: supplier ? supplier.name.substring(0, 15) : `Forn. ${supplierId}`,
          taxa: Math.round((stats.aprovado / stats.total) * 100),
          total: stats.total
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const chartData = generateChartData();
  const topProductsData = generateTopProductsData();
  const volumeChartData = generateVolumeChartData();
  const productVolumeData = generateProductVolumeData();
  const approvalRateData = generateApprovalRateData();
  const supplierPerformanceData = generateSupplierPerformanceData();

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Dashboard</h1>
          {subscriptionData && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Plano: {subscriptionData.planName}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Cards Superiores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Boletins de Entrada</p>
                      <h3 className="text-2xl font-bold">{entryCertificates.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <FileOutput className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Boletins Emitidos</p>
                      <h3 className="text-2xl font-bold">{issuedCertificates.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Produtos</p>
                      <h3 className="text-2xl font-bold">{products.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-amber-100 p-3 rounded-full">
                      <ListChecks className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Aprovação</p>
                      <h3 className="text-2xl font-bold">
                        {entryCertificates.length > 0
                          ? Math.round((entryCertificates.filter(cert => cert.status === 'Aprovado').length / entryCertificates.length) * 100)
                          : 0}%
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SEÇÃO 1: Plano Básico (A, B, C) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              {/* Gráfico 1: Atividade de Boletins - Barras */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Atividade de Boletins</CardTitle>
                  <CardDescription>Entradas vs Emissões (6 meses)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Legend />
                      <Bar dataKey="entrada" name="Entradas" fill="#1976d2" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="emitidos" name="Emitidos" fill="#388e3c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico 2: Top Produtos - Pizza */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Produtos Movimentados</CardTitle>
                  <CardDescription>P/ quantidade de lotes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {topProductsData.length > 0 ? (
                      <PieChart>
                        <Pie
                          data={topProductsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {topProductsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        Sem dados de produtos suficientes
                      </div>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tabela Resumo Cadastros */}
              <Card>
                <CardHeader>
                  <CardTitle>Cadastros</CardTitle>
                  <CardDescription>Entidades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Link href="/suppliers">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <span>Fornecedores</span>
                          </div>
                          <span className="font-bold">{suppliers.length}</span>
                        </a>
                      </Link>
                    </div>

                    <div>
                      <Link href="/manufacturers">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Factory className="h-5 w-5 text-gray-600" />
                            <span>Fabricantes</span>
                          </div>
                          <span className="font-bold">{manufacturers.length}</span>
                        </a>
                      </Link>
                    </div>

                    <div>
                      <Link href="/clients">
                        <a className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-gray-600" />
                            <span>Clientes</span>
                          </div>
                          <span className="font-bold">{clients.length}</span>
                        </a>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SEÇÃO 2: Plano Intermediário e Completo (B, C) */}
            {isIntermediateOrBetter && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico 3: Evolução de Volumes - Área */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Volumes (Unidades/Pesos)</CardTitle>
                    <CardDescription>Tendência de quantidades recebidas vs emitidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={volumeChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="entrada" name="Volume Recebido" stroke="#8884d8" fillOpacity={0.3} fill="#8884d8" />
                        <Area type="monotone" dataKey="saida" name="Volume Emitido" stroke="#82ca9d" fillOpacity={0.3} fill="#82ca9d" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico 4: Disponibilidade por Produto - Barra Horizontal */}
                <Card>
                  <CardHeader>
                    <CardTitle>Consumo vs Disponibilidade</CardTitle>
                    <CardDescription>Volume entrado vs consumido (Top 5 Produtos)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      {productVolumeData.length > 0 ? (
                        <BarChart data={productVolumeData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="disponivel" name="Disponível" stackId="a" fill="#0088FE" />
                          <Bar dataKey="consumido" name="Consumido" stackId="a" fill="#FF8042" />
                        </BarChart>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          Sem dados de consumo suficientes
                        </div>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SEÇÃO 3: Plano Completo (C) */}
            {isCompleteOnly && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico 5: Taxa de Aprovação - Linha */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução da Qualidade</CardTitle>
                    <CardDescription>Taxa de aprovação de boletins (%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={approvalRateData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="taxa" name="Aprovação (%)" stroke="#ff7300" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico 6: Performance de Fornecedores - Barras Composê */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analítica Fornecedores</CardTitle>
                    <CardDescription>Taxa de aprovação dos principais parceiros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      {supplierPerformanceData.length > 0 ? (
                        <ComposedChart data={supplierPerformanceData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="taxa" name="Aprovação (%)" fill="#00C49F" barSize={20} radius={[0, 4, 4, 0]} />
                        </ComposedChart>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          Sem fornecedores com lotes inseridos
                        </div>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ações Rápidas (Sempre visível) */}
            <div className="grid grid-cols-1 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link href="/certificates">
                      <a className="bg-primary text-white p-4 rounded-lg text-center hover:bg-primary-dark flex flex-col items-center justify-center h-full w-full transition-transform hover:scale-105 shadow-sm">
                        <FileCheck className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">Novo Boletim de Entrada</span>
                      </a>
                    </Link>

                    <Link href="/issued-certificates">
                      <a className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 flex flex-col items-center justify-center h-full w-full transition-transform hover:scale-105 shadow-sm">
                        <FileOutput className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">Emitir Boletim</span>
                      </a>
                    </Link>

                    <Link href="/products">
                      <a className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 flex flex-col items-center justify-center h-full w-full transition-transform hover:scale-105 shadow-sm">
                        <Package className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">Cadastrar Produto</span>
                      </a>
                    </Link>

                    <Link href="/traceability">
                      <a className="bg-amber-600 text-white p-4 rounded-lg text-center hover:bg-amber-700 flex flex-col items-center justify-center h-full w-full transition-transform hover:scale-105 shadow-sm">
                        <ListChecks className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">Consultar Rastreabilidade</span>
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

          </>
        )}
      </div>
    </Layout>
  );
}
