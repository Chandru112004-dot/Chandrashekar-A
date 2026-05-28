import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Database Path
const DB_FILE = path.join(process.cwd(), "quicktown_db.json");

// Default Catalog (designed for Indian micro-town express delivery like Blinkit/Zepto)
const DEFAULT_PRODUCTS = [
  // Vegetables
  {
    id: "veg1",
    name: "Onion",
    localName: "Pyaz (Onion)",
    category: "vegetables",
    price: 35,
    unit: "1 kg",
    stock: 50,
    image: "https://images.unsplash.com/photo-1618512496248-a07fe8376ee2?auto=format&fit=crop&w=300&q=80",
    description: "Daily kitchen essential. Fresh, firm, and flavorful onions."
  },
  {
    id: "veg2",
    name: "Tomato",
    localName: "Tamatar (Tomato)",
    category: "vegetables",
    price: 29,
    unit: "500 g",
    stock: 35,
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=300&q=80",
    description: "Juicy, handpicked red tomatoes, ideal for curries."
  },
  {
    id: "veg3",
    name: "Potato",
    localName: "Aloo (Potato)",
    category: "vegetables",
    price: 28,
    unit: "1 kg",
    stock: 80,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80",
    description: "Golden farm potatoes. Low moisture, perfect for dry sabzi."
  },
  {
    id: "veg4",
    name: "Coriander",
    localName: "Dhaniya (Coriander)",
    category: "vegetables",
    price: 10,
    unit: "1 Bunch",
    stock: 40,
    image: "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&w=300&q=80",
    description: "Fresh aromatic green coriander grass for direct garnishing."
  },
  {
    id: "veg5",
    name: "Ginger",
    localName: "Adrak (Ginger)",
    category: "vegetables",
    price: 25,
    unit: "100 g",
    stock: 20,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=300&q=80",
    description: "Fresh warm ginger root, great for spices and early tea."
  },
  {
    id: "veg6",
    name: "Cauliflower",
    localName: "Phool Gobhi (Cauliflower)",
    category: "vegetables",
    price: 40,
    unit: "1 Unit",
    stock: 30,
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=300&q=80",
    description: "Crisp white garden-fresh cauliflower heads."
  },
  {
    id: "veg7",
    name: "Green Peas",
    localName: "Hari Matar (Green Peas)",
    category: "vegetables",
    price: 35,
    unit: "250 g",
    stock: 40,
    image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=300&q=80",
    description: "Sweet green peas in soft tender pods."
  },
  {
    id: "veg8",
    name: "Garlic",
    localName: "Lahsun (Garlic)",
    category: "vegetables",
    price: 20,
    unit: "100 g",
    stock: 50,
    image: "https://images.unsplash.com/photo-1589618474799-ac13a52c7921?auto=format&fit=crop&w=300&q=80",
    description: "Strong pungent aromatic garlic cloves."
  },
  // Fruits
  {
    id: "fruit1",
    name: "Banana",
    localName: "Kela (Banana)",
    category: "fruits",
    price: 55,
    unit: "1 Dozen",
    stock: 25,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&q=80",
    description: "Plump, nutritious, naturally ripened sweet local bananas."
  },
  {
    id: "fruit2",
    name: "Apple",
    localName: "Seb (Apple)",
    category: "fruits",
    price: 120,
    unit: "4 Units",
    stock: 15,
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80",
    description: "Fresh crunchy royal Shimla red apples, packed with vitamins."
  },
  {
    id: "fruit3",
    name: "Papaya",
    localName: "Papita (Papaya)",
    category: "fruits",
    price: 45,
    unit: "1 Unit",
    stock: 12,
    image: "https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?auto=format&fit=crop&w=300&q=80",
    description: "Fully sweet and digestively soothing local ripe papaya."
  },
  {
    id: "fruit4",
    name: "Mango",
    localName: "Kesar Aam (Sweet Mango)",
    category: "fruits",
    price: 110,
    unit: "1 kg",
    stock: 20,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=300&q=80",
    description: "Rich juicy golden Kesar mangoes with thick sweet pulp."
  },
  {
    id: "fruit5",
    name: "Orange",
    localName: "Santra (Orange)",
    category: "fruits",
    price: 80,
    unit: "1 kg",
    stock: 35,
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=300&q=80",
    description: "Tangy sweet Nagpur oranges filled with refreshing citrus juices."
  },
  {
    id: "fruit6",
    name: "Grapes",
    localName: "Angoor (Green Grapes)",
    category: "fruits",
    price: 70,
    unit: "500 g",
    stock: 25,
    image: "https://images.unsplash.com/photo-1601275868399-45bec4f4cd9d?auto=format&fit=crop&w=300&q=80",
    description: "Seedless sweet green grapes sourced from Nashik orchards."
  },
  // Dairy & Bread
  {
    id: "dairy1",
    name: "Fresh Curd",
    localName: "Dahi (Curd)",
    category: "dairy",
    price: 32,
    unit: "200 g",
    stock: 60,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80",
    description: "Thick, creamy set curd. Cool and nutritious accompaniment."
  },
  {
    id: "dairy2",
    name: "Fresh Milk",
    localName: "Doodh (Milk)",
    category: "dairy",
    price: 30,
    unit: "500 ml",
    stock: 100,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80",
    description: "Premium pasteurized and cooled full cream fresh milk."
  },
  {
    id: "dairy3",
    name: "Paneer",
    localName: "Paneer (Cottage Cheese)",
    category: "dairy",
    price: 85,
    unit: "200 g",
    stock: 30,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80",
    description: "Fresh and soft milk-solid paneer block, packed in fresh water."
  },
  {
    id: "dairy4",
    name: "Amul Butter",
    localName: "Amul Butter",
    category: "dairy",
    price: 58,
    unit: "100 g",
    stock: 45,
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80",
    description: "The classic salted butter. Makes everything taste buttery."
  },
  {
    id: "dairy5",
    name: "Amul Cheese Slices",
    localName: "Amul Cheese Slices",
    category: "dairy",
    price: 135,
    unit: "1 Pack (10pcs)",
    stock: 40,
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=300&q=80",
    description: "Perfectly seasoned milk-rich cheese slices for sandwiches."
  },
  {
    id: "dairy6",
    name: "Brown Bread",
    localName: "English Oven Brown Bread",
    category: "dairy",
    price: 45,
    unit: "400 g",
    stock: 32,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80",
    description: "High-fibre, whole wheat brown bread slices. Baked fresh."
  },
  // Groceries / Kirana
  {
    id: "kirana1",
    name: "Atta",
    localName: "Ashirvaad Chakki Atta",
    category: "kirana",
    price: 65,
    unit: "1 kg",
    stock: 150,
    image: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=300&q=80",
    description: "Premium pure whole wheat atta with high-fibre content."
  },
  {
    id: "kirana2",
    name: "Sugar",
    localName: "Chini (Sugar)",
    category: "kirana",
    price: 46,
    unit: "1 kg",
    stock: 120,
    image: "https://images.unsplash.com/photo-1581798459219-318e76afdeff?auto=format&fit=crop&w=300&q=80",
    description: "Clean refined sugarcane crystal sweetness."
  },
  {
    id: "kirana3",
    name: "Mustard Oil",
    localName: "Sarso Tel (Mustard Oil)",
    category: "kirana",
    price: 165,
    unit: "1 L",
    stock: 24,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80",
    description: "Kachi Ghani cold-pressed mustard oil, full of natural pungency."
  },
  {
    id: "kirana4",
    name: "Tata Salt",
    localName: "Namak (Tata Salt)",
    category: "kirana",
    price: 24,
    unit: "1 kg",
    stock: 110,
    image: "https://images.unsplash.com/photo-1518110168407-68b1cb3b1778?auto=format&fit=crop&w=300&q=80",
    description: "Iodized classic Indian kitchen salt."
  },
  {
    id: "kirana5",
    name: "Basmati Rice",
    localName: "India Gate Basmati Rice",
    category: "kirana",
    price: 125,
    unit: "1 kg",
    stock: 70,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80",
    description: "Aromatic extra-long grain premium basmati rice."
  },
  {
    id: "kirana6",
    name: "Chana Dal",
    localName: "Chana Dal Premium",
    category: "kirana",
    price: 85,
    unit: "1 kg",
    stock: 45,
    image: "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?auto=format&fit=crop&w=300&q=80",
    description: "Rich tasty protein sourced unpolished split chickpea."
  },
  {
    id: "kirana7",
    name: "Tea Powder",
    localName: "Wagh Bakri Chai Patti",
    category: "kirana",
    price: 140,
    unit: "250 g",
    stock: 80,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80",
    description: "Premium strong Indian blend perfect for milk chai."
  },
  // Snacks
  {
    id: "snack1",
    name: "Potato Chips",
    localName: "Lays Magic Masala",
    category: "snacks",
    price: 20,
    unit: "1 Packet",
    stock: 140,
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80",
    description: "Lays classic blue spicy chatpata masala premium chips."
  },
  {
    id: "snack2",
    name: "Cola Drink",
    localName: "Thums Up Cold Drink",
    category: "snacks",
    price: 25,
    unit: "250 ml",
    stock: 80,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80",
    description: "Strong, high caffeine fizzy carbonated cola soda."
  },
  {
    id: "snack3",
    name: "Parle-G Biscuit",
    localName: "Parle-G",
    category: "snacks",
    price: 10,
    unit: "1 Pack",
    stock: 220,
    image: "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&w=300&q=80",
    description: "The national glucose tea biscuit. Instant energy booster."
  },
  {
    id: "snack4",
    name: "Instant Noodles",
    localName: "Maggi 2-Min Noodles",
    category: "snacks",
    price: 14,
    unit: "1 Pack (70g)",
    stock: 150,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80",
    description: "India's beloved masala instant snacks, cooking in 2 minutes."
  },
  {
    id: "snack5",
    name: "Dairy Milk Chocolate",
    localName: "Cadbury Dairy Milk",
    category: "snacks",
    price: 40,
    unit: "1 Unit (50g)",
    stock: 110,
    image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=300&q=80",
    description: "Rich, smooth, classic milk chocolate treat."
  },
  // Household Essentials
  {
    id: "household1",
    name: "Surf Excel",
    localName: "Surf Excel Powder",
    category: "household",
    price: 95,
    unit: "500 g",
    stock: 40,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80",
    description: "Fast stain remover premium laundry cleaning powder."
  },
  {
    id: "household2",
    name: "Dettol Soap",
    localName: "Dettol Bath Soap",
    category: "household",
    price: 40,
    unit: "125 g",
    stock: 50,
    image: "https://images.unsplash.com/photo-1607006342411-1a90e6d61081?auto=format&fit=crop&w=300&q=80",
    description: "Iconic anti-bacterial hygiene defense soap."
  },
  {
    id: "household3",
    name: "Liquid Handwash",
    localName: "Dettol Handwash Refill",
    category: "household",
    price: 99,
    unit: "175 ml",
    stock: 60,
    image: "https://images.unsplash.com/photo-1616750808432-e7587126fc5c?auto=format&fit=crop&w=300&q=80",
    description: "Moisturizing germ protect handwash liquid formula."
  },
  {
    id: "household4",
    name: "Vim Dishwash Gel",
    localName: "Vim Gel Lemon Liquid",
    category: "household",
    price: 55,
    unit: "250 ml",
    stock: 50,
    image: "https://images.unsplash.com/photo-1603531121115-4ba2782bca82?auto=format&fit=crop&w=300&q=80",
    description: "Concentrated power of lemons that removes grease effortlessly."
  },
  // Medicine
  {
    id: "med1",
    name: "Paracetamol",
    localName: "Crocin Tablet Strip",
    category: "medicine",
    price: 18,
    unit: "1 Strip",
    stock: 100,
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=300&q=80",
    description: "Immediate relief from high body heat & headaches."
  },
  {
    id: "med2",
    name: "Cough Syrup",
    localName: "Honitus Herbal Cough Syrup",
    category: "medicine",
    price: 85,
    unit: "100 ml",
    stock: 25,
    image: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=300&q=80",
    description: "Non-drowsy formulation made from dry tulsi and honey extract."
  },
  {
    id: "med3",
    name: "Band-Aid",
    localName: "Band-Aid Strips",
    category: "medicine",
    price: 20,
    unit: "1 Box (5pcs)",
    stock: 60,
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=300&q=80",
    description: "Quick sterile adhesive bandages to secure minor scrapes."
  },
  {
    id: "med4",
    name: "Digene Antacid",
    localName: "Digene Acidity Mint Gel",
    category: "medicine",
    price: 120,
    unit: "200 ml",
    stock: 30,
    image: "https://images.unsplash.com/photo-1550572017-b61628d51950?auto=format&fit=crop&w=300&q=80",
    description: "Fast-acting relief from acidity, heartburn, and gas bloating."
  }
];

