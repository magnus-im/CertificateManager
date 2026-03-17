/**
 * International Country & Tax ID Registry
 * 
 * Contains the 100 most commercially active countries with their
 * tax identification formats, labels, masks, and placeholders.
 */

export interface CountryConfig {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // Nome em Português
  flag: string;       // Emoji flag
  taxIdLabel: string; // Label do campo (ex: "CNPJ", "VAT Number", "EIN")
  taxIdPlaceholder: string; // Placeholder de exemplo
  taxIdMask?: string; // Máscara de formatação (caracteres: 0=dígito, A=letra, X=alfanumérico)
}

export const COUNTRIES: CountryConfig[] = [
  // Americas
  { code: "BR", name: "Brasil", flag: "🇧🇷", taxIdLabel: "CNPJ", taxIdPlaceholder: "00.000.000/0000-00", taxIdMask: "00.000.000/0000-00" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", taxIdLabel: "EIN", taxIdPlaceholder: "00-0000000", taxIdMask: "00-0000000" },
  { code: "CA", name: "Canadá", flag: "🇨🇦", taxIdLabel: "BN", taxIdPlaceholder: "000000000RC0001", taxIdMask: undefined },
  { code: "MX", name: "México", flag: "🇲🇽", taxIdLabel: "RFC", taxIdPlaceholder: "XAXX010101000", taxIdMask: undefined },
  { code: "AR", name: "Argentina", flag: "🇦🇷", taxIdLabel: "CUIT", taxIdPlaceholder: "00-00000000-0", taxIdMask: "00-00000000-0" },
  { code: "CL", name: "Chile", flag: "🇨🇱", taxIdLabel: "RUT", taxIdPlaceholder: "00.000.000-0", taxIdMask: "00.000.000-X" },
  { code: "CO", name: "Colômbia", flag: "🇨🇴", taxIdLabel: "NIT", taxIdPlaceholder: "000.000.000-0", taxIdMask: "000.000.000-0" },
  { code: "PE", name: "Peru", flag: "🇵🇪", taxIdLabel: "RUC", taxIdPlaceholder: "00000000000", taxIdMask: undefined },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", taxIdLabel: "RIF", taxIdPlaceholder: "J-00000000-0", taxIdMask: undefined },
  { code: "EC", name: "Equador", flag: "🇪🇨", taxIdLabel: "RUC", taxIdPlaceholder: "0000000000001", taxIdMask: undefined },
  { code: "UY", name: "Uruguai", flag: "🇺🇾", taxIdLabel: "RUT", taxIdPlaceholder: "000000000000", taxIdMask: undefined },
  { code: "PY", name: "Paraguai", flag: "🇵🇾", taxIdLabel: "RUC", taxIdPlaceholder: "00000000-0", taxIdMask: undefined },
  { code: "BO", name: "Bolívia", flag: "🇧🇴", taxIdLabel: "NIT", taxIdPlaceholder: "0000000000", taxIdMask: undefined },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", taxIdLabel: "Cédula Jurídica", taxIdPlaceholder: "0-000-000000", taxIdMask: undefined },
  { code: "PA", name: "Panamá", flag: "🇵🇦", taxIdLabel: "RUC", taxIdPlaceholder: "0000000-0-000000", taxIdMask: undefined },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", taxIdLabel: "RNC", taxIdPlaceholder: "000-00000-0", taxIdMask: undefined },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", taxIdLabel: "NIT", taxIdPlaceholder: "0000000-0", taxIdMask: undefined },
  { code: "HN", name: "Honduras", flag: "🇭🇳", taxIdLabel: "RTN", taxIdPlaceholder: "00000000000000", taxIdMask: undefined },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", taxIdLabel: "NIT", taxIdPlaceholder: "0000-000000-000-0", taxIdMask: undefined },
  { code: "NI", name: "Nicarágua", flag: "🇳🇮", taxIdLabel: "RUC", taxIdPlaceholder: "J0000000000000", taxIdMask: undefined },
  { code: "CU", name: "Cuba", flag: "🇨🇺", taxIdLabel: "NIT", taxIdPlaceholder: "00000000000", taxIdMask: undefined },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", taxIdLabel: "TRN", taxIdPlaceholder: "000-000-000", taxIdMask: undefined },
  { code: "TT", name: "Trinidad e Tobago", flag: "🇹🇹", taxIdLabel: "BIR TIN", taxIdPlaceholder: "000000000", taxIdMask: undefined },

  // Europe
  { code: "DE", name: "Alemanha", flag: "🇩🇪", taxIdLabel: "USt-IdNr.", taxIdPlaceholder: "DE000000000", taxIdMask: undefined },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", taxIdLabel: "VAT Number", taxIdPlaceholder: "GB000000000", taxIdMask: undefined },
  { code: "FR", name: "França", flag: "🇫🇷", taxIdLabel: "N° TVA", taxIdPlaceholder: "FR00000000000", taxIdMask: undefined },
  { code: "IT", name: "Itália", flag: "🇮🇹", taxIdLabel: "Partita IVA", taxIdPlaceholder: "IT00000000000", taxIdMask: undefined },
  { code: "ES", name: "Espanha", flag: "🇪🇸", taxIdLabel: "NIF", taxIdPlaceholder: "ESX0000000X", taxIdMask: undefined },
  { code: "PT", name: "Portugal", flag: "🇵🇹", taxIdLabel: "NIF", taxIdPlaceholder: "PT000000000", taxIdMask: undefined },
  { code: "NL", name: "Países Baixos", flag: "🇳🇱", taxIdLabel: "BTW-nummer", taxIdPlaceholder: "NL000000000B00", taxIdMask: undefined },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", taxIdLabel: "N° TVA", taxIdPlaceholder: "BE0000000000", taxIdMask: undefined },
  { code: "CH", name: "Suíça", flag: "🇨🇭", taxIdLabel: "UID/MWST", taxIdPlaceholder: "CHE-000.000.000", taxIdMask: undefined },
  { code: "AT", name: "Áustria", flag: "🇦🇹", taxIdLabel: "UID-Nummer", taxIdPlaceholder: "ATU00000000", taxIdMask: undefined },
  { code: "SE", name: "Suécia", flag: "🇸🇪", taxIdLabel: "Momsreg.nr", taxIdPlaceholder: "SE000000000000", taxIdMask: undefined },
  { code: "NO", name: "Noruega", flag: "🇳🇴", taxIdLabel: "MVA-nummer", taxIdPlaceholder: "NO000000000MVA", taxIdMask: undefined },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", taxIdLabel: "CVR", taxIdPlaceholder: "DK00000000", taxIdMask: undefined },
  { code: "FI", name: "Finlândia", flag: "🇫🇮", taxIdLabel: "ALV-numero", taxIdPlaceholder: "FI00000000", taxIdMask: undefined },
  { code: "PL", name: "Polônia", flag: "🇵🇱", taxIdLabel: "NIP", taxIdPlaceholder: "PL0000000000", taxIdMask: undefined },
  { code: "CZ", name: "República Tcheca", flag: "🇨🇿", taxIdLabel: "DIČ", taxIdPlaceholder: "CZ00000000", taxIdMask: undefined },
  { code: "RO", name: "Romênia", flag: "🇷🇴", taxIdLabel: "CIF", taxIdPlaceholder: "RO00000000", taxIdMask: undefined },
  { code: "HU", name: "Hungria", flag: "🇭🇺", taxIdLabel: "Adószám", taxIdPlaceholder: "HU00000000", taxIdMask: undefined },
  { code: "GR", name: "Grécia", flag: "🇬🇷", taxIdLabel: "ΑΦΜ", taxIdPlaceholder: "EL000000000", taxIdMask: undefined },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", taxIdLabel: "VAT Number", taxIdPlaceholder: "IE0000000X", taxIdMask: undefined },
  { code: "HR", name: "Croácia", flag: "🇭🇷", taxIdLabel: "OIB", taxIdPlaceholder: "HR00000000000", taxIdMask: undefined },
  { code: "BG", name: "Bulgária", flag: "🇧🇬", taxIdLabel: "ИН по ЗДДС", taxIdPlaceholder: "BG0000000000", taxIdMask: undefined },
  { code: "SK", name: "Eslováquia", flag: "🇸🇰", taxIdLabel: "IČ DPH", taxIdPlaceholder: "SK0000000000", taxIdMask: undefined },
  { code: "SI", name: "Eslovênia", flag: "🇸🇮", taxIdLabel: "DDV", taxIdPlaceholder: "SI00000000", taxIdMask: undefined },
  { code: "LT", name: "Lituânia", flag: "🇱🇹", taxIdLabel: "PVM kodas", taxIdPlaceholder: "LT000000000000", taxIdMask: undefined },
  { code: "LV", name: "Letônia", flag: "🇱🇻", taxIdLabel: "PVN", taxIdPlaceholder: "LV00000000000", taxIdMask: undefined },
  { code: "EE", name: "Estônia", flag: "🇪🇪", taxIdLabel: "KMKR", taxIdPlaceholder: "EE000000000", taxIdMask: undefined },
  { code: "LU", name: "Luxemburgo", flag: "🇱🇺", taxIdLabel: "N° TVA", taxIdPlaceholder: "LU00000000", taxIdMask: undefined },
  { code: "MT", name: "Malta", flag: "🇲🇹", taxIdLabel: "VAT Number", taxIdPlaceholder: "MT00000000", taxIdMask: undefined },
  { code: "CY", name: "Chipre", flag: "🇨🇾", taxIdLabel: "ΦΠΑ", taxIdPlaceholder: "CY00000000X", taxIdMask: undefined },
  { code: "IS", name: "Islândia", flag: "🇮🇸", taxIdLabel: "VSK-númer", taxIdPlaceholder: "000000", taxIdMask: undefined },
  { code: "RS", name: "Sérvia", flag: "🇷🇸", taxIdLabel: "PIB", taxIdPlaceholder: "000000000", taxIdMask: undefined },
  { code: "UA", name: "Ucrânia", flag: "🇺🇦", taxIdLabel: "ЄДРПОУ", taxIdPlaceholder: "00000000", taxIdMask: undefined },
  { code: "RU", name: "Rússia", flag: "🇷🇺", taxIdLabel: "ИНН", taxIdPlaceholder: "0000000000", taxIdMask: undefined },
  { code: "TR", name: "Turquia", flag: "🇹🇷", taxIdLabel: "VKN", taxIdPlaceholder: "0000000000", taxIdMask: undefined },

  // Asia & Oceania
  { code: "CN", name: "China", flag: "🇨🇳", taxIdLabel: "统一社会信用代码", taxIdPlaceholder: "000000000000000000", taxIdMask: undefined },
  { code: "JP", name: "Japão", flag: "🇯🇵", taxIdLabel: "法人番号", taxIdPlaceholder: "T0000000000000", taxIdMask: undefined },
  { code: "KR", name: "Coreia do Sul", flag: "🇰🇷", taxIdLabel: "사업자등록번호", taxIdPlaceholder: "000-00-00000", taxIdMask: undefined },
  { code: "IN", name: "Índia", flag: "🇮🇳", taxIdLabel: "GSTIN", taxIdPlaceholder: "00AAAAA0000A0A0", taxIdMask: undefined },
  { code: "SG", name: "Singapura", flag: "🇸🇬", taxIdLabel: "GST Reg No", taxIdPlaceholder: "M00000000X", taxIdMask: undefined },
  { code: "AU", name: "Austrália", flag: "🇦🇺", taxIdLabel: "ABN", taxIdPlaceholder: "00 000 000 000", taxIdMask: undefined },
  { code: "NZ", name: "Nova Zelândia", flag: "🇳🇿", taxIdLabel: "GST Number", taxIdPlaceholder: "000-000-000", taxIdMask: undefined },
  { code: "TH", name: "Tailândia", flag: "🇹🇭", taxIdLabel: "Tax ID", taxIdPlaceholder: "0000000000000", taxIdMask: undefined },
  { code: "MY", name: "Malásia", flag: "🇲🇾", taxIdLabel: "SST Reg No", taxIdPlaceholder: "A00-0000-00000000", taxIdMask: undefined },
  { code: "ID", name: "Indonésia", flag: "🇮🇩", taxIdLabel: "NPWP", taxIdPlaceholder: "00.000.000.0-000.000", taxIdMask: undefined },
  { code: "PH", name: "Filipinas", flag: "🇵🇭", taxIdLabel: "TIN", taxIdPlaceholder: "000-000-000-000", taxIdMask: undefined },
  { code: "VN", name: "Vietnã", flag: "🇻🇳", taxIdLabel: "MST", taxIdPlaceholder: "0000000000", taxIdMask: undefined },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", taxIdLabel: "統一編號", taxIdPlaceholder: "00000000", taxIdMask: undefined },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", taxIdLabel: "BRN", taxIdPlaceholder: "00000000-000-00-00-0", taxIdMask: undefined },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", taxIdLabel: "BIN", taxIdPlaceholder: "000000000000000", taxIdMask: undefined },
  { code: "PK", name: "Paquistão", flag: "🇵🇰", taxIdLabel: "NTN", taxIdPlaceholder: "0000000-0", taxIdMask: undefined },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", taxIdLabel: "TIN", taxIdPlaceholder: "000000000-0000", taxIdMask: undefined },
  { code: "MM", name: "Mianmar", flag: "🇲🇲", taxIdLabel: "Tax ID", taxIdPlaceholder: "00000000000", taxIdMask: undefined },
  { code: "KH", name: "Camboja", flag: "🇰🇭", taxIdLabel: "TIN", taxIdPlaceholder: "K000-000000000", taxIdMask: undefined },

  // Middle East
  { code: "AE", name: "Emirados Árabes", flag: "🇦🇪", taxIdLabel: "TRN", taxIdPlaceholder: "100000000000000", taxIdMask: undefined },
  { code: "SA", name: "Arábia Saudita", flag: "🇸🇦", taxIdLabel: "VAT TIN", taxIdPlaceholder: "300000000000000", taxIdMask: undefined },
  { code: "IL", name: "Israel", flag: "🇮🇱", taxIdLabel: "ח.פ.", taxIdPlaceholder: "000000000", taxIdMask: undefined },
  { code: "QA", name: "Catar", flag: "🇶🇦", taxIdLabel: "TIN", taxIdPlaceholder: "00000000000", taxIdMask: undefined },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", taxIdLabel: "Civil ID / CR", taxIdPlaceholder: "000000000000", taxIdMask: undefined },
  { code: "BH", name: "Bahrein", flag: "🇧🇭", taxIdLabel: "VAT TIN", taxIdPlaceholder: "000000000000000", taxIdMask: undefined },
  { code: "OM", name: "Omã", flag: "🇴🇲", taxIdLabel: "VAT TIN", taxIdPlaceholder: "OM0000000000", taxIdMask: undefined },
  { code: "JO", name: "Jordânia", flag: "🇯🇴", taxIdLabel: "TIN", taxIdPlaceholder: "000000000", taxIdMask: undefined },
  { code: "LB", name: "Líbano", flag: "🇱🇧", taxIdLabel: "Tax ID", taxIdPlaceholder: "0000000", taxIdMask: undefined },
  { code: "IQ", name: "Iraque", flag: "🇮🇶", taxIdLabel: "Tax ID", taxIdPlaceholder: "000000000", taxIdMask: undefined },
  { code: "IR", name: "Irã", flag: "🇮🇷", taxIdLabel: "شناسه ملی", taxIdPlaceholder: "00000000000", taxIdMask: undefined },

  // Africa
  { code: "ZA", name: "África do Sul", flag: "🇿🇦", taxIdLabel: "VAT Number", taxIdPlaceholder: "4000000000", taxIdMask: undefined },
  { code: "EG", name: "Egito", flag: "🇪🇬", taxIdLabel: "Tax Reg No", taxIdPlaceholder: "000-000-000", taxIdMask: undefined },
  { code: "NG", name: "Nigéria", flag: "🇳🇬", taxIdLabel: "TIN", taxIdPlaceholder: "00000000-0000", taxIdMask: undefined },
  { code: "KE", name: "Quênia", flag: "🇰🇪", taxIdLabel: "KRA PIN", taxIdPlaceholder: "A000000000X", taxIdMask: undefined },
  { code: "MA", name: "Marrocos", flag: "🇲🇦", taxIdLabel: "ICE", taxIdPlaceholder: "000000000000000", taxIdMask: undefined },
  { code: "TN", name: "Tunísia", flag: "🇹🇳", taxIdLabel: "Matricule Fiscale", taxIdPlaceholder: "0000000/X/A/M/000", taxIdMask: undefined },
  { code: "GH", name: "Gana", flag: "🇬🇭", taxIdLabel: "TIN", taxIdPlaceholder: "X0000000000", taxIdMask: undefined },
  { code: "ET", name: "Etiópia", flag: "🇪🇹", taxIdLabel: "TIN", taxIdPlaceholder: "0000000000", taxIdMask: undefined },
  { code: "TZ", name: "Tanzânia", flag: "🇹🇿", taxIdLabel: "TIN", taxIdPlaceholder: "000-000-000", taxIdMask: undefined },
  { code: "AO", name: "Angola", flag: "🇦🇴", taxIdLabel: "NIF", taxIdPlaceholder: "0000000000", taxIdMask: undefined },
  { code: "MZ", name: "Moçambique", flag: "🇲🇿", taxIdLabel: "NUIT", taxIdPlaceholder: "000000000", taxIdMask: undefined },
];

