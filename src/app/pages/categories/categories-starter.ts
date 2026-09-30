export interface StarterCategory {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  image: string;
}

export interface StarterPack extends StarterCategory {
  key: string;
  /** أسماء بديلة لو الفئة الرئيسية موجودة بالفعل باسم قريب */
  aliases: string[];
  children: StarterCategory[];
}

const img = (name: string) => `assets/seed/categories/${name}.jpg`;

export const STARTER_PACKS: StarterPack[] = [
  {
    key: 'electrical',
    name: 'الأدوات الكهربائية',
    nameEn: 'Electrical Supplies',
    description: 'كل مستلزمات التأسيس والتشطيب الكهربائي: أسلاك، إضاءة، مفاتيح وأفياش، ولوحات توزيع.',
    descriptionEn: 'Everything for electrical rough-in and finishing: wires, lighting, switches, sockets and distribution boards.',
    image: img('cat-electrical'),
    aliases: ['الكهرباء', 'أدوات كهربائية', 'كهرباء', 'electrical'],
    children: [
      {
        name: 'الأسلاك والكابلات',
        nameEn: 'Wires & Cables',
        description: 'أسلاك نحاس معزولة ومقاطع مختلفة للإنارة والباور، وكابلات أرضية وتمديدات.',
        descriptionEn: 'Insulated copper wires in various sizes for lighting and power, plus grounding and feeder cables.',
        image: img('sub-cables'),
      },
      {
        name: 'الإضاءة',
        nameEn: 'Lighting',
        description: 'لمبات LED وسبوتات وبانلات سقف ونجف معلّق للمنازل والمحلات.',
        descriptionEn: 'LED bulbs, spotlights, ceiling panels and pendant lights for homes and shops.',
        image: img('sub-lighting'),
      },
      {
        name: 'المفاتيح والأفياش',
        nameEn: 'Switches & Sockets',
        description: 'مفاتيح إنارة مفردة ومزدوجة وأفياش عالمية وبرايز بأشكال عصرية.',
        descriptionEn: 'Single and double light switches, universal sockets and modern wall outlets.',
        image: img('sub-switches'),
      },
      {
        name: 'لوحات التوزيع والقواطع',
        nameEn: 'Distribution Boards & Breakers',
        description: 'لوحات توزيع وقواطع MCB وحماية من التسريب لتأمين الشبكة الكهربائية.',
        descriptionEn: 'Distribution boards, MCB breakers and RCD protection to secure the electrical network.',
        image: img('sub-breakers'),
      },
    ],
  },
  {
    key: 'building',
    name: 'مواد البناء',
    nameEn: 'Building Materials',
    description: 'المواد الأساسية لأعمال الهيكل والإنشاء: أسمنت، حديد تسليح، طوب وبلوك، ومواد عزل.',
    descriptionEn: 'Core structural materials: cement, rebar, bricks & blocks, and insulation.',
    image: img('cat-building'),
    aliases: ['مواد بناء', 'مواد الإنشاء', 'building'],
    children: [
      {
        name: 'الأسمنت والخرسانة',
        nameEn: 'Cement & Concrete',
        description: 'أسمنت بورتلاند عادي ومقاوم، وخرسانة جاهزة ومواد لياسة.',
        descriptionEn: 'Ordinary and resistant Portland cement, ready-mix concrete and plastering materials.',
        image: img('sub-cement'),
      },
      {
        name: 'حديد التسليح',
        nameEn: 'Steel Rebar',
        description: 'حديد تسليح بأقطار من 8 إلى 32 مم للأساسات والأعمدة والأسقف.',
        descriptionEn: 'Reinforcement steel bars from 8 to 32 mm for foundations, columns and slabs.',
        image: img('sub-rebar'),
      },
      {
        name: 'الطوب والبلوك',
        nameEn: 'Bricks & Blocks',
        description: 'طوب أحمر وبلوك أسمنتي مفرغ ومصمت لأعمال المباني والحوائط.',
        descriptionEn: 'Red clay bricks and hollow or solid concrete blocks for walls and masonry.',
        image: img('sub-bricks'),
      },
      {
        name: 'مواد العزل',
        nameEn: 'Insulation Materials',
        description: 'لفائف عزل مائي بيتوميني، وألواح عزل حراري، وصوف زجاجي للأسطح والحوائط.',
        descriptionEn: 'Bitumen waterproofing membranes, thermal insulation boards and glass wool for roofs and walls.',
        image: img('sub-insulation'),
      },
    ],
  },
  {
    key: 'sanitary',
    name: 'أدوات صحية',
    nameEn: 'Sanitary',
    description: 'خلاطات وأحواض وأطقم حمامات ومستلزمات السباكة الكاملة.',
    descriptionEn: 'Mixers, basins, bathroom sets and complete plumbing supplies.',
    image: img('sub-faucets'),
    aliases: ['الأدوات الصحية', 'ادوات صحية', 'sanitary', 'plumbing'],
    children: [
      {
        name: 'الخلاطات والحنفيات',
        nameEn: 'Faucets & Mixers',
        description: 'خلاطات حوض ومطبخ ودش بتشطيبات كروم وأسود مطفي.',
        descriptionEn: 'Basin, kitchen and shower mixers in chrome and matte black finishes.',
        image: img('sub-faucets'),
      },
      {
        name: 'الأحواض والمغاسل',
        nameEn: 'Sinks & Basins',
        description: 'مغاسل سيراميك علوية ومعلّقة، وأحواض مطبخ ستانلس بأحجام مختلفة.',
        descriptionEn: 'Countertop and wall-hung ceramic basins, and stainless kitchen sinks in various sizes.',
        image: img('sub-basins'),
      },
      {
        name: 'المراحيض والأطقم الصحية',
        nameEn: 'Toilets & Sanitary Sets',
        description: 'مراحيض معلّقة وأرضية وأطقم حمامات كاملة مع صناديق الطرد المخفية.',
        descriptionEn: 'Wall-hung and floor toilets, full bathroom sets and concealed cisterns.',
        image: img('sub-toilets'),
      },
      {
        name: 'الدش وملحقاته',
        nameEn: 'Showers & Accessories',
        description: 'رؤوس دش مطرية، أطقم دش يدوي، وخلاطات ترموستاتيك.',
        descriptionEn: 'Rain shower heads, hand shower sets and thermostatic mixers.',
        image: img('sub-showers'),
      },
      {
        name: 'المواسير والوصلات',
        nameEn: 'Pipes & Fittings',
        description: 'مواسير PPR و PVC، كيعان وتيهات ومحابس ووصلات نحاس للتغذية والصرف.',
        descriptionEn: 'PPR and PVC pipes, elbows, tees, valves and brass connectors for supply and drainage.',
        image: img('sub-pipes'),
      },
      {
        name: 'سخانات المياه',
        nameEn: 'Water Heaters',
        description: 'سخانات كهربائية بخزان وسخانات فورية بسعات مختلفة.',
        descriptionEn: 'Electric tank and instant water heaters in various capacities.',
        image: img('sub-heaters'),
      },
    ],
  },
];