// Default promo coupon vouchers
const DEFAULT_COUPONS = [
  { code: "WELCOME10", discountType: "percentage", value: 10, minCartAmount: 100, description: "15% off for first-time orders over ₹100" },
  { code: "FREEPEAS30", discountType: "fixed", value: 30, minCartAmount: 150, description: "Flat ₹30 off on carts over ₹150" },
  { code: "TOWNMASTER", discountType: "percentage", value: 25, minCartAmount: 300, description: "Super 25% discount for bulk orders over ₹300" }
];

const DEFAULT_CITIES = [
  { id: "city1", name: "Sikar City Hub" },
  { id: "city2", name: "Madhubani Towns" },
  { id: "city3", name: "Motihari Central" },
  { id: "city4", name: "Sasaram Junction" },
  { id: "city5", name: "Hajipur Bazaar" },
  { id: "city6", name: "Moradabad Sector 2" },
  { id: "city7", name: "Alwar Cantonment" }
];

const DEFAULT_SHOPS = [
  { id: "shop1", name: "Sikar Fresh Grocers", cityName: "Sikar City Hub", gstin: "08AAAAA1111A1Z1", email: "sikar_fresh@quicktown.com", details: "Fresh locally sourced organic veggies and everyday staples." },
  { id: "shop2", name: "Rajasthan Kirana Store", cityName: "Sikar City Hub", gstin: "08BBBBB2222B1Z2", email: "rajasthan_kirana@quicktown.com", details: "Traditional spices, pure ghee, premium wheat flour and dry fruits." },
  { id: "shop3", name: "Mithila Farm Fresh Organic", cityName: "Madhubani Towns", gstin: "10CCCCC3333C1Z3", email: "mithila_fresh@quicktown.com", details: "Hand-picked farm vegetables and authentic Mithila products." },
  { id: "shop4", name: "Madhubani Household Spices", cityName: "Madhubani Towns", gstin: "10DDDDD4444D1Z4", email: "madhubani_spices@quicktown.com", details: "Grade-A spices, oil seeds and household essentials." },
  { id: "shop5", name: "Motihari Dark Store Alpha", cityName: "Motihari Central", gstin: "10EEEEE5555E1Z5", email: "motihari_alpha@quicktown.com", details: "Hyper-local supercenter delivering items in under 8 minutes." },
  { id: "shop6", name: "Champaran Daily Needs", cityName: "Motihari Central", gstin: "10FFFFF6666F1Z6", email: "champaran_daily@quicktown.com", details: "Dairy, bakery, biscuits, cold sodas, and general provisions." },
  { id: "shop7", name: "Sasaram Mega Fresh Depot", cityName: "Sasaram Junction", gstin: "10GGGGG7777G1Z7", email: "sasaram_depot@quicktown.com", details: "Large scale wholesale options for daily groceries." },
  { id: "shop8", name: "Hajipur Banana & Dairy Farm", cityName: "Hajipur Bazaar", gstin: "10HHHHH8888H1Z8", email: "hajipur_dairy@quicktown.com", details: "Famous regional bananas and fresh pasteurized products." },
  { id: "shop9", name: "Moradabad Brass Town Grocers", cityName: "Moradabad Sector 2", gstin: "09IIIII9999I1Z9", email: "moradabad_brass@quicktown.com", details: "Premium basmati rice varieties, cooking ghee & high grade teas." },
  { id: "shop10", name: "Alwar Cantonment Supply Store", cityName: "Alwar Cantonment", gstin: "08JJJJJ1010J1Z0", email: "alwar_cantt@quicktown.com", details: "Defence grade hygiene supplies and premium pantry products." }
];

