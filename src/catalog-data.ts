// Artigos e preços fornecidos pelo responsável em 20/10/2026.
export const CATALOG_REVISION = "menu-2026-10-20-1";
export const CATEGORY_DATA = [
  { name: "Cafetaria", icon: "☕", color: "#e8ddce" },
  { name: "Cervejaria", icon: "🍺", color: "#f7dfc5" },
  { name: "Destilados e Vinhos", icon: "🍷", color: "#eadbe8" },
  { name: "Sumos e Águas", icon: "🥤", color: "#d9eee5" },
  { name: "Snack", icon: "🥪", color: "#f3e2c7" },
  { name: "Petiscos", icon: "🍲", color: "#e4e0ee" },
] as const;
type CategoryName = (typeof CATEGORY_DATA)[number]["name"];
type MenuItem = {
  name: string;
  category: CategoryName;
  priceCents: number;
  icon: string;
  aliases: string[];
};
const item = (
  name: string,
  category: CategoryName,
  priceCents: number,
  icon: string,
  ...aliases: string[]
): MenuItem => ({ name, category, priceCents, icon, aliases });
export const MENU_ITEMS: MenuItem[] = [
  item("Água pequena", "Cafetaria", 100, "💧", "Água sem gás"),
  item("Café", "Cafetaria", 90, "☕"),
  item("Carioca", "Cafetaria", 50, "☕"),
  item("Cevada", "Cafetaria", 90, "☕"),
  item("Chá", "Cafetaria", 60, "🫖"),
  item("Descafeinado", "Cafetaria", 90, "☕"),
  item("Galão", "Cafetaria", 140, "🥛"),
  item("Meia de leite", "Cafetaria", 120, "🥛"),
  item("Pingo", "Cafetaria", 90, "☕"),

  item("Fino balão", "Cervejaria", 150, "🍺"),
  item("Fino", "Cervejaria", 130, "🍺"),
  item("Martini com cerveja", "Cervejaria", 150, "🍺"),
  item("Cerveja caneca", "Cervejaria", 300, "🍺", "Caneca"),
  item("Cerveja mini", "Cervejaria", 120, "🍺", "Mini"),
  item("Cerveja grande", "Cervejaria", 140, "🍺", "Cerveja de garrafa"),
  item("Favaios com cerveja", "Cervejaria", 150, "🍺"),
  item("Favaios com cerveja (pequeno)", "Cervejaria", 130, "🍺"),

  item("Gin", "Destilados e Vinhos", 500, "🍸"),
  item("Macieira", "Destilados e Vinhos", 200, "🥃"),
  item("Martini", "Destilados e Vinhos", 150, "🍸"),
  item("Porto", "Destilados e Vinhos", 120, "🍷"),
  item("1920", "Destilados e Vinhos", 200, "🥃"),
  item("Beirão", "Destilados e Vinhos", 300, "🥃"),
  item("Beirão (2,5 cl)", "Destilados e Vinhos", 150, "🥃"),
  item("CRF", "Destilados e Vinhos", 400, "🥃"),
  item("CRF (2,5 cl)", "Destilados e Vinhos", 200, "🥃"),
  item("Croft", "Destilados e Vinhos", 300, "🥃"),
  item("Croft (2,5 cl)", "Destilados e Vinhos", 150, "🥃"),
  item("Whisky", "Destilados e Vinhos", 400, "🥃"),
  item("Whisky (2,5 cl)", "Destilados e Vinhos", 200, "🥃"),
  item("Xiripiti", "Destilados e Vinhos", 80, "🥃"),
  item("Bagaço", "Destilados e Vinhos", 60, "🥃"),
  item("Favaios simples", "Destilados e Vinhos", 100, "🍷"),
  item("Garrafa de vinho", "Destilados e Vinhos", 600, "🍷"),
  item("Assobio", "Destilados e Vinhos", 900, "🍷"),
  item("Aveleda", "Destilados e Vinhos", 900, "🍷"),
  item("Moet & Chandon", "Destilados e Vinhos", 8000, "🥂"),
  item("Montanha", "Destilados e Vinhos", 900, "🥂"),
  item("Taça de vinho", "Destilados e Vinhos", 130, "🍷"),

  item("Água com gás", "Sumos e Águas", 130, "💧"),
  item("Água grande (1,5 L)", "Sumos e Águas", 200, "💧"),
  item("Compal", "Sumos e Águas", 150, "🧃"),
  item("Sumos grandes (1,5 L)", "Sumos e Águas", 250, "🥤"),
  item("Sumos lata", "Sumos e Águas", 150, "🥤"),

  item("Batatas fritas pacote", "Snack", 250, "🍟", "Batatas fritas"),
  item("Chiclas", "Snack", 10, "🍬"),
  item("Chupas", "Snack", 30, "🍭"),
  item("Gomas", "Snack", 10, "🍬"),
  item("Rebuçados", "Snack", 10, "🍬"),
  item("Cachorro", "Snack", 400, "🌭"),
  item("Pão misto (apenas fiambre e queijo)", "Snack", 160, "🥪"),
  item("Amendoins", "Snack", 90, "🥜"),
  item("Azeitonas", "Snack", 100, "🫒"),
  item("Tremoços", "Snack", 100, "🫘"),
  item("Prato de queijo", "Snack", 300, "🧀"),
  item("Prato de marmelada", "Snack", 200, "🍽️"),
  item("Prato presunto", "Snack", 450, "🍽️"),
  item("Prato salpicão", "Snack", 450, "🍽️"),
  item("Sandes presunto", "Snack", 300, "🥪"),
  item("Sandes presunto e ovo", "Snack", 400, "🥪"),

  item("Prego no pão", "Petiscos", 350, "🥪"),
  item("Rojões", "Petiscos", 400, "🍖"),
  item("Sandes fígado com cebola", "Petiscos", 250, "🥪"),
  item("Dose batata", "Petiscos", 200, "🍟"),
  item("Alheira", "Petiscos", 350, "🍽️"),
  item("Bifanas", "Petiscos", 250, "🥪", "Bifana"),
  item("Bucho", "Petiscos", 300, "🍲"),
  item("Caldo verde", "Petiscos", 150, "🥣"),
  item("Cebola salgada", "Petiscos", 150, "🧅"),
  item("Cesto pão", "Petiscos", 100, "🍞"),
  item("Febra no pão", "Petiscos", 250, "🥪"),
  item("Moelas", "Petiscos", 300, "🍲"),
  item("Orelheira", "Petiscos", 300, "🍽️"),
  item("Pica pau", "Petiscos", 400, "🍢", "Pica-pau"),
  item("Chouriço", "Petiscos", 300, "🍽️", "Chouriço assado"),
];

export const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export const menuId = (name: string) => `menu-${normalizeName(name)}`;
// Only the old demonstration articles are retired. Unrelated custom articles stay.
export const LEGACY_DEMO_NAMES = new Set(
  [
    "Café",
    "Descafeinado",
    "Abatanado",
    "Galão",
    "Meia de leite",
    "Chá",
    "Carioca",
    "Fino",
    "Mini",
    "Cerveja de garrafa",
    "Caneca",
    "Panaché",
    "Cerveja sem álcool",
    "Vinho tinto",
    "Vinho branco",
    "Vinho verde",
    "Whisky",
    "Aguardente",
    "Licor",
    "Água sem gás",
    "Água com gás",
    "Cola",
    "Sumos",
    "Ice Tea",
    "Limonada",
    "Bifana",
    "Cachorro",
    "Tosta mista",
    "Sandes de queijo",
    "Sandes de fiambre",
    "Batatas fritas",
    "Moelas",
    "Pica-pau",
    "Chouriço assado",
    "Tremoços",
    "Azeitonas",
    "Rojões",
  ].map(normalizeName),
);
