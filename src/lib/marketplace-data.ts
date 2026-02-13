
export interface SubCategory {
    id?: number;
    name: string;
    tag?: string;
    link?: string;
    img: string;
    submenu?: boolean;
    sublinks?: SubCategory[];
    sublink?: SubCategory[];
    parent_id?: number | null;
    level?: number;
    children?: SubCategory[];
}

export interface Category {
    id?: number;
    name: string;
    tag?: string;
    submenu?: boolean;
    img?: string;
    sublinks?: SubCategory[];
    children?: SubCategory[];
    parent_id?: number | null;
    level?: number;
    mainResources?: string[];
    region?: string;
    flag?: string;
}

export const links: Category[] = [
    {
        name: "Metallic Minerals",
        submenu: true,
        sublinks: [
            {
                name: "Iron Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Aluminum Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Antimony Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Cobalt Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Chrome Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Copper Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Gold Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Lead Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Lithium Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Manganese Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Molybdenum Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Nickel Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Niobium Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "PGE Group Elements",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Silver Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Tantalum Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Tin Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Tungsten Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Zinc Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
        ],
    },
    {
        name: "Non-metallic Industrial Minerals",
        submenu: true,
        sublinks: [
            {
                name: "Asbestos",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Barite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Bentonite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Calcium Carbonate (Calcite)",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Dolomite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Feldspar",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Gypsum",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Kaolin",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Mica",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Nephelin syenite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Perlite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Pyrophylite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Silica",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Talc",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Smectite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Vermiculite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Wollastonite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Zeolite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
        ],
    },
    {
        name: "Marble and Natural Stone",
        submenu: true,
        sublinks: [
            {
                name: "Quartz",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Marble",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Onyx",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Travertine",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Limestone",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Sandstone",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Granite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Basalt",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Quartzite",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Slate",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Other Natural Stone",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
        ],
    },
    {
        name: "Gravel, Sand and Aggregate",
        submenu: true,
        sublinks: [
            {
                name: "Gravel",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Sand",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Aggregate",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Coal",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Other Minerals",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
        ],
    },
    {
        name: "Coal",
        submenu: true,
        sublinks: [
            {
                name: "Sand",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Aggregate",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Coal",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Other Minerals",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
        ]
    },
    {
        name: "Other Minerals",
        submenu: true,
        sublinks: [
            {
                name: "Sand",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Aggregate",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Coal",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Other Minerals",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
        ]
    },
];

export const real: Category[] = [

    /*
    **  Cat 1
    */
    {
        id: 1,
        name: "Minerals",
        tag: 'minerals',
        img: '/assets/sphalerite(ZincSulphide).jpg',
        submenu: true,
        parent_id: null,
        level: 1,
        children: [
            {
                id: 101,
                name: "Metallic Minerals",
                tag: 'metallic-minerals',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                parent_id: 1,
                level: 2,
                children: [
                    { id: 10101, tag: 'aluminum-ores', name: "Aluminum Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10102, tag: 'antimony-ores', name: "Antimony Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10103, tag: 'cobalt-ores', name: "Cobalt Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10104, tag: 'chrome-ores', name: "Chrome Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10105, tag: 'copper-ores', name: "Copper Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10106, tag: 'gold-ores', name: "Gold Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10107, tag: 'iron-ores', name: "Iron Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10108, tag: 'lead-ores', name: "Lead Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10109, tag: 'lithium-ores', name: "Lithium Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10110, tag: 'manganese-ores', name: "Manganese Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10111, tag: 'molybdenum-ores', name: "Molybdenum Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10112, tag: 'nickel-ores', name: "Nickel Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10113, tag: 'niobium-ores', name: "Niobium Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10114, tag: 'platinum-group-elements', name: "Platinum Group Elements (PGE)", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10115, tag: 'silver-ores', name: "Silver Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10116, tag: 'tantalum-ores', name: "Tantalum Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10117, tag: 'tin-ores', name: "Tin Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10118, tag: 'tungsten-ores', name: "Tungsten Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10119, tag: 'zinc-ores', name: "Zinc Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, }
                ]
            },

            {
                id: 102,
                name: "Non-metallic Industrial minerals",
                tag: 'non-metallic-minerals',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 1,
                submenu: true,
                level: 2,
                children: [
                    { id: 10201, tag: 'asbestos', name: "Asbestos", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10202, tag: 'barite', name: "Barite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10203, tag: 'bentonite', name: "Bentonite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10204, tag: 'calcium-carbonate', name: "Calcium Carbonate (Calcite)", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10205, tag: 'dolomite', name: "Dolomite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10206, tag: 'feldspar', name: "Feldspar", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10207, tag: 'fluorite', name: "Fluorite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10208, tag: 'gypsum-anhydrite', name: "Gypsum and Anhydrite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10209, tag: 'halite', name: "Halite (Rock Salt)", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10210, tag: 'kaolin', name: "Kaolin", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10211, tag: 'mica', name: "Mica", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10212, tag: 'nepheline', name: "Nepheline", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10213, tag: 'perlite', name: "Perlite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10214, tag: 'pyrophyllite', name: "Pyrophyllite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10215, tag: 'silica', name: "Silica", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10216, tag: 'talc', name: "Talc", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10217, tag: 'smectite', name: "Smectite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10218, tag: 'vermiculite', name: "Vermiculite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10219, tag: 'wollastonite', name: "Wollastonite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10220, tag: 'zeolite', name: "Zeolite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, }
                ]
            },

            {
                id: 103,
                name: "Marble and Natural Stone",
                parent_id: 1,
                img: '/assets/sphalerite(ZincSulphide).jpg',
                tag: 'marble-and-natural-stone',
                submenu: true,
                level: 2,
                children: [
                    { id: 10301, tag: 'marble', name: "Marble", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10302, tag: 'onyx', name: "Onyx", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10303, tag: 'travertine', name: "Travertine", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10304, tag: 'limestone', name: "Limestone", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10305, tag: 'sandstone', name: "Sandstone", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10306, tag: 'granite', name: "Granite", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10307, tag: 'basalt', name: "Basalt", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10308, tag: 'quartz', name: "Quartz", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10309, tag: 'quartzite', name: "Quartzite", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10310, tag: 'slate', name: "Slate", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10311, tag: 'precious-semi-precious-stones', name: "Precious and Semi-Precious Stones", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10312, tag: 'other-natural-stone', name: "Other Natural Stone", parent_id: 103, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, }
                ]
            },

            {
                id: 104,
                name: "Gravel, Sand, Aggregate",
                parent_id: 1,
                img: '/assets/sphalerite(ZincSulphide).jpg',
                tag: 'gravel-sand-aggregate',
                submenu: false,
                level: 2,
                children: []
            },

            {
                id: 105,
                name: "Coal and Peat",
                parent_id: 1,
                img: '/assets/sphalerite(ZincSulphide).jpg',
                tag: 'coal-and-peat',
                submenu: false,
                level: 2,
                children: []
            },

            {
                id: 106,
                name: "Other Minerals",
                parent_id: 1,
                img: '/assets/sphalerite(ZincSulphide).jpg',
                tag: 'other-minerals',
                submenu: false,
                level: 2,
                children: []
            }
        ]
    },

    /*
    ** Cat 2
    */
    {
        id: 2,
        name: "Mining tools",
        parent_id: null,
        img: '/assets/sphalerite(ZincSulphide).jpg',
        tag: 'mining-tools',
        submenu: true,
        level: 1,
        children: [
            {
                id: 201,
                name: "Drilling Rigs and Equipment",
                tag: 'drilling-rigs-and-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: false,
                parent_id: 2,
                level: 2,
                children: []
            },
            {
                id: 202,
                name: "Energy - Machines and Equipment",
                parent_id: 2,
                tag: 'energy-machines-and-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20201, tag: 'generators', name: "Generators", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20202, tag: 'solar-panels', name: "Solar Panels", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20203, tag: 'wind-turbines', name: "Wind Turbines", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20204, tag: 'water-turbines', name: "Water Turbines", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20205, tag: 'electrical-electronic-equipment', name: "Electrical and Electronic Equipment", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20206, tag: 'other-energy-resources', name: "Other Energy Resources", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 }
                ]
            },
            {
                id: 203,
                name: "Engineering Devices and Equipment",
                parent_id: 2,
                tag: 'engineering-devices-and-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20301, tag: 'cartography-gps-gnss-device', name: "Cartography GPS GNSS Device and Accessories", parent_id: 203, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20302, tag: 'detectors-underground-imaging', name: "Detectors, Underground Imaging", parent_id: 203, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20303, tag: 'explosives-blasting-equipment', name: "Explosives and Blasting Equipment", parent_id: 203, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20304, tag: 'ground-investigation-equipment', name: "Ground Investigation Equipment and Parts", parent_id: 203, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20305, tag: 'laboratory-equipment-accessories', name: "Laboratory Equipment and Accessories", parent_id: 203, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20306, tag: 'sample-preparation-machines', name: "Sample Preparation Machines", parent_id: 203, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, }
                ]
            },
            {
                id: 204,
                name: "Heavy Equipment",
                parent_id: 2,
                tag: 'heavy-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20401, tag: 'backhoe-loader', name: "Backhoe Loader", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20402, tag: 'bored-pile-machine', name: "Bored Pile Machine", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20403, tag: 'dozer-bucket', name: "Dozer Bucket", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20404, tag: 'excavator', name: "Excavator", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20405, tag: 'forklifts-stackers', name: "Forklifts and Stackers", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20406, tag: 'grader', name: "Grader", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20407, tag: 'heavy-equipment-spares', name: "Heavy Equipment Spares Parts", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20408, tag: 'hydraulic-breaker-gun', name: "Hydraulic Breaker and Gun", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20409, tag: 'loader', name: "Loader", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20410, tag: 'mobile-crane', name: "Mobile Crane", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20411, tag: 'rock-truck', name: "Rock Truck", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20412, tag: 'telehandler', name: "Telehandler", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20413, tag: 'mine-trailer', name: "Mine Trailer", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20414, tag: 'other-heavy-equipment', name: "Other Heavy Equipment", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 }
                ]
            },
            {
                id: 205,
                name: "Industrial Equipment & Components",
                parent_id: 2,
                tag: 'industrial-equipment-components',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20501, tag: 'compressors', name: "Compressors", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20502, tag: 'fuel-oil-products', name: "Fuel Oil Products", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20503, tag: 'accumulators', name: "Accumulators", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20504, tag: 'tire-rim-armor', name: "Tire- Rim and Armor", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20505, tag: 'wire-rope-chains', name: "Wire Rope and Chains", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20506, tag: 'fuel-oil-tanks', name: "Fuel-oil Tanks", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20507, tag: 'container-cabin-shelter', name: "Container, Cabin, Shelter", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20508, tag: 'other-industry-equipment', name: "Other Industry Equipment", parent_id: 205, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 }
                ]
            },
            {
                id: 206,
                name: "Marble Industry Machinery",
                parent_id: 2,
                tag: 'marble-industry-machinery',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20601, tag: 'marble-quarry-machines', name: "Marble Quarry Machines", parent_id: 206, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20602, tag: 'marble-processing-machines', name: "Marble Processing Machines", parent_id: 206, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20603, tag: 'marble-handling-transport', name: "Marble Handling and Transport Equipment", parent_id: 206, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, }
                ]
            },
            {
                id: 207,
                name: "Ore Mineral Processing Equipment",
                parent_id: 2,
                tag: 'ore-mineral-processing-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20701, tag: 'bulk-bag-filling', name: "Bulk Bag Filling and Bagging", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20702, tag: 'bunkers-feeders', name: "Bunkers and Feeders", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20703, tag: 'centrifuges', name: "Centrifuges", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20704, tag: 'conveyors-carrier', name: "Conveyors and Carrier", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20705, tag: 'crushers', name: "Crushers", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20706, tag: 'cyclones', name: "Cyclones", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20707, tag: 'filters-presses', name: "Filters and Presses", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20708, tag: 'flotation-cells', name: "Flotation Cells", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20709, tag: 'grinders-mills', name: "Grinders and Mills", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20710, tag: 'leaching-equipment', name: "Leaching Equipment", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20711, tag: 'mining-drying-machine', name: "Mining Drying Machine", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20712, tag: 'pumps', name: "Pumps", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20713, tag: 'separators', name: "Separators", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20714, tag: 'screens', name: "Screens", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20715, tag: 'silos', name: "Silos", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20716, tag: 'thickeners', name: "Thickeners", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20717, tag: 'washing-machines', name: "Washing Machines", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 }
                ]
            },
            {
                id: 208,
                name: "Underground Mining Equipment",
                parent_id: 2,
                tag: 'underground-mining-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: true,
                level: 2,
                children: [
                    { id: 20801, name: "Roof Support Systems", parent_id: 208, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20802, name: "Ventilation Systems", parent_id: 208, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20803, name: "Underground Pumps", parent_id: 208, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, }
                ]
            },
            {
                id: 209,
                name: "Other Mining Equipment",
                parent_id: 2,
                tag: 'other-mining-equipment',
                img: '/assets/sphalerite(ZincSulphide).jpg',
                submenu: false,
                level: 2,
                children: []
            }
        ]
    },

    /*
    ** Cat 3
    */

    {
        id: 3,
        name: "Mining and Engineering Services",
        parent_id: null,
        tag: 'mining-and-engineering-services',
        img: '/assets/sphalerite(ZincSulphide).jpg',
        submenu: true,
        level: 1,
        children: [
            {
                id: 301,
                name: "Analysis Services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'analysis-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 302,
                name: "Consulting & advisory",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'consulting-advisory',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 303,
                name: "Drilling and Blasting Services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'drilling-and-blasting-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 304,
                name: "Exploration & Surveying services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'exploration-surveying-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 305,
                name: "Freight Services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'freight-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 306,
                name: "Mining Services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'mining-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 307,
                name: "Mineral Processing Services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'mineral-processing-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 308,
                name: "Supply Chain Solution",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'supply-chain-solution',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 309,
                name: "Other Services",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 3,
                tag: 'other-services',
                submenu: false,
                level: 2,
                children: []
            }
        ]
    },

    /*
    ** Cat 4
    */

    {
        id: 4,
        name: "Mining Personal Protective Equipment",
        img: '/assets/sphalerite(ZincSulphide).jpg',
        parent_id: null,
        tag: 'mining-personal-protective-equipment',
        submenu: true,
        level: 1,
        children: [
            {
                id: 401,
                name: "Head & Face Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'head-face-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 402,
                name: "Mask/Respiratory Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'mask-respiratory-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 403,
                name: "Protective Clothing",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'protective-clothing',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 404,
                name: "Foot Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'foot-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 405,
                name: "Hand & Arm Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'hand-arm-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 406,
                name: "Fall Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'fall-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 407,
                name: "Hearing Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'hearing-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 408,
                name: "Vision Protection",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'vision-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 409,
                name: "Other Personal Protective Equipment",
                img: '/assets/sphalerite(ZincSulphide).jpg',
                parent_id: 4,
                tag: 'other-personal-protective-equipment',
                submenu: false,
                level: 2,
                children: []
            },
        ]
    },

];

export const countries = [
    // ... existing countries array ...
];