const DEFAULT_RIDERS = [
  { id: "rider1", name: "Ramesh Kumar", phone: "9876543201", status: "Idle" },
  { id: "rider2", name: "Vikas Yadav", phone: "9812345678", status: "Delivering" },
  { id: "rider3", name: "Suresh Patel", phone: "9123456789", status: "Idle" },
  { id: "rider4", name: "Anil Sharma", phone: "9567891234", status: "Offline" }
];

// In-Memory Database Structure
let db: {
  products: any[];
  orders: any[];
  coupons: any[];
  cities: any[];
  shops: any[];
  riders: any[];
} = {
  products: [...DEFAULT_PRODUCTS],
  orders: [],
  coupons: [...DEFAULT_COUPONS],
  cities: [...DEFAULT_CITIES],
  shops: [...DEFAULT_SHOPS],
  riders: [...DEFAULT_RIDERS]
};

// Helper to load and save DB
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (parsed && parsed.products && parsed.orders) {
        db = parsed;
        if (!db.coupons) {
          db.coupons = [...DEFAULT_COUPONS];
        }
        if (!db.cities) {
          db.cities = [...DEFAULT_CITIES];
        }
        if (!db.shops) {
          db.shops = [...DEFAULT_SHOPS];
        }
        if (!db.riders) {
          db.riders = [...DEFAULT_RIDERS];
        }
        // Prepopulated high-quality mock reviews for selected items
        const initialMockReviews: Record<string, any[]> = {
          veg1: [
            { id: "rev1", reviewerName: "Aarav Sharma", rating: 5, text: "Excellent, fresh onions! Packed nicely and delivered within 8 minutes.", createdAt: new Date("2026-05-26T10:30:00Z").toISOString() },
            { id: "rev2", reviewerName: "Karan Patel", rating: 4, text: "Good size and overall fresh. Highly recommended.", createdAt: new Date("2026-05-26T18:15:00Z").toISOString() }
          ],
          veg2: [
            { id: "rev3", reviewerName: "Ritu Verma", rating: 5, text: "Juicy and perfectly ripe tomatoes. Perfect for my gravy!", createdAt: new Date("2026-05-27T02:00:00Z").toISOString() }
          ],
          dairy2: [
            { id: "rev4", reviewerName: "Sanjay Gupta", rating: 5, text: "Always chilled, fresh and delivered so quickly! Essential for morning tea.", createdAt: new Date("2026-05-27T08:00:00Z").toISOString() }
          ],
          dairy3: [
            { id: "rev5", reviewerName: "Meenakshi Rao", rating: 4, text: "Very soft paneer block, tastes authentic and fresh.", createdAt: new Date("2026-05-25T14:20:00Z").toISOString() }
          ]
        };

        // Merge with DEFAULT_PRODUCTS to apply updated fields (like image URLs) and new items!
        const mergedProducts = [...DEFAULT_PRODUCTS].map((defProd, idx) => {
          const existing = db.products.find(p => p.id === defProd.id);
          const shopIdx = (idx % DEFAULT_SHOPS.length) + 1;
          const assignedShopId = `shop${shopIdx}`;
          if (existing) {
            return {
              ...existing,
              name: defProd.name,
              localName: defProd.localName,
              category: defProd.category,
              price: defProd.price,
              unit: defProd.unit,
              image: defProd.image,
              description: defProd.description,
              stock: existing.stock !== undefined ? existing.stock : defProd.stock,
              shopId: existing.shopId || assignedShopId,
              reviews: existing.reviews || initialMockReviews[defProd.id] || []
            };
          }
          return {
            ...defProd,
            shopId: assignedShopId,
            reviews: initialMockReviews[defProd.id] || []
          };
        });

        // Add any items from db.products that aren't in DEFAULT_PRODUCTS (e.g. custom admin added ones)
        const customProducts = db.products.filter(p => !DEFAULT_PRODUCTS.some(dp => dp.id === p.id));
        
        db.products = [...mergedProducts, ...customProducts];

        // Ensure all products contain a valid shopId
        db.products.forEach((p, index) => {
          if (!p.shopId) {
            const num = index % DEFAULT_SHOPS.length;
            p.shopId = DEFAULT_SHOPS[num].id;
          }
        });
      }
    } else {
      // First boot: allocate shopIds to products
      db.products.forEach((p, index) => {
        const num = index % DEFAULT_SHOPS.length;
        p.shopId = DEFAULT_SHOPS[num].id;
      });
      saveDB();
    }
  } catch (err) {
    console.error("Failed loading database file, using defaults", err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed storing database file", err);
  }
}