// ─── Helper Functions ─────────────────────────────────────────────

/** Get country config by ISO code */
export function getCountryByCode(code: string): CountryConfig | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/** Get the tax ID label for a country (e.g. "CNPJ" for BR) */
export function getTaxIdLabel(countryCode: string): string {
  return getCountryByCode(countryCode)?.taxIdLabel ?? "Tax ID";
}

/** Get the placeholder text for a country's tax ID input */
export function getTaxIdPlaceholder(countryCode: string): string {
  return getCountryByCode(countryCode)?.taxIdPlaceholder ?? "";
}

/**
 * Basic formatting for known tax IDs.
 * Applies CNPJ mask for Brazil, returns raw value for others.
 */
export function formatTaxId(value: string, countryCode: string): string {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  switch (countryCode) {
    case "BR": {
      // CNPJ: 00.000.000/0000-00
      if (digits.length <= 14) {
        return digits
          .replace(/^(\d{2})(\d)/, "$1.$2")
          .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
          .replace(/\.(\d{3})(\d)/, ".$1/$2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      }
      return value;
    }
    case "US": {
      // EIN: 00-0000000
      if (digits.length <= 9) {
        return digits.replace(/^(\d{2})(\d)/, "$1-$2");
      }
      return value;
    }
    case "AR": {
      // CUIT: 00-00000000-0
      if (digits.length <= 11) {
        return digits
          .replace(/^(\d{2})(\d)/, "$1-$2")
          .replace(/(\d{8})(\d)/, "$1-$2");
      }
      return value;
    }
    case "CL": {
      // RUT: 00.000.000-X
      if (digits.length <= 9) {
        const body = digits.slice(0, -1);
        const dv = digits.slice(-1);
        const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return digits.length > 1 ? `${formatted}-${dv}` : digits;
      }
      return value;
    }
    case "CO": {
      // NIT: 000.000.000-0
      if (digits.length <= 10) {
        const body = digits.slice(0, -1);
        const dv = digits.slice(-1);
        const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return digits.length > 1 ? `${formatted}-${dv}` : digits;
      }
      return value;
    }
    default:
      return value; // Return as-is for countries without specific masks
  }
}
