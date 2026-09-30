import { StarterSpec } from './products-starter';

export interface StarterDetails {
  description: string;
  descriptionEn: string;
  specs: StarterSpec[];
  /** شرائح الجملة: [أقل كمية، نسبة الخصم من السعر الأساسي] */
  tiers: [number, number][];
}

const s = (label: string, labelEn: string, value: string, valueEn: string): StarterSpec => ({ label, labelEn, value, valueEn });

export const STARTER_DETAILS: Record<string, StarterDetails> = {
  'EL-WIR-025': {
    description:
      'سلك نحاس نقي 99.9% بعزل PVC مزدوج مقاوم للحرارة حتى 70° ومثبط للهب، مرن وسهل السحب داخل المواسير.\nمناسب لخطوط الأفياش والسخانات والتكييفات الصغيرة في الشقق والفلل والمحلات.\nالمميزات: توصيل كهربائي عالي بفقد أقل للطاقة • عزل ثابت لا يتشقق مع الوقت • متوفر بألوان مختلفة لتمييز الخطوط • لفة كاملة 100 متر بطول مضبوط.',
    descriptionEn:
      '99.9% pure copper wire with double PVC insulation, heat resistant up to 70°C and flame retardant, flexible and easy to pull through conduits.\nIdeal for socket, heater and small AC circuits in apartments, villas and shops.\nFeatures: high conductivity with low losses • crack-free durable insulation • multiple colors for circuit identification • full 100 m roll with accurate length.',
    specs: [
      s('المعيار', 'Standard', 'IEC 60227 / SASO', 'IEC 60227 / SASO'),
      s('أقصى حرارة تشغيل', 'Max operating temp', '70° مئوية', '70 °C'),
      s('الألوان المتاحة', 'Available colors', 'أحمر، أسود، أزرق، أصفر/أخضر', 'Red, black, blue, yellow/green'),
      s('الضمان', 'Warranty', '10 سنوات ضد عيوب التصنيع', '10-year manufacturing warranty'),
    ],
    tiers: [[10, 5], [50, 9]],
  },
  'EL-CAB-416': {
    description:
      'كابل نحاس رباعي الأطراف معزول XLPE ومسلح بشريط صلب مجلفن يحميه من الضغط والقوارض، مصمم للدفن المباشر تحت الأرض.\nيستخدم للتغذية الرئيسية من العداد للوحة التوزيع وللمباني التجارية والمستودعات.\nالمميزات: يتحمل أحمال عالية لمسافات طويلة • غلاف خارجي PVC مقاوم للرطوبة والأشعة • تسليح يمنع التلف الميكانيكي • يقص بالطول المطلوب.',
    descriptionEn:
      'Four-core copper cable with XLPE insulation and galvanized steel tape armor protecting it from crushing and rodents, designed for direct burial.\nUsed for main feeders from the meter to the distribution board and for commercial buildings and warehouses.\nFeatures: carries high loads over long runs • moisture and UV resistant PVC sheath • armor prevents mechanical damage • cut to required length.',
    specs: [
      s('جهد التشغيل', 'Rated voltage', '0.6/1 كيلو فولت', '0.6/1 kV'),
      s('أقصى حرارة للموصل', 'Max conductor temp', '90° مئوية', '90 °C'),
      s('الغلاف الخارجي', 'Outer sheath', 'PVC أسود', 'Black PVC'),
      s('المعيار', 'Standard', 'IEC 60502-1', 'IEC 60502-1'),
    ],
    tiers: [[50, 4], [200, 8]],
  },
  'EL-LED-B12': {
    description:
      'لمبة LED بقدرة 12 وات تعطي إضاءة تعادل لمبة عادية 100 وات، وتوفر حتى 85% من استهلاك الكهرباء.\nإضاءة دافئة مريحة للعين بدون وميض، مناسبة لغرف النوم والصالات والممرات.\nالمميزات: تشتغل فوراً بدون تسخين • لا تصدر أشعة فوق بنفسجية • جسم ألومنيوم يبدد الحرارة • تتحمل تذبذب الجهد.',
    descriptionEn:
      '12W LED bulb delivering the brightness of a 100W incandescent while saving up to 85% electricity.\nFlicker-free warm light that is easy on the eyes, ideal for bedrooms, living rooms and corridors.\nFeatures: instant full brightness • no UV emission • aluminum body for heat dissipation • tolerant of voltage fluctuations.',
    specs: [
      s('شدة الإضاءة', 'Luminous flux', '1100 لومن', '1100 lm'),
      s('زاوية الإضاءة', 'Beam angle', '220°', '220°'),
      s('الجهد', 'Voltage', '100-265 فولت', '100-265 V'),
      s('الضمان', 'Warranty', 'سنتين', '2 years'),
    ],
    tiers: [[20, 6], [100, 12]],
  },
  'EL-LED-P48': {
    description:
      'بانل LED مربع 60×60 بسماكة رفيعة يركب مكان بلاطة السقف المعلق مباشرة، بإضاءة موزعة بالتساوي بدون نقاط وهج.\nمثالي للمكاتب والعيادات والمحلات والمدارس.\nالمميزات: درايفر خارجي عالي الكفاءة • غطاء PMMA مقاوم للاصفرار • إطار ألومنيوم متين • معامل تجسيد لوني عالي CRI>80.',
    descriptionEn:
      'Slim 60x60 square LED panel that drops straight into a suspended ceiling grid, with even glare-free light distribution.\nIdeal for offices, clinics, shops and schools.\nFeatures: high-efficiency external driver • anti-yellowing PMMA diffuser • sturdy aluminum frame • high color rendering CRI>80.',
    specs: [
      s('شدة الإضاءة', 'Luminous flux', '4300 لومن', '4300 lm'),
      s('السماكة', 'Thickness', '10 مم', '10 mm'),
      s('معامل التجسيد اللوني', 'CRI', 'أكبر من 80', '>80'),
      s('الضمان', 'Warranty', '3 سنوات', '3 years'),
    ],
    tiers: [[10, 5], [40, 10]],
  },
  'EL-SW-2G': {
    description:
      'مفتاح إنارة بخطين بتصميم أوروبي نحيف وإطار مربع بلون أبيض ناصع، يتحكم في مصدرين إضاءة من نفس المكان.\nمناسب للغرف والصالات والمطابخ.\nالمميزات: ضغطة ناعمة وصوت هادئ • نقاط تلامس نحاس فضي تتحمل 40,000 ضغطة • خامة مقاومة للحريق والخدوش • تركيب سريع على علبة 3×3.',
    descriptionEn:
      'Two-gang light switch with a slim European design and bright white square plate, controlling two light sources from one spot.\nSuitable for rooms, living areas and kitchens.\nFeatures: soft quiet click • silver-brass contacts rated for 40,000 operations • flame and scratch resistant material • quick fit on a standard 3x3 box.',
    specs: [
      s('العمر الافتراضي', 'Lifespan', '40,000 ضغطة', '40,000 operations'),
      s('المقاس', 'Size', '86×86 مم', '86x86 mm'),
      s('علبة التركيب', 'Back box', '3×3 بوصة', '3x3 inch'),
      s('الضمان', 'Warranty', '5 سنوات', '5 years'),
    ],
    tiers: [[20, 5], [100, 10]],
  },
  'EL-SK-USB': {
    description:
      'فيش جداري عالمي 13 أمبير يقبل الفيش الإنجليزي والأوروبي والأمريكي، مع منفذين USB لشحن الموبايل والتابلت بدون شاحن.\nمثالي بجوار السرير والمكتب والمطبخ.\nالمميزات: شحن ذكي يتعرف على الجهاز • غطاء أمان يمنع إدخال الأجسام الغريبة • حماية من الحمل الزائد في دائرة USB • تشطيب مطفي مقاوم للبصمات.',
    descriptionEn:
      'Universal 13A wall socket accepting UK, EU and US plugs, with two USB ports to charge phones and tablets without an adapter.\nIdeal beside beds, desks and kitchen counters.\nFeatures: smart charging that detects the device • child safety shutters • overload protection on the USB circuit • matte fingerprint-resistant finish.',
    specs: [
      s('إجمالي تيار USB', 'Total USB output', '3.1 أمبير', '3.1 A'),
      s('غطاء أمان', 'Safety shutters', 'نعم', 'Yes'),
      s('المقاس', 'Size', '86×86 مم', '86x86 mm'),
      s('الضمان', 'Warranty', 'سنتين', '2 years'),
    ],
    tiers: [[10, 5], [50, 10]],
  },
  'EL-MCB-32': {
    description:
      'قاطع دائرة صغير MCB قطب واحد 32 أمبير يفصل التيار تلقائياً عند الحمل الزائد أو القصر لحماية الأسلاك والأجهزة.\nمناسب لخطوط التكييف والسخانات والأفران.\nالمميزات: منحنى فصل C للأحمال المختلطة • سعة قطع 6 كيلو أمبير • مؤشر واضح لحالة التشغيل • تركيب سريع على قضيب DIN.',
    descriptionEn:
      'Single-pole 32A miniature circuit breaker that trips automatically on overload or short circuit to protect wiring and appliances.\nSuitable for AC, water heater and oven circuits.\nFeatures: type C curve for mixed loads • 6 kA breaking capacity • clear on/off indicator • quick DIN-rail mounting.',
    specs: [
      s('الجهد', 'Voltage', '230/400 فولت', '230/400 V'),
      s('العمر الميكانيكي', 'Mechanical life', '20,000 عملية', '20,000 operations'),
      s('المعيار', 'Standard', 'IEC 60898-1', 'IEC 60898-1'),
      s('الضمان', 'Warranty', '3 سنوات', '3 years'),
    ],
    tiers: [[12, 5], [60, 10]],
  },
  'EL-DB-12': {
    description:
      'لوحة توزيع كهربائية 12 خط من البلاستيك ABS المقاوم للصدمات والحريق، بباب مدخن شفاف يوضح حالة القواطع بدون فتح.\nتأتي جاهزة بقضيب DIN وقضبان نيوترال وأرضي.\nالمميزات: تركيب خارجي سهل على الحائط • فتحات دخول كابلات من أعلى وأسفل • باب بمفصلات قوية وقفل ضغط • مناسبة للشقق والمحلات الصغيرة.',
    descriptionEn:
      '12-way distribution board made of impact and fire resistant ABS, with a smoked transparent door showing breaker status without opening.\nSupplied with DIN rail plus neutral and earth bars.\nFeatures: easy surface wall mounting • cable knockouts on top and bottom • strong hinged door with push latch • ideal for apartments and small shops.',
    specs: [
      s('المقاس', 'Dimensions', '300×250×100 مم', '300x250x100 mm'),
      s('اللون', 'Color', 'أبيض مع باب مدخن', 'White with smoked door'),
      s('الملحقات', 'Includes', 'قضيب DIN ونيوترال وأرضي', 'DIN rail, neutral & earth bars'),
      s('الضمان', 'Warranty', '5 سنوات', '5 years'),
    ],
    tiers: [[5, 5], [20, 10]],
  },
  'BM-CEM-50': {
    description:
      'أسمنت بورتلاند عادي رتبة 42.5 عالي النعومة يعطي مقاومة مبكرة ونهائية ممتازة للخرسانة، إنتاج محلي مطابق للمواصفات السعودية.\nيستخدم في الخرسانة المسلحة والأساسات والمباني واللياسة والبلاط.\nالمميزات: تماسك سريع وقوة ضغط عالية • لون رمادي ثابت • كيس ورقي متعدد الطبقات يحمي من الرطوبة • متوفر بكميات كبيرة للمشاريع.',
    descriptionEn:
      'Ordinary Portland cement grade 42.5 with high fineness for excellent early and final concrete strength, locally produced to SASO standards.\nUsed for reinforced concrete, foundations, masonry, plastering and tiling.\nFeatures: fast setting and high compressive strength • consistent grey color • multi-ply paper bag protects from moisture • bulk supply for projects.',
    specs: [
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
      s('زمن الشك الابتدائي', 'Initial setting time', '≥ 60 دقيقة', '≥ 60 min'),
      s('مدة الصلاحية', 'Shelf life', '3 شهور في مكان جاف', '3 months, dry storage'),
      s('وحدة البيع', 'Unit', 'كيس', 'Bag'),
    ],
    tiers: [[50, 4], [200, 8], [1000, 12]],
  },
  'BM-ADH-25': {
    description:
      'لاصق بلاط أسمنتي معدل بالبوليمرات تصنيف C2TE، قوة لصق عالية ومقاوم للانزلاق مع وقت فتح ممتد.\nمناسب للسيراميك والبورسلين والرخام على الأرضيات والحوائط الداخلية والخارجية والمسابح.\nالمميزات: يخلط بالماء فقط • لا ينزلق البلاط على الحوائط • يتحمل الرطوبة والحرارة • تغطية ممتازة وسهل الفرد بالمشط.',
    descriptionEn:
      'Polymer-modified C2TE cementitious tile adhesive with high bond strength, slip resistance and extended open time.\nSuitable for ceramic, porcelain and marble on indoor and outdoor floors, walls and pools.\nFeatures: mix with water only • no tile slip on walls • moisture and heat resistant • excellent coverage and easy to comb.',
    specs: [
      s('وقت الفتح', 'Open time', '30 دقيقة', '30 min'),
      s('نسبة الخلط', 'Mixing ratio', '6.5 لتر ماء لكل كيس', '6.5 L water per bag'),
      s('الاستخدام بعد', 'Traffic after', '24 ساعة', '24 hours'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[20, 5], [100, 10]],
  },
  'BM-RB-12': {
    description:
      'حديد تسليح مشرشر قطر 12 مم رتبة 60 عالي المقاومة للشد، مطابق للمواصفات القياسية السعودية والأمريكية ASTM A615.\nيستخدم في الأساسات والأعمدة والكمرات والأسقف الخرسانية.\nالمميزات: نتوءات منتظمة تزيد التماسك مع الخرسانة • قابلية ثني عالية بدون تشقق • أطوال قياسية 12 متر • شهادة مطابقة مع كل شحنة.',
    descriptionEn:
      '12 mm deformed Grade 60 high-tensile reinforcement bar, compliant with SASO and ASTM A615 standards.\nUsed for foundations, columns, beams and concrete slabs.\nFeatures: uniform ribs for superior concrete bond • high bendability without cracking • standard 12 m lengths • mill certificate with every shipment.',
    specs: [
      s('إجهاد الخضوع', 'Yield strength', '420 ميجا باسكال', '420 MPa'),
      s('الوزن للمتر', 'Weight per meter', '0.888 كجم', '0.888 kg'),
      s('المعيار', 'Standard', 'ASTM A615 / SASO', 'ASTM A615 / SASO'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[5, 3], [20, 6]],
  },
  'BM-TW-20': {
    description:
      'سلك رباط حديد ملدّن أسود لين وسهل اللف باليد أو بالكماشة، يثبت أسياخ التسليح في مكانها أثناء صب الخرسانة.\nيستخدم في ربط شبكات الأسقف والأعمدة والأساسات.\nالمميزات: ليونة عالية بدون كسر • قوة ربط ثابتة • لفة 20 كجم اقتصادية • مناسب لكل أقطار الحديد.',
    descriptionEn:
      'Soft black annealed tie wire, easy to twist by hand or with pliers, holding rebar in place during concrete pouring.\nUsed to tie slab meshes, columns and foundations.\nFeatures: high flexibility without breaking • consistent tying strength • economical 20 kg coil • suits all bar diameters.',
    specs: [
      s('قوة الشد', 'Tensile strength', '350-450 ميجا باسكال', '350-450 MPa'),
      s('طول تقريبي', 'Approx. length', '2,250 متر', '2,250 m'),
      s('المنشأ', 'Origin', 'الإمارات', 'UAE'),
    ],
    tiers: [[10, 5], [50, 10]],
  },
  'BM-BLK-20': {
    description:
      'بلوك أسمنتي مفرغ مقاس 20 سم مصنوع بمكابس هيدروليك عالية الضغط، أبعاد دقيقة وسطح منتظم يقلل استهلاك المونة.\nمناسب للحوائط الخارجية والداخلية وأسوار الفلل.\nالمميزات: فراغات تقلل الوزن وتحسن العزل • مقاومة ضغط عالية • معالج بالبخار لثبات الأبعاد • يباع بالحبة أو بالطبلية.',
    descriptionEn:
      '20 cm hollow concrete block made with high-pressure hydraulic presses, with accurate dimensions and flat faces that reduce mortar use.\nSuitable for exterior and interior walls and villa boundary walls.\nFeatures: cores reduce weight and improve insulation • high compressive strength • steam cured for dimensional stability • sold per piece or pallet.',
    specs: [
      s('الوزن', 'Weight', '17 كجم تقريباً', '≈ 17 kg'),
      s('العدد في الطبلية', 'Per pallet', '100 حبة', '100 pcs'),
      s('العدد للمتر المربع', 'Per m²', '12.5 حبة', '12.5 pcs'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[500, 5], [2000, 10]],
  },
  'BM-BRK-RD': {
    description:
      'طوب أحمر طيني محروق في أفران عالية الحرارة، مخرم لتقليل الوزن وتحسين العزل الحراري والصوتي.\nمناسب للحوائط الداخلية والواجهات وأعمال الديكور.\nالمميزات: لون طبيعي ثابت لا يبهت • امتصاص مياه منخفض • تحمل عالي للضغط • عزل حراري أفضل من البلوك العادي.',
    descriptionEn:
      'Red clay brick fired in high-temperature kilns, perforated to reduce weight and improve thermal and acoustic insulation.\nSuitable for interior walls, facades and decorative work.\nFeatures: natural non-fading color • low water absorption • high compressive strength • better thermal insulation than standard blocks.',
    specs: [
      s('الوزن', 'Weight', '2.2 كجم تقريباً', '≈ 2.2 kg'),
      s('مقاومة الضغط', 'Compressive strength', '100 كجم/سم²', '100 kg/cm²'),
      s('العدد للمتر المربع', 'Per m²', '50 حبة', '50 pcs'),
      s('العدد في الطبلية', 'Per pallet', '400 حبة', '400 pcs'),
    ],
    tiers: [[1000, 5], [5000, 10]],
  },
  'BM-WP-4': {
    description:
      'لفائف عزل مائي بيتومينية معدلة SBS سماكة 4 مم مسلحة بالبوليستر، تركب باللحام بالشعلة لتكوين طبقة متصلة مانعة لتسرب المياه.\nللأسطح والحمامات والمطابخ والأساسات وخزانات المياه الأرضية.\nالمميزات: مرونة عالية في الحرارة والبرودة • مقاومة للتمزق والثقب • وجه رملي يحمي من الأشعة • عمر افتراضي طويل.',
    descriptionEn:
      '4 mm SBS-modified bitumen waterproofing membrane with polyester reinforcement, torch-applied to form a continuous leak-proof layer.\nFor roofs, bathrooms, kitchens, foundations and underground water tanks.\nFeatures: high flexibility in heat and cold • tear and puncture resistant • sanded face protects from UV • long service life.',
    specs: [
      s('نوع التعديل', 'Modification', 'SBS', 'SBS'),
      s('المرونة على البارد', 'Cold flexibility', '-10° مئوية', '-10 °C'),
      s('التغطية', 'Coverage', '10 م² للفة (8.5 م² بعد التداخل)', '10 m² / roll (8.5 m² net)'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[10, 5], [50, 10]],
  },
  'BM-XPS-5': {
    description:
      'ألواح عزل حراري من البوليسترين المبثوق XPS عالية الكثافة بخلايا مغلقة لا تمتص المياه، تقلل حرارة الأسطح وتوفر في استهلاك التكييف حتى 40%.\nللأسطح والحوائط الخارجية والأرضيات تحت البلاط.\nالمميزات: حواف لسان ومجرى تمنع الجسور الحرارية • خفيفة وسهلة القص • تتحمل الضغط والمشي • لا تتحلل مع الوقت.',
    descriptionEn:
      'High-density closed-cell XPS extruded polystyrene boards that absorb no water, reducing roof heat and cutting AC consumption by up to 40%.\nFor roofs, external walls and floors under tiles.\nFeatures: tongue and groove edges prevent thermal bridges • light and easy to cut • withstands load and foot traffic • does not degrade over time.',
    specs: [
      s('معامل التوصيل الحراري', 'Thermal conductivity', '0.033 وات/م.كلفن', '0.033 W/m·K'),
      s('مقاومة الضغط', 'Compressive strength', '250 كيلو باسكال', '250 kPa'),
      s('نوع الحواف', 'Edges', 'لسان ومجرى', 'Tongue & groove'),
    ],
    tiers: [[20, 5], [100, 10]],
  },
  'SN-MX-BAS': {
    description:
      'خلاط مغسلة بذراع واحد من النحاس المطلي بطبقات كروم متعددة، بخرطوشة سيراميك تتحكم بدقة في الحرارة وقوة الماء.\nمناسب للحمامات الحديثة والمغاسل العلوية القصيرة.\nالمميزات: موفر مياه يقلل الاستهلاك حتى 30% • لمعة دائمة مقاومة للصدأ • حركة ناعمة للذراع • يأتي بالخراطيم وطقم التركيب.',
    descriptionEn:
      'Single-lever basin mixer in brass with multi-layer chrome plating and a ceramic cartridge for precise temperature and flow control.\nSuitable for modern bathrooms and short countertop basins.\nFeatures: aerator saves up to 30% water • lasting corrosion-resistant shine • smooth lever action • supplied with hoses and fitting kit.',
    specs: [
      s('معدل التدفق', 'Flow rate', '6 لتر/دقيقة', '6 L/min'),
      s('الارتفاع', 'Height', '16 سم', '16 cm'),
      s('المحتويات', 'In the box', 'خلاط + خرطومين + طقم تثبيت', 'Mixer, 2 hoses, fixing kit'),
      s('المنشأ', 'Origin', 'تركيا', 'Turkey'),
    ],
    tiers: [[5, 5], [20, 10]],
  },
  'SN-MX-KIT': {
    description:
      'خلاط مطبخ برقبة مقوسة عالية ورأس دش سحب بوضعين (تيار مباشر ورذاذ)، يسهل غسل الأواني الكبيرة وتنظيف الحوض.\nتشطيب أسود مطفي عصري مقاوم للبصمات وبقع الماء.\nالمميزات: خرطوم سحب بطول 50 سم يرجع تلقائياً • دوران 360° • ستانلس ستيل 304 خالي من الرصاص • خرطوشة سيراميك تتحمل 500,000 دورة.',
    descriptionEn:
      'High-arc kitchen mixer with a two-mode pull-down head (stream and spray), making it easy to wash large pots and clean the sink.\nModern matte black finish resisting fingerprints and water spots.\nFeatures: 50 cm pull-out hose with auto retract • 360° swivel • lead-free SS 304 • ceramic cartridge rated for 500,000 cycles.',
    specs: [
      s('طول خرطوم السحب', 'Pull-out hose', '50 سم', '50 cm'),
      s('الدوران', 'Swivel', '360°', '360°'),
      s('الارتفاع', 'Height', '42 سم', '42 cm'),
      s('المنشأ', 'Origin', 'الصين', 'China'),
    ],
    tiers: [[5, 5], [20, 10]],
  },
  'SN-BS-R40': {
    description:
      'مغسلة سيراميك علوية دائرية قطر 40 سم بتصميم عصري بسيط، مصنوعة من سيراميك عالي الكثافة ومزججة بطبقة لامعة سهلة التنظيف.\nتركب فوق رخامة أو خشب الوحدة وتعطي الحمام لمسة فندقية.\nالمميزات: سطح أملس لا يحتفظ بالبقع • مقاومة للخدش وتغير اللون • تناسب الخلاطات العالية • بدون فتحة فائض لشكل أنظف.',
    descriptionEn:
      'Round 40 cm countertop ceramic basin with a clean modern design, made of dense ceramic with a glossy easy-clean glaze.\nSits on marble or wood vanities for a hotel-style bathroom look.\nFeatures: smooth stain-resistant surface • scratch and discoloration resistant • pairs with tall mixers • no overflow for a cleaner look.',
    specs: [
      s('الارتفاع', 'Height', '14 سم', '14 cm'),
      s('فتحة الصرف', 'Drain size', '1.25 بوصة', '1.25 inch'),
      s('فتحة فائض', 'Overflow', 'بدون', 'No'),
      s('المنشأ', 'Origin', 'مصر', 'Egypt'),
    ],
    tiers: [[5, 5], [20, 10]],
  },
  'SN-SK-DB': {
    description:
      'حوض مطبخ ستانلس ستيل 304 بحوضين عميقين وسطح تصفية جانبي، تشطيب مصقول سهل التنظيف ومقاوم للصدأ.\nمناسب للمطابخ المنزلية والتجارية الصغيرة.\nالمميزات: طبقة عازلة للصوت أسفل الحوض • مصفاة سلة ستانلس لكل حوض • عمق 20 سم يستوعب الأواني الكبيرة • حواف مدورة آمنة.',
    descriptionEn:
      'SS 304 kitchen sink with two deep bowls and a side drainboard, brushed finish that is easy to clean and rust resistant.\nSuitable for home and small commercial kitchens.\nFeatures: sound-deadening pads underneath • stainless basket strainer for each bowl • 20 cm depth fits large pots • safe rounded edges.',
    specs: [
      s('عمق الحوض', 'Bowl depth', '20 سم', '20 cm'),
      s('التركيب', 'Mounting', 'فوق الرخامة', 'Top mount'),
      s('المحتويات', 'In the box', 'حوض + مصفاتين + طقم تثبيت', 'Sink, 2 strainers, clips'),
      s('الضمان', 'Warranty', '10 سنوات', '10 years'),
    ],
    tiers: [[3, 5], [10, 10]],
  },
  'SN-WC-WH': {
    description:
      'مرحاض معلق بتقنية بدون حافة (Rimless) تمنع تجمع البكتيريا وتوفر نظافة أعلى بمياه أقل، مع غطاء رفيع بإغلاق هادئ.\nيركب على صندوق الطرد المخفي ويترك الأرضية فاضية لسهولة التنظيف.\nالمميزات: طرد قوي يغطي كامل الوعاء • تزجيج مقاوم للبقع • غطاء قابل للفك السريع • تصميم مدمج يناسب الحمامات الصغيرة.',
    descriptionEn:
      'Rimless wall-hung toilet that prevents bacteria build-up and delivers better hygiene with less water, with a slim soft-close seat.\nMounts on a concealed cistern leaving the floor clear for easy cleaning.\nFeatures: powerful full-bowl flush • stain-resistant glaze • quick-release seat • compact design suits small bathrooms.',
    specs: [
      s('المقاس', 'Dimensions', '52×36 سم', '52x36 cm'),
      s('نوع الطرد', 'Flush type', 'دوامي بدون حافة', 'Rimless swirl'),
      s('يتطلب', 'Requires', 'صندوق طرد مخفي', 'Concealed cistern'),
      s('الضمان', 'Warranty', '10 سنوات على السيراميك', '10 years on ceramic'),
    ],
    tiers: [[3, 5], [10, 10]],
  },
  'SN-CS-CF': {
    description:
      'شاسيه صندوق طرد مخفي داخل الحائط للمراحيض المعلقة، هيكل صلب مجلفن قابل لضبط الارتفاع وخزان بلاستيك معزول ضد التكثف.\nمع لوحة ضغط بزرين (3/6 لتر) لتوفير المياه.\nالمميزات: يتحمل حتى 400 كجم • تركيب في حوائط البلوك أو الجبس • صيانة سهلة من فتحة لوحة الضغط • صمامات هادئة.',
    descriptionEn:
      'In-wall concealed cistern frame for wall-hung toilets, galvanized steel frame with adjustable height and an anti-condensation insulated tank.\nWith a dual flush plate (3/6 L) to save water.\nFeatures: load rated up to 400 kg • fits block or drywall walls • easy maintenance through the flush plate opening • quiet valves.',
    specs: [
      s('الحمل الأقصى', 'Max load', '400 كجم', '400 kg'),
      s('تعديل الارتفاع', 'Height adjustment', '0-20 سم', '0-20 cm'),
      s('المحتويات', 'In the box', 'شاسيه + خزان + لوحة ضغط', 'Frame, tank, flush plate'),
      s('المنشأ', 'Origin', 'ألمانيا', 'Germany'),
    ],
    tiers: [[3, 5], [10, 10]],
  },
  'SN-SH-TH25': {
    description:
      'عمود دش متكامل برأس مطري دائري 25 سم ودش يدوي وخلاط ترموستاتيك يثبت حرارة المياه على الدرجة المختارة حتى لو اتغير الضغط.\nتجربة استحمام فاخرة وآمنة للأطفال وكبار السن.\nالمميزات: زر أمان عند 38° يمنع الحروق • فوهات سيليكون ضد الترسبات • ارتفاع قابل للتعديل • كروم لامع مقاوم للبصمات.',
    descriptionEn:
      'Complete shower column with a 25 cm round rain head, hand shower and thermostatic mixer that keeps water at the chosen temperature even when pressure changes.\nA luxurious, safe shower for kids and the elderly.\nFeatures: 38°C safety stop prevents scalding • anti-limescale silicone nozzles • adjustable height • fingerprint-resistant bright chrome.',
    specs: [
      s('زر الأمان', 'Safety stop', '38° مئوية', '38 °C'),
      s('ارتفاع العمود', 'Column height', '90-120 سم', '90-120 cm'),
      s('طول الخرطوم', 'Hose length', '150 سم', '150 cm'),
      s('المنشأ', 'Origin', 'ألمانيا', 'Germany'),
    ],
    tiers: [[3, 5], [10, 10]],
  },
  'SN-SH-HD': {
    description:
      'دش يدوي كروم بخمس أوضاع رش (مطري، مساج، رذاذ، مختلط، توفير) مع خرطوم ستانلس مرن مقاوم للالتواء وحامل حائط قابل للتدوير.\nمناسب للاستبدال السريع أو للحمامات الجديدة.\nالمميزات: فوهات مطاطية تنظف بالمسح • مقبض مريح غير زلق • وصلات عالمية ½ بوصة • توفير مياه حتى 25%.',
    descriptionEn:
      'Chrome five-mode hand shower (rain, massage, mist, mixed, eco) with a flexible kink-resistant stainless hose and adjustable wall bracket.\nIdeal as a quick replacement or for new bathrooms.\nFeatures: rub-clean rubber nozzles • comfortable non-slip grip • universal ½" connections • saves up to 25% water.',
    specs: [
      s('قطر الرأس', 'Head diameter', '11 سم', '11 cm'),
      s('الوصلة', 'Connection', '½ بوصة', '½ inch'),
      s('الضمان', 'Warranty', 'سنتين', '2 years'),
    ],
    tiers: [[10, 5], [50, 10]],
  },
  'SN-PPR-25': {
    description:
      'ماسورة PPR قطر 25 مم ضغط PN20 للمياه الساخنة والباردة، تركب بلحام حراري يكوّن وصلة واحدة بدون تسريب.\nللتغذية الرئيسية وتمديدات الحمامات والمطابخ وخطوط السخانات.\nالمميزات: لا تصدأ ولا تتكلس • تتحمل حتى 95° مئوية • آمنة لمياه الشرب • عمر افتراضي أكثر من 50 سنة.',
    descriptionEn:
      '25 mm PN20 PPR pipe for hot and cold water, joined by heat fusion to form a single leak-free joint.\nFor main supply, bathroom, kitchen and water heater lines.\nFeatures: no rust or scale • withstands up to 95°C • safe for drinking water • 50+ year service life.',
    specs: [
      s('سماكة الجدار', 'Wall thickness', '4.2 مم', '4.2 mm'),
      s('أقصى حرارة', 'Max temperature', '95° مئوية', '95 °C'),
      s('المعيار', 'Standard', 'DIN 8077/8078', 'DIN 8077/8078'),
      s('المنشأ', 'Origin', 'تركيا', 'Turkey'),
    ],
    tiers: [[25, 5], [100, 10]],
  },
  'SN-VLV-1': {
    description:
      'محبس كورة نحاس ثقيل 1 بوصة بكرة كروم وجوانات تفلون PTFE، يقفل ويفتح بربع لفة مع إحكام تام.\nمناسب لخطوط التغذية الرئيسية والخزانات والمضخات.\nالمميزات: جسم نحاس مطروق مقاوم للضغط • ذراع حديد مكسو • فتحة كاملة لا تقلل التدفق • يتحمل المياه الساخنة.',
    descriptionEn:
      'Heavy 1" brass ball valve with a chrome ball and PTFE seats, quarter-turn open/close with a tight seal.\nSuitable for main supply lines, tanks and pumps.\nFeatures: forged brass body resists pressure • coated steel lever • full bore keeps flow unrestricted • hot water rated.',
    specs: [
      s('نوع الفتحة', 'Bore', 'فتحة كاملة', 'Full bore'),
      s('أقصى حرارة', 'Max temperature', '120° مئوية', '120 °C'),
      s('الجوانات', 'Seats', 'تفلون PTFE', 'PTFE'),
      s('المنشأ', 'Origin', 'إيطاليا', 'Italy'),
    ],
    tiers: [[10, 5], [50, 10]],
  },
  'SN-WH-80': {
    description:
      'سخان مياه كهربائي 80 لتر بخزان مبطن بطبقة مينا مزدوجة ضد الصدأ، وعزل بولي يوريثان عالي الكثافة يحافظ على حرارة المياه لساعات.\nمناسب للأسر من 3 إلى 5 أفراد.\nالمميزات: ترموستات قابل للضبط • صمام أمان للضغط والحرارة • أنود ماغنسيوم يطيل عمر الخزان • تسخين سريع بقدرة 2000 وات.',
    descriptionEn:
      '80 L electric water heater with a double enamel-lined anti-corrosion tank and high-density polyurethane insulation keeping water hot for hours.\nSuitable for families of 3 to 5.\nFeatures: adjustable thermostat • pressure and temperature safety valve • magnesium anode extends tank life • fast heating at 2000 W.',
    specs: [
      s('زمن التسخين', 'Heat-up time', '≈ 150 دقيقة', '≈ 150 min'),
      s('أقصى ضغط', 'Max pressure', '8 بار', '8 bar'),
      s('الأبعاد', 'Dimensions', 'قطر 45 × ارتفاع 78 سم', 'Ø45 x 78 cm'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[3, 4], [10, 8]],
  },
  'SN-WH-INS': {
    description:
      'سخان مياه فوري بدون خزان يسخن المياه لحظياً أثناء مرورها، فمفيش انتظار ولا فقد حرارة، ومكانه صغير جداً.\nمثالي للمطبخ والحمامات الصغيرة والشقق.\nالمميزات: شاشة رقمية لضبط وعرض الحرارة • حماية ضد التشغيل بدون ماء وضد الحرارة الزائدة • توفير كهرباء لأنه يشتغل وقت الاستخدام بس • تركيب سهل على الحائط.',
    descriptionEn:
      'Tankless instant water heater that heats water on demand as it flows—no waiting, no standby heat loss, and a very small footprint.\nIdeal for kitchens, small bathrooms and apartments.\nFeatures: digital display to set and show temperature • dry-run and overheat protection • saves power by running only during use • easy wall installation.',
    specs: [
      s('معدل التدفق', 'Flow rate', '3-5 لتر/دقيقة', '3-5 L/min'),
      s('الجهد', 'Voltage', '220-240 فولت', '220-240 V'),
      s('الأبعاد', 'Dimensions', '33×22×9 سم', '33x22x9 cm'),
      s('الضمان', 'Warranty', 'سنتين', '2 years'),
    ],
    tiers: [[3, 5], [10, 10]],
  },
  'FN-LAM-8': {
    description:
      'أرضيات لامينيت HDF سماكة 8 مم بتعشيق كليك يركب فوق البلاط القديم أو الأرضية الأسمنتية بدون لاصق.\nمناسب لغرف النوم والصالات والمكاتب.\nالمميزات: طبقة سطحية AC4 تتحمل الحركة العالية والخدش • ملمس خشب طبيعي • مقاومة للبقع وسهلة التنظيف • تركيب سريع ونظيف بدون تكسير.',
    descriptionEn:
      '8 mm HDF laminate with click-lock joints that installs over old tiles or screed without glue.\nSuitable for bedrooms, living rooms and offices.\nFeatures: AC4 wear layer resists heavy traffic and scratches • natural wood texture • stain resistant and easy to clean • fast clean installation without demolition.',
    specs: [
      s('مساحة الكرتونة', 'Area per box', '2.13 م²', '2.13 m²'),
      s('مقاس اللوح', 'Plank size', '1218×195 مم', '1218x195 mm'),
      s('الضمان', 'Warranty', '15 سنة سكني', '15 years residential'),
    ],
    tiers: [[50, 5], [200, 10]],
  },
  'FN-PNT-MAT': {
    description:
      'دهان بلاستيك مطفي بأساس أكريليك مائي، يعطي لون ثابت وملمس ناعم للحوائط والأسقف الداخلية.\nيتلوّن على الماكينة بأي درجة من كتالوج الألوان.\nالمميزات: تغطية عالية من وشين • قابل للغسيل بدون ما يبهت • رائحة خفيفة وجفاف سريع • مقاوم للفطريات والعفن.',
    descriptionEn:
      'Matte emulsion paint with a water-based acrylic binder, giving lasting color and a smooth finish on interior walls and ceilings.\nTinted by machine to any shade in the color catalogue.\nFeatures: full coverage in two coats • washable without fading • low odor and fast drying • mold and mildew resistant.',
    specs: [
      s('زمن الجفاف', 'Drying time', 'ساعة لمس / 4 ساعات بين الأوجه', '1 h touch / 4 h recoat'),
      s('عدد الأوجه', 'Coats', 'وشين', '2 coats'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[10, 5], [40, 10]],
  },
  'FN-PRM-18': {
    description:
      'برايمر (سيلر) أساس مائي يتدهن على المحارة أو المعجون قبل الدهان، يثبت السطح ويوحد الامتصاص.\nيقلل استهلاك الدهان النهائي ويمنع التبقيع.\nالمميزات: التصاق ممتاز على الأسطح الأسمنتية والجبسية • يمنع تسرب القلويات • جفاف سريع • مناسب للداخلي والخارجي.',
    descriptionEn:
      'Water-based primer sealer applied on plaster or putty before painting to bind the surface and even out absorption.\nReduces topcoat consumption and prevents patchiness.\nFeatures: excellent adhesion on cement and gypsum surfaces • blocks alkali bleed • fast drying • suitable indoors and outdoors.',
    specs: [
      s('زمن الجفاف', 'Drying time', '2 ساعة', '2 hours'),
      s('اللون', 'Color', 'أبيض شفاف', 'Translucent white'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[10, 5], [40, 10]],
  },
  'FN-GYP-125': {
    description:
      'لوح جبس بورد قياسي بقلب جبس مضغوط بين طبقتين ورق مقوى، خفيف وسهل القص والتركيب.\nيستخدم للأسقف المعلقة والديكورات والقواطع الداخلية.\nالمميزات: حواف مشطوفة لتشطيب وصلات غير ظاهرة • مقاوم للحريق بطبيعته • عزل صوتي وحراري جيد • سطح جاهز للمعجون والدهان.',
    descriptionEn:
      'Standard gypsum board with a compressed gypsum core between two paper facings, light and easy to cut and install.\nUsed for suspended ceilings, decorative features and interior partitions.\nFeatures: tapered edges for invisible joints • naturally fire resistant • good acoustic and thermal insulation • surface ready for putty and paint.',
    specs: [
      s('الوزن', 'Weight', '≈ 22 كجم للوح', '≈ 22 kg per board'),
      s('المعيار', 'Standard', 'EN 520 نوع A', 'EN 520 Type A'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[50, 5], [200, 10]],
  },
  'FN-GYP-MR': {
    description:
      'لوح جبس بورد أخضر بقلب معالج بالسيليكون وورق مقاوم للرطوبة، يتحمل البخار في الحمامات والمطابخ.\nيستخدم كأساس للسيراميك في القواطع الجافة وللأسقف في الأماكن الرطبة.\nالمميزات: امتصاص مياه أقل من 5% • مقاوم للفطريات • نفس سهولة تركيب اللوح العادي • ثبات أبعاد عالي.',
    descriptionEn:
      'Green gypsum board with a silicone-treated core and moisture-resistant paper that withstands steam in bathrooms and kitchens.\nUsed as a tile backer on drywall partitions and for ceilings in humid areas.\nFeatures: water absorption below 5% • mold resistant • installs as easily as standard board • high dimensional stability.',
    specs: [
      s('الوزن', 'Weight', '≈ 24 كجم للوح', '≈ 24 kg per board'),
      s('المعيار', 'Standard', 'EN 520 نوع H2', 'EN 520 Type H2'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[50, 5], [200, 10]],
  },
  'FN-GYP-PRF': {
    description:
      'قطاع C معدني من الصاج المجلفن لتكوين الهيكل الحامل للأسقف المعلقة وقواطع الجبس بورد.\nيتوصل بالتعليقات والوصلات المعدنية ويتقفل عليه الألواح بالمسامير.\nالمميزات: جلفنة Z100 ضد الصدأ • استقامة ودقة أبعاد • خفيف وقوي • طول 4 متر يقلل الوصلات.',
    descriptionEn:
      'Galvanized steel C-channel used to build the supporting frame for suspended ceilings and drywall partitions.\nConnects to hangers and joiners, with boards screwed directly onto it.\nFeatures: Z100 galvanizing against rust • straight and dimensionally accurate • light yet strong • 4 m length reduces joints.',
    specs: [
      s('الوزن', 'Weight', '≈ 0.55 كجم/متر', '≈ 0.55 kg/m'),
      s('المسافة بين القطاعات', 'Spacing', '40-60 سم', '40-60 cm'),
      s('المنشأ', 'Origin', 'الإمارات', 'UAE'),
    ],
    tiers: [[100, 5], [500, 10]],
  },
  'FN-PTY-25': {
    description:
      'معجون حوائط أكريليك جاهز بقوام ناعم كريمي، يفرد بسهولة ويسد المسام والشروخ الشعرية.\nيعطي سطح أملس جاهز للبرايمر والدهان.\nالمميزات: جاهز بدون خلط • صنفرة سهلة بدون غبار كتير • التصاق قوي بالمحارة والجبس بورد • لا ينكمش ولا يتشقق.',
    descriptionEn:
      'Ready-mixed acrylic wall putty with a smooth creamy consistency that spreads easily and fills pores and hairline cracks.\nLeaves a flawless surface ready for primer and paint.\nFeatures: ready to use with no mixing • easy low-dust sanding • strong adhesion to plaster and gypsum board • no shrinkage or cracking.',
    specs: [
      s('زمن الجفاف', 'Drying time', '4-6 ساعات للطبقة', '4-6 h per coat'),
      s('عدد الطبقات', 'Coats', '2-3 طبقات', '2-3 coats'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[20, 5], [80, 10]],
  },
  'FN-PLS-30': {
    description:
      'جبس لياسة خفيف الوزن يرش بالماكينة أو يفرد باليد، يعطي حوائط مستوية وناعمة من وش واحد.\nبديل أسرع وأنظف من المحارة الأسمنتية التقليدية في الأعمال الداخلية.\nالمميزات: زمن تشغيل طويل • تغطية أعلى من الجبس العادي • لا يحتاج معالجة بالماء • ينظم رطوبة الغرفة.',
    descriptionEn:
      'Lightweight gypsum plaster sprayed by machine or applied by hand, producing level smooth walls in a single coat.\nA faster, cleaner alternative to traditional cement render for interior work.\nFeatures: long working time • higher coverage than regular gypsum • no water curing needed • helps regulate room humidity.',
    specs: [
      s('التغطية', 'Coverage', '≈ 3 م² لكل كيس بسماكة 10 مم', '≈ 3 m² per bag at 10 mm'),
      s('نسبة الخلط', 'Mixing ratio', '18 لتر ماء لكل كيس', '18 L water per bag'),
      s('المنشأ', 'Origin', 'السعودية', 'Saudi Arabia'),
    ],
    tiers: [[50, 5], [200, 10]],
  },
  'FN-MSH-FB': {
    description:
      'شبك فايبر جلاس مغطى بطبقة مقاومة للقلويات، يتدفن في طبقة اللياسة أو المعجون لتقويتها.\nيستخدم عند وصلات البلوك بالخرسانة والزوايا وحول الشبابيك والأبواب.\nالمميزات: يمنع الشروخ الشعرية • لا يصدأ ولا يتحلل • خفيف وسهل القص • متوافق مع الأسمنت والجبس.',
    descriptionEn:
      'Fiberglass mesh with an alkali-resistant coating, embedded in plaster or putty layers to reinforce them.\nUsed at block-to-concrete joints, corners and around windows and doors.\nFeatures: prevents hairline cracks • rust and rot proof • light and easy to cut • compatible with cement and gypsum.',
    specs: [
      s('قوة الشد', 'Tensile strength', '≥ 1800 نيوتن/5 سم', '≥ 1800 N/5 cm'),
      s('العرض', 'Width', '1 متر', '1 m'),
      s('المنشأ', 'Origin', 'الصين', 'China'),
    ],
    tiers: [[10, 5], [40, 10]],
  },
  'FN-DR-MDF': {
    description:
      'باب داخلي بقلب MDF كثيف وقشرة بلوط طبيعية مع تجاويف أفقية بتصميم عصري، يأتي جاهز للتركيب.\nمناسب لغرف النوم والمكاتب والصالات.\nالمميزات: عزل صوت أفضل من الأبواب المفرغة • تشطيب لاكيه مقاوم للخدش • حلق قابل للضبط حسب سماكة الحائط • مفصلات ستانلس ثقيلة.',
    descriptionEn:
      'Interior door with a dense MDF core and natural oak veneer with modern horizontal grooves, supplied ready to install.\nSuitable for bedrooms, offices and living areas.\nFeatures: better sound insulation than hollow doors • scratch-resistant lacquer finish • adjustable frame for wall thickness • heavy stainless hinges.',
    specs: [
      s('عرض الحلق', 'Frame depth', '10-14 سم قابل للضبط', '10-14 cm adjustable'),
      s('الوزن', 'Weight', '≈ 28 كجم', '≈ 28 kg'),
      s('الضمان', 'Warranty', 'سنتين', '2 years'),
    ],
    tiers: [[5, 5], [15, 10]],
  },
  'FN-DR-WPC': {
    description:
      'باب من خامة WPC المصمتة (خشب وبلاستيك) لا تتأثر بالمياه والبخار ولا تنتفخ أو تتسوس.\nالاختيار الأمثل للحمامات والمطابخ وغرف الغسيل.\nالمميزات: مقاوم للماء 100% • مقاوم للنمل الأبيض والحشرات • لا يحتاج دهان أو صيانة • عزل صوتي وحراري جيد.',
    descriptionEn:
      'Door made of solid WPC (wood-plastic composite) that is unaffected by water and steam and never swells or rots.\nThe ideal choice for bathrooms, kitchens and laundry rooms.\nFeatures: 100% waterproof • termite and insect resistant • no painting or maintenance needed • good sound and thermal insulation.',
    specs: [
      s('السماكة', 'Thickness', '40 مم', '40 mm'),
      s('المحتويات', 'Includes', 'باب + حلق WPC + مفصلات', 'Door, WPC frame & hinges'),
      s('الضمان', 'Warranty', '5 سنوات', '5 years'),
    ],
    tiers: [[5, 5], [15, 10]],
  },
  'FN-DR-HND': {
    description:
      'طقم أوكرة ستانلس ستيل 304 بتصميم مودرن وقاعدة مربعة، مع جسم قفل وكالون نحاس ومفتاحين.\nيركب على أغلب الأبواب الداخلية الخشب والـ WPC.\nالمميزات: لا يصدأ ولا يتغير لونه • ياي داخلي قوي يرجع الأوكرة لمكانها • كالون نحاس مقاوم للكسر • جميع مسامير التركيب مرفقة.',
    descriptionEn:
      'SS 304 lever handle set with a modern design on square rosettes, including lock body, brass cylinder and two keys.\nFits most wooden and WPC interior doors.\nFeatures: rust and tarnish proof • strong return spring • break-resistant brass cylinder • all fixing screws included.',
    specs: [
      s('المسافة الخلفية', 'Backset', '50 مم', '50 mm'),
      s('طول الكالون', 'Cylinder length', '60 مم', '60 mm'),
      s('الضمان', 'Warranty', '3 سنوات', '3 years'),
    ],
    tiers: [[10, 5], [50, 10]],
  },
  'FN-WP-VNL': {
    description:
      'ورق حائط فينيل عالي الجودة بنقشة هندسية بدرجات الرمادي والفضي مع لمعة معدنية خفيفة.\nيضيف لمسة فخامة لحوائط غرف النوم والصالات والمداخل.\nالمميزات: سطح فينيل قابل للمسح بالماء • مقاوم للرطوبة والبهتان • نقشة متطابقة سهلة التركيب • ملمس بارز.',
    descriptionEn:
      'High-quality vinyl wallpaper with a geometric pattern in grey and silver tones and a subtle metallic sheen.\nAdds a luxurious touch to bedroom, living room and entrance walls.\nFeatures: wipeable vinyl surface • moisture and fade resistant • easy pattern matching • embossed texture.',
    specs: [
      s('تكرار النقشة', 'Pattern repeat', '53 سم', '53 cm'),
      s('طريقة اللصق', 'Application', 'غراء على الحائط', 'Paste the wall'),
      s('المنشأ', 'Origin', 'كوريا', 'Korea'),
    ],
    tiers: [[10, 5], [30, 10]],
  },
  'FN-WP-PNL': {
    description:
      'بانل حائط مضلع من خامة WPC بلون الجوز الطبيعي، يعطي عمق وفخامة لحوائط التلفزيون والاستقبال والمكاتب.\nيركب بالكلبسات أو اللاصق مباشرة على الحائط أو على مرابيع خشب.\nالمميزات: مقاوم للماء والرطوبة • لا يحتاج دهان • مقاوم للنمل الأبيض • يتقص ويتشكل بأدوات النجارة العادية.',
    descriptionEn:
      'Fluted WPC wall panel in natural walnut, adding depth and elegance to TV, reception and office feature walls.\nInstalled with clips or adhesive directly on the wall or on timber battens.\nFeatures: water and humidity resistant • no painting needed • termite resistant • cut and shaped with standard woodworking tools.',
    specs: [
      s('التغطية', 'Coverage', '0.46 م² للقطعة', '0.46 m² per panel'),
      s('طريقة التركيب', 'Installation', 'كلبسات أو لاصق', 'Clips or adhesive'),
      s('المنشأ', 'Origin', 'الصين', 'China'),
    ],
    tiers: [[20, 5], [100, 10]],
  },
  'FN-WP-MRB': {
    description:
      'لوح PVC بطباعة رخام كرارا عالية الدقة وطبقة UV لامعة، شكله زي الرخام الطبيعي بجزء من الوزن والتكلفة.\nمثالي لحوائط الاستقبال والمداخل والحمامات والمحلات.\nالمميزات: مقاوم للماء والخدش • وزن خفيف يتركب باللاصق بدون تثبيت معدني • سهل التنظيف • وصلات شبه مخفية.',
    descriptionEn:
      'PVC sheet with high-definition Carrara marble print and a glossy UV coat, looking like natural marble at a fraction of the weight and cost.\nIdeal for reception walls, entrances, bathrooms and shops.\nFeatures: water and scratch resistant • light enough to fix with adhesive only • easy to clean • near-invisible joints.',
    specs: [
      s('الوزن', 'Weight', '≈ 11 كجم للوح', '≈ 11 kg per sheet'),
      s('طريقة التركيب', 'Installation', 'لاصق سيليكون', 'Silicone adhesive'),
      s('المنشأ', 'Origin', 'الصين', 'China'),
    ],
    tiers: [[10, 5], [40, 10]],
  },
};