// Initial Load
loadDB();

// Alias dictionary to match Gemini smart parses (hinglish & regional translations to item IDs)
const ALIAS_MAP: Record<string, string> = {
  "pyaz": "veg1", "pyaaz": "veg1", "onion": "veg1", "onions": "veg1", "kanda": "veg1",
  "tomato": "veg2", "tomatoes": "veg2", "tamatar": "veg2", "tamaatar": "veg2",
  "potato": "veg3", "potatoes": "veg3", "aloo": "veg3", "alu": "veg3",
  "dhaniya": "veg4", "coriander": "veg4", "kothmir": "veg4", "cilantro": "veg4",
  "adrak": "veg5", "ginger": "veg5", "ala": "veg5",
  "cauliflower": "veg6", "gobhi": "veg6", "gobi": "veg6", "phool gobhi": "veg6",
  "peas": "veg7", "green peas": "veg7", "matar": "veg7", "muttar": "veg7",
  "garlic": "veg8", "lahsun": "veg8", "lehsun": "veg8",
  "banana": "fruit1", "bananas": "fruit1", "kela": "fruit1", "kele": "fruit1",
  "apple": "fruit2", "apples": "fruit2", "seb": "fruit2", "saib": "fruit2",
  "papaya": "fruit3", "papita": "fruit3", "pappeeta": "fruit3",
  "mango": "fruit4", "mangos": "fruit4", "aam": "fruit4",
  "orange": "fruit5", "oranges": "fruit5", "santra": "fruit5",
  "grapes": "fruit6", "angoor": "fruit6",
  "curd": "dairy1", "dahi": "dairy1", "yoghurt": "dairy1", "yogurt": "dairy1",
  "milk": "dairy2", "doodh": "dairy2", "dud": "dairy2", "dudh": "dairy2", "milk packet": "dairy2",
  "paneer": "dairy3", "cottage cheese": "dairy3", "panir": "dairy3",
  "butter": "dairy4", "amul": "dairy4", "makkhan": "dairy4",
  "cheese": "dairy5", "cheese slices": "dairy5",
  "bread": "dairy6", "brown bread": "dairy6",
  "atta": "kirana1", "ata": "kirana1", "wheat": "kirana1", "ashirvad": "kirana1", "ashirvaad": "kirana1", "aata": "kirana1",
  "sugar": "kirana2", "chini": "kirana2", "cheeni": "kirana2", "shakkar": "kirana2",
  "oil": "kirana3", "sarso": "kirana3", "mustard": "kirana3", "tel": "kirana3", "oil packet": "kirana3",
  "salt": "kirana4", "namak": "kirana4",
  "rice": "kirana5", "basmati": "kirana5", "chawal": "kirana5",
  "dal": "kirana6", "chana dal": "kirana6", "lentils": "kirana6",
  "tea": "kirana7", "chai": "kirana7", "tea powder": "kirana7", "chai patti": "kirana7",
  "chips": "snack1", "lays": "snack1", "kurkure": "snack1", "wafer": "snack1",
  "cold drink": "snack2", "coke": "snack2", "cola": "snack2", "sprite": "snack2", "pepsi": "snack2", "thums up": "snack2", "drink": "snack2", "fanta": "snack2",
  "parle-g": "snack3", "parleg": "snack3", "biscuit": "snack3", "biscuits": "snack3", "chai biscuit": "snack3",
  "noodles": "snack4", "maggi": "snack4", "instant noodles": "snack4",
  "chocolate": "snack5", "dairy milk": "snack5", "cadbury": "snack5",
  "surf": "household1", "excel": "household1", "detergent": "household1", "powder": "household1", "surf excel": "household1",
  "soap": "household2", "dettol": "household2", "bath soap": "household2", "sabu": "household2", "sabun": "household2",
  "handwash": "household3", "liquid soap": "household3",
  "vim": "household4", "dishwash": "household4", "dishwashing liquid": "household4",
  "crocin": "med1", "paracetamol": "med1", "tablet": "med1", "fever": "med1", "pill": "med1", "paracetemol": "med1", "crocin strip": "med1",
  "cough": "med2", "cough syrup": "med2", "syrup": "med2", "honitus": "med2", "khansi": "med2",
  "bandaid": "med3", "band-aid": "med3", "bandage": "med3", "पट्टी": "med3",
  "digene": "med4", "antacid": "med4", "acidity": "med4", "gas": "med4"
};

