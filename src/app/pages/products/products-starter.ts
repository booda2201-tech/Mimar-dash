export interface StarterSpec {
  label: string;
  labelEn: string;
  value: string;
  valueEn: string;
}

export interface StarterProduct {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  isNew?: boolean;
  specs: StarterSpec[];
}

export interface StarterProductGroup {
  /** اسم الفئة الفرعية زي ما اتضافت من الفئات الجاهزة */
  category: string;
  categoryEn: string;
  parent: string;
  products: StarterProduct[];
}

const img = (name: string) => `assets/seed/products/${name}.jpg`;
const spec = (label: string, labelEn: string, value: string, valueEn: string): StarterSpec => ({
  label,
  labelEn,
  value,
  valueEn,
});

export const STARTER_PRODUCTS: StarterProductGroup[] = [
  {
    category: 'الأسلاك والكابلات',
    categoryEn: 'Wires & Cables',
    parent: 'الأدوات الكهربائية',
    products: [
      {
        name: 'سلك نحاس معزول 2.5 مم - لفة 100 متر',
        nameEn: 'Insulated Copper Wire 2.5 mm - 100 m Roll',
        description: 'سلك نحاس نقي معزول PVC مقاوم للحرارة، مناسب لتمديدات الأفياش والباور في المنازل والمحلات.',
        descriptionEn: 'Pure copper PVC-insulated heat-resistant wire for socket and power circuits in homes and shops.',
        sku: 'EL-WIR-025',
        price: 185,
        stock: 120,
        image: img('p-wire-25'),
        isNew: true,
        specs: [
          spec('المقطع', 'Cross-section', '2.5 مم²', '2.5 mm²'),
          spec('الطول', 'Length', '100 متر', '100 m'),
          spec('الموصل', 'Conductor', 'نحاس نقي 99.9%', '99.9% pure copper'),
          spec('الجهد', 'Voltage', '450/750 فولت', '450/750 V'),
        ],
      },
      {
        name: 'كابل أرضي مسلح 4×16 مم',
        nameEn: 'Armored Underground Cable 4x16 mm',
        description: 'كابل نحاس رباعي مسلح بشريط صلب للتغذية الرئيسية والتمديدات تحت الأرض، يباع بالمتر.',
        descriptionEn: 'Four-core steel-armored copper cable for main feeders and underground runs, sold per meter.',
        sku: 'EL-CAB-416',
        price: 68,
        stock: 500,
        image: img('p-cable-4x16'),
        specs: [
          spec('عدد الأطراف', 'Cores', '4 أطراف', '4 cores'),
          spec('المقطع', 'Cross-section', '16 مم²', '16 mm²'),
          spec('العزل', 'Insulation', 'XLPE مع تسليح صلب', 'XLPE, steel armored'),
          spec('وحدة البيع', 'Unit', 'متر طولي', 'Per meter'),
        ],
      },
    ],
  },
  {
    category: 'الإضاءة',
    categoryEn: 'Lighting',
    parent: 'الأدوات الكهربائية',
    products: [
      {
        name: 'لمبة LED 12 وات قاعدة E27',
        nameEn: 'LED Bulb 12W E27',
        description: 'لمبة LED موفرة للطاقة بإضاءة قوية وعمر تشغيل طويل، مناسبة للغرف والممرات.',
        descriptionEn: 'Energy-saving LED bulb with bright output and long lifespan, ideal for rooms and corridors.',
        sku: 'EL-LED-B12',
        price: 9.5,
        stock: 800,
        image: img('p-led-bulb'),
        specs: [
          spec('القدرة', 'Power', '12 وات', '12 W'),
          spec('القاعدة', 'Base', 'E27', 'E27'),
          spec('لون الإضاءة', 'Color temperature', 'أبيض دافئ 3000K', 'Warm white 3000K'),
          spec('العمر التشغيلي', 'Lifespan', '15,000 ساعة', '15,000 hours'),
        ],
      },
      {
        name: 'بانل LED سقف 60×60 سم - 48 وات',
        nameEn: 'LED Ceiling Panel 60x60 cm - 48W',
        description: 'بانل LED مسطح للأسقف المعلقة بإضاءة موزعة بدون وهج، مثالي للمكاتب والمحلات.',
        descriptionEn: 'Slim flat LED panel for suspended ceilings with glare-free even light, ideal for offices and shops.',
        sku: 'EL-LED-P48',
        price: 79,
        stock: 150,
        image: img('p-led-panel'),
        isNew: true,
        specs: [
          spec('المقاس', 'Size', '60×60 سم', '60x60 cm'),
          spec('القدرة', 'Power', '48 وات', '48 W'),
          spec('لون الإضاءة', 'Color temperature', 'أبيض 6500K', 'Cool white 6500K'),
          spec('التركيب', 'Mounting', 'غاطس في السقف المعلق', 'Recessed'),
        ],
      },
    ],
  },
  {
    category: 'المفاتيح والأفياش',
    categoryEn: 'Switches & Sockets',
    parent: 'الأدوات الكهربائية',
    products: [
      {
        name: 'مفتاح إنارة مزدوج أبيض',
        nameEn: 'Double Light Switch - White',
        description: 'مفتاح إنارة بخطين بتصميم عصري نحيف وإطار مربع، ضغطة ناعمة ونقاط تلامس نحاس.',
        descriptionEn: 'Two-gang light switch with a slim modern square plate, soft press and brass contacts.',
        sku: 'EL-SW-2G',
        price: 24,
        stock: 300,
        image: img('p-switch-double'),
        specs: [
          spec('عدد الخطوط', 'Gangs', '2 خط', '2 gang'),
          spec('التيار', 'Rating', '10 أمبير', '10 A'),
          spec('اللون', 'Color', 'أبيض', 'White'),
          spec('الخامة', 'Material', 'بولي كربونات مقاوم للحريق', 'Flame-retardant polycarbonate'),
        ],
      },
      {
        name: 'فيش عالمي 13 أمبير مع منفذين USB',
        nameEn: 'Universal 13A Socket with 2 USB Ports',
        description: 'فيش جداري عالمي يقبل أغلب أنواع الفيش، مع منفذين USB للشحن المباشر للموبايل.',
        descriptionEn: 'Universal wall socket that fits most plug types, with two USB ports for direct phone charging.',
        sku: 'EL-SK-USB',
        price: 45,
        stock: 220,
        image: img('p-socket-usb'),
        isNew: true,
        specs: [
          spec('التيار', 'Rating', '13 أمبير', '13 A'),
          spec('منافذ USB', 'USB ports', '2 منفذ 2.1 أمبير', '2 x 2.1 A'),
          spec('النوع', 'Type', 'عالمي', 'Universal'),
          spec('اللون', 'Color', 'أبيض', 'White'),
        ],
      },
    ],
  },
  {
    category: 'لوحات التوزيع والقواطع',
    categoryEn: 'Distribution Boards & Breakers',
    parent: 'الأدوات الكهربائية',
    products: [
      {
        name: 'قاطع MCB أحادي 32 أمبير',
        nameEn: 'Single Pole MCB Breaker 32A',
        description: 'قاطع دائرة صغير لحماية الخطوط من الأحمال الزائدة والقصر، يركب على قضيب DIN.',
        descriptionEn: 'Miniature circuit breaker protecting circuits from overload and short circuit, DIN-rail mounted.',
        sku: 'EL-MCB-32',
        price: 28,
        stock: 400,
        image: img('p-mcb'),
        specs: [
          spec('التيار', 'Rating', '32 أمبير', '32 A'),
          spec('عدد الأقطاب', 'Poles', 'قطب واحد', '1 pole'),
          spec('منحنى الفصل', 'Trip curve', 'C', 'C'),
          spec('سعة القطع', 'Breaking capacity', '6 كيلو أمبير', '6 kA'),
        ],
      },
      {
        name: 'لوحة توزيع 12 خط بباب شفاف',
        nameEn: '12-Way Distribution Board with Clear Door',
        description: 'لوحة توزيع بلاستيك مقاومة للصدمات بباب مدخن شفاف وقضبان تأريض ونيوترال جاهزة.',
        descriptionEn: 'Impact-resistant plastic distribution board with smoked clear door, earth and neutral bars included.',
        sku: 'EL-DB-12',
        price: 135,
        stock: 60,
        image: img('p-distboard'),
        specs: [
          spec('عدد الخطوط', 'Ways', '12 خط', '12 ways'),
          spec('التركيب', 'Mounting', 'خارجي على الحائط', 'Surface mounted'),
          spec('درجة الحماية', 'Protection', 'IP40', 'IP40'),
          spec('الخامة', 'Material', 'ABS مقاوم للحريق', 'Flame-retardant ABS'),
        ],
      },
    ],
  },
  {
    category: 'الأسمنت والخرسانة',
    categoryEn: 'Cement & Concrete',
    parent: 'مواد البناء',
    products: [
      {
        name: 'أسمنت بورتلاند عادي - كيس 50 كجم',
        nameEn: 'Ordinary Portland Cement - 50 kg Bag',
        description: 'أسمنت بورتلاند عالي الجودة للخرسانة المسلحة والمباني واللياسة، مطابق للمواصفات السعودية.',
        descriptionEn: 'High-quality Portland cement for reinforced concrete, masonry and plastering, meets SASO standards.',
        sku: 'BM-CEM-50',
        price: 17,
        stock: 2000,
        image: img('p-cement-bag'),
        specs: [
          spec('الوزن', 'Weight', '50 كجم', '50 kg'),
          spec('النوع', 'Type', 'بورتلاند عادي OPC', 'OPC'),
          spec('المقاومة', 'Strength class', '42.5 نيوتن', '42.5 N'),
          spec('الاستخدام', 'Use', 'خرسانة ومباني ولياسة', 'Concrete, masonry, plaster'),
        ],
      },
      {
        name: 'لاصق بلاط أسمنتي - كيس 25 كجم',
        nameEn: 'Cement Tile Adhesive - 25 kg Bag',
        description: 'لاصق أسمنتي معدل بالبوليمر لتركيب السيراميك والبورسلين على الأرضيات والحوائط.',
        descriptionEn: 'Polymer-modified cement adhesive for fixing ceramic and porcelain tiles on floors and walls.',
        sku: 'BM-ADH-25',
        price: 32,
        stock: 600,
        image: img('p-tile-adhesive'),
        specs: [
          spec('الوزن', 'Weight', '25 كجم', '25 kg'),
          spec('التصنيف', 'Class', 'C2TE', 'C2TE'),
          spec('التغطية', 'Coverage', '4-5 كجم/م²', '4-5 kg/m²'),
          spec('الاستخدام', 'Use', 'داخلي وخارجي', 'Indoor & outdoor'),
        ],
      },
    ],
  },
  {
    category: 'حديد التسليح',
    categoryEn: 'Steel Rebar',
    parent: 'مواد البناء',
    products: [
      {
        name: 'حديد تسليح 12 مم - طن',
        nameEn: 'Steel Rebar 12 mm - Ton',
        description: 'حديد تسليح عالي المقاومة مشرشر للأساسات والأعمدة والأسقف، أسياخ بطول 12 متر.',
        descriptionEn: 'High-tensile deformed rebar for foundations, columns and slabs, 12 m bars.',
        sku: 'BM-RB-12',
        price: 2650,
        stock: 40,
        image: img('p-rebar-12'),
        specs: [
          spec('القطر', 'Diameter', '12 مم', '12 mm'),
          spec('طول السيخ', 'Bar length', '12 متر', '12 m'),
          spec('الرتبة', 'Grade', 'Grade 60', 'Grade 60'),
          spec('وحدة البيع', 'Unit', 'طن', 'Ton'),
        ],
      },
      {
        name: 'سلك رباط حديد - لفة 20 كجم',
        nameEn: 'Rebar Tie Wire - 20 kg Coil',
        description: 'سلك حديد مجلفن لين لربط أسياخ التسليح بسهولة وثبات في الموقع.',
        descriptionEn: 'Soft annealed steel tie wire for quick and secure rebar tying on site.',
        sku: 'BM-TW-20',
        price: 95,
        stock: 150,
        image: img('p-tie-wire'),
        specs: [
          spec('الوزن', 'Weight', '20 كجم', '20 kg'),
          spec('القطر', 'Gauge', '1.2 مم', '1.2 mm'),
          spec('المعالجة', 'Finish', 'مُلدّن أسود', 'Black annealed'),
        ],
      },
    ],
  },
  {
    category: 'الطوب والبلوك',
    categoryEn: 'Bricks & Blocks',
    parent: 'مواد البناء',
    products: [
      {
        name: 'بلوك أسمنتي مفرغ 20×20×40 سم',
        nameEn: 'Hollow Concrete Block 20x20x40 cm',
        description: 'بلوك أسمنتي مفرغ بضغط عالي للحوائط الخارجية والداخلية، خفيف وسهل التركيب.',
        descriptionEn: 'High-pressure hollow concrete block for exterior and interior walls, light and easy to lay.',
        sku: 'BM-BLK-20',
        price: 3.25,
        stock: 10000,
        image: img('p-concrete-block'),
        specs: [
          spec('المقاس', 'Size', '20×20×40 سم', '20x20x40 cm'),
          spec('النوع', 'Type', 'مفرغ', 'Hollow'),
          spec('مقاومة الضغط', 'Compressive strength', '70 كجم/سم²', '70 kg/cm²'),
          spec('وحدة البيع', 'Unit', 'حبة', 'Piece'),
        ],
      },
      {
        name: 'طوب أحمر مخرم',
        nameEn: 'Perforated Red Clay Brick',
        description: 'طوب طيني أحمر محروق مخرم بعزل حراري جيد، مناسب للحوائط والواجهات.',
        descriptionEn: 'Fired perforated red clay brick with good thermal insulation for walls and facades.',
        sku: 'BM-BRK-RD',
        price: 1.1,
        stock: 25000,
        image: img('p-red-brick'),
        specs: [
          spec('المقاس', 'Size', '24×11.5×7 سم', '24x11.5x7 cm'),
          spec('الخامة', 'Material', 'طين محروق', 'Fired clay'),
          spec('وحدة البيع', 'Unit', 'حبة', 'Piece'),
        ],
      },
    ],
  },
  {
    category: 'مواد العزل',
    categoryEn: 'Insulation Materials',
    parent: 'مواد البناء',
    products: [
      {
        name: 'لفة عزل مائي بيتومينية 4 مم',
        nameEn: 'Bitumen Waterproofing Membrane 4 mm',
        description: 'لفائف عزل مائي بيتوميني معدل للأسطح والحمامات والأساسات، تركب باللحام الحراري.',
        descriptionEn: 'Modified bitumen waterproofing membrane for roofs, bathrooms and foundations, torch-applied.',
        sku: 'BM-WP-4',
        price: 145,
        stock: 200,
        image: img('p-bitumen-roll'),
        specs: [
          spec('السماكة', 'Thickness', '4 مم', '4 mm'),
          spec('مقاس اللفة', 'Roll size', '1×10 متر', '1x10 m'),
          spec('التسليح', 'Reinforcement', 'بوليستر', 'Polyester'),
          spec('الوجه', 'Finish', 'رملي', 'Sanded'),
        ],
      },
      {
        name: 'ألواح عزل حراري XPS سماكة 5 سم',
        nameEn: 'XPS Thermal Insulation Board 5 cm',
        description: 'ألواح بوليسترين مبثوق عالية الكثافة لعزل الأسطح والحوائط حرارياً وتقليل استهلاك التكييف.',
        descriptionEn: 'High-density extruded polystyrene boards for roof and wall thermal insulation, cutting AC load.',
        sku: 'BM-XPS-5',
        price: 38,
        stock: 350,
        image: img('p-xps-board'),
        isNew: true,
        specs: [
          spec('السماكة', 'Thickness', '5 سم', '5 cm'),
          spec('المقاس', 'Size', '60×120 سم', '60x120 cm'),
          spec('الكثافة', 'Density', '32 كجم/م³', '32 kg/m³'),
          spec('وحدة البيع', 'Unit', 'لوح', 'Board'),
        ],
      },
    ],
  },
  {
    category: 'الخلاطات والحنفيات',
    categoryEn: 'Faucets & Mixers',
    parent: 'أدوات صحية',
    products: [
      {
        name: 'خلاط مغسلة كروم بذراع واحد',
        nameEn: 'Chrome Single-Lever Basin Mixer',
        description: 'خلاط مغسلة نحاس مطلي كروم بخرطوشة سيراميك وموفر مياه، تصميم عصري بسيط.',
        descriptionEn: 'Chrome-plated brass basin mixer with ceramic cartridge and water-saving aerator, clean modern design.',
        sku: 'SN-MX-BAS',
        price: 189,
        stock: 90,
        image: img('p-basin-mixer'),
        specs: [
          spec('الخامة', 'Material', 'نحاس مطلي كروم', 'Chrome-plated brass'),
          spec('الخرطوشة', 'Cartridge', 'سيراميك 35 مم', '35 mm ceramic'),
          spec('التركيب', 'Mounting', 'على المغسلة', 'Deck mounted'),
          spec('الضمان', 'Warranty', '5 سنوات', '5 years'),
        ],
      },
      {
        name: 'خلاط مطبخ أسود مطفي بدش سحب',
        nameEn: 'Matte Black Pull-Down Kitchen Mixer',
        description: 'خلاط مطبخ برقبة عالية مقوسة ورأس دش سحب بوضعين، تشطيب أسود مطفي مقاوم للبصمات.',
        descriptionEn: 'High-arc kitchen mixer with two-mode pull-down spray, fingerprint-resistant matte black finish.',
        sku: 'SN-MX-KIT',
        price: 349,
        stock: 45,
        image: img('p-kitchen-mixer'),
        isNew: true,
        specs: [
          spec('اللون', 'Finish', 'أسود مطفي', 'Matte black'),
          spec('أوضاع الدش', 'Spray modes', 'وضعين', '2 modes'),
          spec('الخامة', 'Material', 'ستانلس ستيل 304', 'SS 304'),
          spec('الضمان', 'Warranty', '5 سنوات', '5 years'),
        ],
      },
    ],
  },
  {
    category: 'الأحواض والمغاسل',
    categoryEn: 'Sinks & Basins',
    parent: 'أدوات صحية',
    products: [
      {
        name: 'مغسلة سيراميك علوية دائرية 40 سم',
        nameEn: 'Round Ceramic Countertop Basin 40 cm',
        description: 'مغسلة سيراميك علوية بتشطيب لامع سهل التنظيف، تضيف لمسة فخمة للحمام.',
        descriptionEn: 'Glossy countertop ceramic basin, easy to clean, adds a premium touch to any bathroom.',
        sku: 'SN-BS-R40',
        price: 229,
        stock: 35,
        image: img('p-vessel-basin'),
        specs: [
          spec('القطر', 'Diameter', '40 سم', '40 cm'),
          spec('الخامة', 'Material', 'سيراميك', 'Ceramic'),
          spec('التركيب', 'Mounting', 'علوي على الرخام', 'Countertop'),
          spec('اللون', 'Color', 'أبيض لامع', 'Glossy white'),
        ],
      },
      {
        name: 'حوض مطبخ ستانلس حوضين مع مصفاة',
        nameEn: 'Stainless Double Bowl Kitchen Sink with Drainer',
        description: 'حوض مطبخ ستانلس ستيل بحوضين وسطح تصفية، مقاوم للصدأ والخدوش.',
        descriptionEn: 'Stainless steel double bowl kitchen sink with drainboard, rust and scratch resistant.',
        sku: 'SN-SK-DB',
        price: 399,
        stock: 25,
        image: img('p-steel-sink'),
        specs: [
          spec('المقاس', 'Size', '100×50 سم', '100x50 cm'),
          spec('الخامة', 'Material', 'ستانلس 304', 'SS 304'),
          spec('عدد الأحواض', 'Bowls', '2', '2'),
          spec('السماكة', 'Gauge', '0.8 مم', '0.8 mm'),
        ],
      },
    ],
  },
  {
    category: 'المراحيض والأطقم الصحية',
    categoryEn: 'Toilets & Sanitary Sets',
    parent: 'أدوات صحية',
    products: [
      {
        name: 'مرحاض معلق بدون حافة مع غطاء هادئ',
        nameEn: 'Rimless Wall-Hung Toilet with Soft-Close Seat',
        description: 'مرحاض معلق بتقنية بدون حافة لنظافة أعلى، مع غطاء رفيع بإغلاق هادئ.',
        descriptionEn: 'Rimless wall-hung toilet for better hygiene, with a slim soft-close seat.',
        sku: 'SN-WC-WH',
        price: 649,
        stock: 20,
        image: img('p-wall-toilet'),
        isNew: true,
        specs: [
          spec('النوع', 'Type', 'معلق', 'Wall-hung'),
          spec('التقنية', 'Technology', 'بدون حافة Rimless', 'Rimless'),
          spec('الغطاء', 'Seat', 'إغلاق هادئ', 'Soft-close'),
          spec('الخامة', 'Material', 'بورسلين', 'Vitreous china'),
        ],
      },
      {
        name: 'صندوق طرد مخفي مع لوحة ضغط مزدوجة',
        nameEn: 'Concealed Cistern Frame with Dual Flush Plate',
        description: 'شاسيه صندوق طرد مخفي داخل الحائط للمراحيض المعلقة، مع لوحة ضغط بزرين لتوفير المياه.',
        descriptionEn: 'In-wall concealed cistern frame for wall-hung toilets, with water-saving dual flush plate.',
        sku: 'SN-CS-CF',
        price: 549,
        stock: 18,
        image: img('p-concealed-cistern'),
        specs: [
          spec('سعة الطرد', 'Flush volume', '3/6 لتر', '3/6 L'),
          spec('الارتفاع', 'Height', '112 سم', '112 cm'),
          spec('الشاسيه', 'Frame', 'صلب مجلفن', 'Galvanized steel'),
        ],
      },
    ],
  },
  {
    category: 'الدش وملحقاته',
    categoryEn: 'Showers & Accessories',
    parent: 'أدوات صحية',
    products: [
      {
        name: 'طقم دش مطري ترموستاتيك 25 سم',
        nameEn: 'Thermostatic Rain Shower Set 25 cm',
        description: 'عمود دش كامل برأس مطري دائري ودش يدوي وخلاط ترموستاتيك يثبت درجة الحرارة.',
        descriptionEn: 'Complete shower column with round rain head, hand shower and thermostatic mixer for steady temperature.',
        sku: 'SN-SH-TH25',
        price: 899,
        stock: 15,
        image: img('p-shower-set'),
        isNew: true,
        specs: [
          spec('قطر الرأس', 'Head diameter', '25 سم', '25 cm'),
          spec('الخلاط', 'Mixer', 'ترموستاتيك', 'Thermostatic'),
          spec('الخامة', 'Material', 'نحاس مطلي كروم', 'Chrome-plated brass'),
          spec('الضمان', 'Warranty', '5 سنوات', '5 years'),
        ],
      },
      {
        name: 'دش يدوي كروم مع خرطوم 150 سم',
        nameEn: 'Chrome Hand Shower with 150 cm Hose',
        description: 'دش يدوي بخمس أوضاع رش مع خرطوم ستانلس مرن وحامل حائط.',
        descriptionEn: 'Five-mode hand shower with flexible stainless hose and wall bracket.',
        sku: 'SN-SH-HD',
        price: 85,
        stock: 120,
        image: img('p-hand-shower'),
        specs: [
          spec('أوضاع الرش', 'Spray modes', '5 أوضاع', '5 modes'),
          spec('طول الخرطوم', 'Hose length', '150 سم', '150 cm'),
          spec('الملحقات', 'Includes', 'حامل حائط', 'Wall bracket'),
        ],
      },
    ],
  },
  {
    category: 'المواسير والوصلات',
    categoryEn: 'Pipes & Fittings',
    parent: 'أدوات صحية',
    products: [
      {
        name: 'ماسورة PPR قطر 25 مم - 4 متر',
        nameEn: 'PPR Pipe 25 mm - 4 m',
        description: 'ماسورة بولي بروبلين للمياه الساخنة والباردة، تركب باللحام الحراري ومقاومة للترسبات.',
        descriptionEn: 'Polypropylene pipe for hot and cold water, heat-fused joints, scale resistant.',
        sku: 'SN-PPR-25',
        price: 22,
        stock: 700,
        image: img('p-ppr-pipe'),
        specs: [
          spec('القطر', 'Diameter', '25 مم', '25 mm'),
          spec('الطول', 'Length', '4 متر', '4 m'),
          spec('الضغط', 'Pressure', 'PN20', 'PN20'),
          spec('الاستخدام', 'Use', 'مياه ساخنة وباردة', 'Hot & cold water'),
        ],
      },
      {
        name: 'محبس كورة نحاس 1 بوصة',
        nameEn: 'Brass Ball Valve 1 inch',
        description: 'محبس كورة نحاس ثقيل بذراع حديد، قفل وفتح سريع وإحكام تام بدون تسريب.',
        descriptionEn: 'Heavy brass ball valve with steel lever, quarter-turn operation and leak-free sealing.',
        sku: 'SN-VLV-1',
        price: 48,
        stock: 250,
        image: img('p-ball-valve'),
        specs: [
          spec('المقاس', 'Size', '1 بوصة', '1 inch'),
          spec('الخامة', 'Material', 'نحاس', 'Brass'),
          spec('الضغط', 'Pressure', '25 بار', '25 bar'),
          spec('التوصيل', 'Connection', 'سن داخلي', 'Female thread'),
        ],
      },
    ],
  },
  {
    category: 'سخانات المياه',
    categoryEn: 'Water Heaters',
    parent: 'أدوات صحية',
    products: [
      {
        name: 'سخان كهربائي 80 لتر',
        nameEn: 'Electric Water Heater 80 L',
        description: 'سخان مياه كهربائي بخزان مبطن بالمينا وعزل عالي الكثافة يحافظ على حرارة المياه لفترة طويلة.',
        descriptionEn: 'Electric storage heater with enamel-lined tank and high-density insulation for long heat retention.',
        sku: 'SN-WH-80',
        price: 699,
        stock: 30,
        image: img('p-heater-80'),
        specs: [
          spec('السعة', 'Capacity', '80 لتر', '80 L'),
          spec('القدرة', 'Power', '2000 وات', '2000 W'),
          spec('التركيب', 'Mounting', 'رأسي على الحائط', 'Vertical wall'),
          spec('الضمان', 'Warranty', 'سنتين على الخزان', '2 years tank'),
        ],
      },
      {
        name: 'سخان فوري كهربائي بشاشة رقمية',
        nameEn: 'Instant Electric Water Heater with Digital Display',
        description: 'سخان فوري بدون خزان يسخن المياه لحظياً، بشاشة لعرض الحرارة وحماية من الجفاف.',
        descriptionEn: 'Tankless instant heater that heats water on demand, with temperature display and dry-run protection.',
        sku: 'SN-WH-INS',
        price: 459,
        stock: 40,
        image: img('p-instant-heater'),
        isNew: true,
        specs: [
          spec('النوع', 'Type', 'فوري بدون خزان', 'Tankless instant'),
          spec('القدرة', 'Power', '8500 وات', '8500 W'),
          spec('الشاشة', 'Display', 'رقمية LED', 'Digital LED'),
          spec('الحماية', 'Protection', 'ضد الجفاف والحرارة الزائدة', 'Dry-run & overheat'),
        ],
      },
    ],
  },
];