// ----------------------
// PRODUCTS ENDPOINTS
// ----------------------
app.get("/api/products", (req, res) => {
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const { name, localName, category, price, unit, stock, image, description, shopId } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: "Name, price and category are required fields." });
  }
  const newProduct = {
    id: "custom_" + Date.now().toString(),
    name,
    localName: localName || `${name} (${name})`,
    category,
    price: Number(price),
    unit: unit || "1 Unit",
    stock: stock !== undefined ? Number(stock) : 50,
    image: image || "📦",
    description: description || "",
    shopId: shopId || undefined
  };
  db.products.push(newProduct);
  saveDB();
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found." });
  }
  const existing = db.products[index];
  db.products[index] = {
    ...existing,
    ...req.body,
    id: existing.id // protect ID
  };
  saveDB();
  res.json(db.products[index]);
});

app.post("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  const { reviewerName, rating, text } = req.body;
  if (!reviewerName || !rating || !text) {
    return res.status(400).json({ error: "Reviewer name, rating and feedback content are required." });
  }
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found." });
  }
  const existing = db.products[index];
  if (!existing.reviews) {
    existing.reviews = [];
  }
  const newReview = {
    id: "rev_" + Date.now().toString() + "_" + Math.floor(Math.random() * 1000),
    reviewerName,
    rating: Number(rating),
    text,
    createdAt: new Date().toISOString()
  };
  existing.reviews.push(newReview);
  saveDB();
  res.status(201).json(existing);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found." });
  }
  db.products.splice(index, 1);
  saveDB();
  res.json({ success: true, message: "Product deleted successfully." });
});

// ----------------------
// ORDERS ENDPOINTS
// ----------------------
app.get("/api/orders", (req, res) => {
  res.json(db.orders);
});

app.post("/api/orders", (req, res) => {
  const { customerName, customerPhone, deliveryCity, deliveryAddress, items, appliedCoupon, discountAmount } = req.body;
  
  if (!customerName || !customerPhone || !deliveryAddress || !items || !items.length) {
    return res.status(400).json({ error: "Customer details and items must be provided." });
  }

  // Deduct inventory and validate
  const verifiedItems: any[] = [];
  let itemSubtotal = 0;

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product ID ${item.productId} does not exist.` });
    }
    const orderQty = Math.max(1, Number(item.quantity || 1));
    if (product.stock < orderQty) {
      return res.status(400).json({ 
        error: `Insufficient stock for ${product.localName}. Stored stock: ${product.stock}, requested: ${orderQty}` 
      });
    }

    product.stock -= orderQty;
    verifiedItems.push({
      productId: product.id,
      name: product.localName,
      price: product.price,
      quantity: orderQty,
      unit: product.unit
    });
    itemSubtotal += product.price * orderQty;
  }

  // Save changes to stock
  saveDB();

  const riders = ["Ramesh Kumar", "Vikas Yadav", "Suresh Patel", "Anil Sharma"];
  const randomRider = riders[Math.floor(Math.random() * riders.length)];
  const riderPhone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;

  // Calculate grand final total on backend
  const deliveryFee = itemSubtotal >= 150 ? 0 : 15;
  const packingFee = 4;
  const couponDiscount = Number(discountAmount || 0);
  const totalPaid = Math.max(0, itemSubtotal + deliveryFee + packingFee - couponDiscount);

  const newOrder = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000).toString(),
    customerName,
    customerPhone,
    deliveryCity: deliveryCity || "Local Market",
    deliveryAddress,
    items: verifiedItems,
    totalAmount: totalPaid,
    appliedCoupon: appliedCoupon || null,
    discountAmount: couponDiscount,
    status: "Placed",
    createdAt: new Date().toISOString(),
    riderName: randomRider,
    riderPhone: riderPhone,
    etaMinutes: 10
  };

  db.orders.unshift(newOrder);
  saveDB();
  res.status(201).json(newOrder);
});

app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }
  order.status = status;
  
  if (status === "On the Way") {
    order.etaMinutes = 7;
  } else if (status === "Delivered") {
    order.etaMinutes = 0;
  }
  
  saveDB();
  res.json(order);
});

// ----------------------
// Coupon Vouchers Endpoints
// ----------------------
app.get("/api/coupons", (req, res) => {
  res.json(db.coupons || []);
});

app.post("/api/coupons", (req, res) => {
  const { code, discountType, value, minCartAmount, description } = req.body;
  if (!code || !discountType || value === undefined) {
    return res.status(400).json({ error: "Code, discountType, and value are required." });
  }

  const existing = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: "A coupon with this code already exists." });
  }

  const newCoupon = {
    code: code.toUpperCase().trim(),
    discountType,
    value: Number(value),
    minCartAmount: Number(minCartAmount || 0),
    description: description || `${discountType === "percentage" ? value + "%" : "₹" + value} Discount`
  };

  db.coupons.push(newCoupon);
  saveDB();
  res.status(201).json(newCoupon);
});

app.delete("/api/coupons/:code", (req, res) => {
  const { code } = req.params;
  const initialLen = db.coupons.length;
  db.coupons = db.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
  if (db.coupons.length === initialLen) {
    return res.status(404).json({ error: "Coupon not found." });
  }
  saveDB();
  res.json({ success: true, message: `Coupon ${code.toUpperCase()} deleted.` });
});

app.post("/api/coupons/validate", (req, res) => {
  const { code, cartAmount } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code is required" });
  }

  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!coupon) {
    return res.status(404).json({ error: "Invalid Coupon Code" });
  }

  const currentCartAmount = Number(cartAmount || 0);
  if (currentCartAmount < coupon.minCartAmount) {
    return res.status(400).json({ 
      error: `Min order value of ₹${coupon.minCartAmount} required for this coupon. Cart has ₹${currentCartAmount}.` 
    });
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((currentCartAmount * coupon.value) / 100);
    // cap percentage discount at a max of 200 for security
    if (discount > 200) discount = 200;
  } else {
    discount = coupon.value;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discount,
    description: coupon.description
  });
});

// ----------------------
// CITIES ENDPOINTS
// ----------------------
app.get("/api/cities", (req, res) => {
  res.json(db.cities || []);
});

app.post("/api/cities", (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "City name is required" });
  }
  const exists = db.cities.find(c => c.name.toLowerCase() === name.toLowerCase().trim());
  if (exists) {
    return res.status(400).json({ error: "City already exists" });
  }
  const newCity = {
    id: "city_" + Date.now().toString(),
    name: name.trim()
  };
  db.cities.push(newCity);
  saveDB();
  res.status(201).json(newCity);
});

// ----------------------
// SHOPS ENDPOINTS
// ----------------------
app.get("/api/shops", (req, res) => {
  res.json(db.shops || []);
});

app.post("/api/shops", (req, res) => {
  const { name, cityName, gstin, email, details, address } = req.body;
  if (!name || !cityName || !gstin || !email) {
    return res.status(400).json({ error: "Shop name, city name, GSTIN and email are required properties." });
  }
  const newShop = {
    id: "shop_" + Date.now().toString(),
    name: name.trim(),
    cityName: cityName.trim(),
    gstin: gstin.toUpperCase().trim(),
    email: email.trim(),
    details: details || "Local shop providing fast home delivery.",
    address: address ? address.trim() : "Municipal Main Market Road"
  };
  db.shops.push(newShop);
  saveDB();
  res.status(201).json(newShop);
});

// ----------------------
// RIDERS ENDPOINTS (Active Delivery Personnel)
// ----------------------
app.get("/api/riders", (req, res) => {
  res.json(db.riders || []);
});

app.post("/api/riders", (req, res) => {
  const { name, phone, status } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Rider name and phone are required." });
  }
  const newRider = {
    id: "rider_" + Date.now().toString(),
    name: name.trim(),
    phone: phone.trim(),
    status: status || "Idle"
  };
  db.riders.push(newRider);
  saveDB();
  res.status(201).json(newRider);
});

app.put("/api/riders/:id", (req, res) => {
  const { id } = req.params;
  const index = db.riders.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Rider not found." });
  }
  db.riders[index] = {
    ...db.riders[index],
    ...req.body,
    id: db.riders[index].id // keep original ID
  };
  saveDB();
  res.json(db.riders[index]);
});

app.delete("/api/riders/:id", (req, res) => {
  const { id } = req.params;
  const index = db.riders.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Rider not found." });
  }
  db.riders.splice(index, 1);
  saveDB();
  res.json({ success: true, message: "Rider deleted successfully." });
});

// Real-time moving path tracking (Coordinates for dynamic map rendering)
app.get("/api/orders/:id/tracking", (req, res) => {
  const { id } = req.params;
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order tracking not found." });
  }

  // Base coordinates simulating the dark-store to customer's home
  // In small towns: Dark store at town center, client at some residential colony.
  const routePoints = [
    { name: "Dark Store (City Center)", lat: 23.0225, lng: 72.5714 },
    { name: "Market Chowk Bypass", lat: 23.0265, lng: 72.5784 },
    { name: "Railway Colony Crossing", lat: 23.0315, lng: 72.5840 },
    { name: "Civil Hospital Road", lat: 23.0360, lng: 72.5912 },
    { name: "Customer Colony Gate", lat: 23.0412, lng: 72.5975 }
  ];

  let currentStep = 0;
  let progressInStatus = 0;
  let milestone = "Local warehouse packing is starting.";

  if (order.status === "Placed") {
    currentStep = 0;
    progressInStatus = 10;
    milestone = "Order received at local warehouse hub.";
  } else if (order.status === "Packing") {
    currentStep = 1;
    progressInStatus = 40;
    milestone = `Store partner is packing your fresh items in paper bags.`;
  } else if (order.status === "On the Way") {
    // Generate simulated traveling steps based on timeframe
    const orderAgeSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    const pathStage = Math.min(4, 1 + Math.floor(orderAgeSec / 25)); // advance every 25 seconds of simulated tracking
    currentStep = pathStage;
    progressInStatus = 50 + (pathStage * 10) + Math.floor((orderAgeSec % 25) * 0.4);
    if (progressInStatus > 95) progressInStatus = 95;

    milestone = `Rider ${order.riderName} is speeding on motorcycle. Near ${routePoints[Math.min(pathStage, routePoints.length - 1)].name}`;
  } else if (order.status === "Delivered") {
    currentStep = 4;
    progressInStatus = 100;
    milestone = `Delivered successfully under 10 minutes near gate.`;
  } else if (order.status === "Cancelled") {
    progressInStatus = 0;
    milestone = "This order was cancelled by support.";
  }

  // Linear interpolation for current position
  const prevNode = routePoints[Math.max(0, currentStep - 1)];
  const nextNode = routePoints[Math.min(routePoints.length - 1, currentStep)];
  
  // Normalized percentage within this link
  const linkProgress = (progressInStatus % 25) / 25;
  const currentLat = prevNode.lat + (nextNode.lat - prevNode.lat) * linkProgress;
  const currentLng = prevNode.lng + (nextNode.lng - prevNode.lng) * linkProgress;

  res.json({
    orderId: order.id,
    status: order.status,
    progress: progressInStatus,
    description: milestone,
    riderName: order.riderName,
    riderPhone: order.riderPhone,
    etaMinutes: order.etaMinutes,
    currentLocation: {
      lat: currentLat,
      lng: currentLng
    },
    hubLocation: routePoints[0],
    deliveryLocation: routePoints[4],
    routePoints
  });
});

// ------------------------------------
// GEMINI INTELLIGENT LIST PARSER API
// ------------------------------------
app.post("/api/ai/instant-cart", async (req, res) => {
  const { textList, audioInput } = req.body;
  
  if (!textList || textList.trim() === "") {
    return res.status(400).json({ error: "Shopping list text query is required." });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    // Elegant fallback simulation if user hasn't added a key yet:
    console.warn("GEMINI_API_KEY not found in secrets. Falling back to local offline smart rule parser.");
    return fallbackSmartParser(textList, res);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemPrompt = `You are an expert e-commerce order assistant designed for a hyper-local fast grocery app called QuickTown.
Small town users often input list items in loose formatting, mix-languages, or raw localized phonetic terms (like 'pyaz', 'pyaaj', 'dhaniya dhaniya', 'kela', 'doodh', 'dahi packet', 'paracetamol tab').
Your absolute goal is to extract:
1. 'itemKeyword' of the item (the English translation or primary ingredient name, such as "onion", "milk", "potato", "apple", "cough syrup"). Specify simple terms in singular form under lowercase.
2. 'quantity' of the item (e.g. "2 kilo aloo" -> 2, "three milks" -> 3, "ek strip crocin" -> 1). If not stated or unclear, default to 1.

You MUST respond strictly in a valid JSON Array format fitting this schema. Do not output anything other than the JSON block.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please parse this shopping list and extract the items:
"${textList}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemKeyword: {
                type: Type.STRING,
                description: "Clean simple singular label of the item in English, e.g., 'onion', 'milk', 'sugar', 'biscuit'."
              },
              quantity: {
                type: Type.INTEGER,
                description: "The parsed quantity. If no count specified, default to 1."
              }
            },
            required: ["itemKeyword", "quantity"]
          }
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty response from Google Gemini AI");
    }

    const parsedItems = JSON.parse(response.text.trim());
    const matchedProducts = mapParsedKeywordsToProducts(parsedItems);
    
    res.json({
      success: true,
      rawList: textList,
      extractedItems: parsedItems,
      matchedProducts,
      disclaimer: "Successfully compiled into active cart items using Smart Gemini AI assistant!"
    });

  } catch (error: any) {
    console.error("Gemini parse failed", error);
    // Graceful automatic transition to local offline parser if network or quota errors happen
    return fallbackSmartParser(textList, res);
  }
});

// Local word token matcher backend (fallback/local optimization)
function fallbackSmartParser(textList: string, res: any) {
  const normalized = textList.toLowerCase();
  const tokens = normalized.split(/[\s,+,.,\n]+/);
  const itemsFound: { itemKeyword: string; quantity: number }[] = [];

  // Match common Indian language/phonetic numbers
  let lastQtyNum = 1;
  const numWordsMap: Record<string, number> = {
    "ek": 1, "one": 1, "do": 2, "doo": 2, "two": 2, "teen": 3, "tin": 3, "three": 3,
    "char": 4, "four": 4, "paanch": 5, "panch": 5, "five": 5, "half": 1, " आधा": 1
  };

  // Extract explicit digits or hindi word digits prior to matching
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const numeric = parseInt(word, 10);
    if (!isNaN(numeric)) {
      lastQtyNum = numeric;
      continue;
    }
    if (numWordsMap[word] !== undefined) {
      lastQtyNum = numWordsMap[word];
      continue;
    }

    // Try finding if the token or some combination matches any ALIAS key
    for (const [alias, productId] of Object.entries(ALIAS_MAP)) {
      if (word === alias || word.includes(alias) || alias.includes(word)) {
        // Prevent duplicate mapping of same product in one fallback parse loop
        const alreadyFound = itemsFound.some(p => ALIAS_MAP[p.itemKeyword] === productId);
        if (!alreadyFound) {
          itemsFound.push({
            itemKeyword: alias,
            quantity: lastQtyNum
          });
          lastQtyNum = 1; // reset
          break;
        }
      }
    }
  }

  // Handle case where no items were matched
  if (itemsFound.length === 0) {
    // Try doing direct keyword filter
    for (const prod of db.products) {
      if (normalized.includes(prod.name.toLowerCase()) || normalized.includes(prod.localName.toLowerCase())) {
        itemsFound.push({ itemKeyword: prod.name.toLowerCase(), quantity: 1 });
      }
    }
  }

  const matchedProducts = mapParsedKeywordsToProducts(itemsFound);
  res.json({
    success: true,
    rawList: textList,
    extractedItems: itemsFound,
    matchedProducts,
    disclaimer: "Parsed via high-speed multilingual offline keyword parser (local catalog matched)."
  });
}

// Maps abstract keyword string arrays to actual product details
function mapParsedKeywordsToProducts(parsedItems: { itemKeyword: string; quantity: number }[]) {
  const result: any[] = [];
  for (const pi of parsedItems) {
    const keyword = pi.itemKeyword.toLowerCase().trim();
    let matchedId = ALIAS_MAP[keyword];

    // If direct alias didn't find, try partial lookup
    if (!matchedId) {
      for (const [alias, id] of Object.entries(ALIAS_MAP)) {
        if (keyword.includes(alias) || alias.includes(keyword)) {
          matchedId = id;
          break;
        }
      }
    }

    // Still not matched? Look inside actual catalog titles
    if (!matchedId) {
      const dbProd = db.products.find(
        p => p.name.toLowerCase().includes(keyword) || 
             p.localName.toLowerCase().includes(keyword) || 
             p.description.toLowerCase().includes(keyword)
      );
      if (dbProd) {
        matchedId = dbProd.id;
      }
    }

    if (matchedId) {
      const productObj = db.products.find(p => p.id === matchedId);
      if (productObj) {
        result.push({
          product: productObj,
          quantity: pi.quantity > 0 ? pi.quantity : 1
        });
      }
    }
  }
  return result;
}

// Vite static middleware and routing setup for full stack lifecycle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA catch-all
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[QuickTown Full-Stack] Server running on port ${PORT}`);
  });
}

startServer();
export default app;
