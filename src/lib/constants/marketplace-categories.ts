export interface Category {
    id: number;
    name: string;
    tag: string;
    img: string;
    submenu: boolean;
    parent_id: number | null;
    level: number;
    children?: Category[];
}

export const marketplaceCategories: Category[] = [
    {
        id: 1,
        name: "Minerals",
        tag: 'minerals',
        img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772979/Mica-Minerals_medium_zzvcux.webp',
        submenu: true,
        parent_id: null,
        level: 1,
        children: [
            {
                id: 101,
                name: "Metallic Minerals",
                tag: 'metallic-minerals',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/metallic-minerals_medium_raqyo2.webp',
                submenu: true,
                parent_id: 1,
                level: 2,
                children: [
                    { id: 10101, tag: 'aluminum-ores', name: "Aluminum Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772940/Aluminum-ore_medium_ofktit.webp', level: 3, submenu: false, },
                    { id: 10102, tag: 'antimony-ores', name: "Antimony Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772938/Antimony-ore_medium_tt6zws.webp', level: 3, submenu: false, },
                    { id: 10103, tag: 'cobalt-ores', name: "Cobalt Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772942/cobalt-ore_medium_ng8lrp.webp', level: 3, submenu: false, },
                    { id: 10104, tag: 'chrome-ores', name: "Chrome Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10105, tag: 'copper-ores', name: "Copper Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772944/copper-ore_medium_umwyil.webp', level: 3, submenu: false, },
                    { id: 10106, tag: 'gold-ores', name: "Gold Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10107, tag: 'iron-ores', name: "Iron Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772949/iron-ore_medium_qhw2yn.webp', level: 3, submenu: false, },
                    { id: 10108, tag: 'lead-ores', name: "Lead Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10109, tag: 'lithium-ores', name: "Lithium Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10110, tag: 'manganese-ores', name: "Manganese Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10111, tag: 'molybdenum-ores', name: "Molybdenum Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772948/molybdenum-ore_medium_pmg37j.webp', level: 3, submenu: false, },
                    { id: 10112, tag: 'nickel-ores', name: "Nickel Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772953/nickel-ore_medium_u5mrn7.webp', level: 3, submenu: false, },
                    { id: 10113, tag: 'niobium-ores', name: "Niobium Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772949/niobium_medium_gp7xhd.webp', level: 3, submenu: false, },
                    { id: 10114, tag: 'platinum-group-elements', name: "Platinum Group Elements (PGE)", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772951/PGE_medium_fjui81.webp', level: 3, submenu: false, },
                    { id: 10115, tag: 'silver-ores', name: "Silver Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772951/silver-ore_medium_aqmwkr.webp', level: 3, submenu: false, },
                    { id: 10116, tag: 'tantalum-ores', name: "Tantalum Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772952/Tantalum_0_1_medium_sffqv5.webp', level: 3, submenu: false, },
                    { id: 10117, tag: 'tin-ores', name: "Tin Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772954/tin-ore_medium_ip1por.webp', level: 3, submenu: false, },
                    { id: 10118, tag: 'tungsten-ores', name: "Tungsten Ores", parent_id: 101, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10119, tag: 'zinc-ores', name: "Zinc Ores", parent_id: 101, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772955/zinc-ore_medium_mnpowu.webp', level: 3, submenu: false, }
                ]
            },
            {
                id: 102,
                name: "Non-metallic Industrial minerals",
                tag: 'non-metallic-minerals',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Non-metallic-Industrial-minerals_medium_in7y3r.webp',
                parent_id: 1,
                submenu: true,
                level: 2,
                children: [
                    { id: 10201, tag: 'asbestos', name: "Asbestos", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772969/Asbestos_medium_o7vf7m.webp', level: 3, submenu: false, },
                    { id: 10202, tag: 'barite', name: "Barite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772971/Barite-ore_medium_p8vgxl.webp', level: 3, submenu: false, },
                    { id: 10203, tag: 'bentonite', name: "Bentonite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772971/bentonite-ore_medium_e3vd8c.webp', level: 3, submenu: false, },
                    { id: 10204, tag: 'calcium-carbonate', name: "Calcium Carbonate (Calcite)", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772972/Calcite_medium_zjjxvq.webp', level: 3, submenu: false, },
                    { id: 10205, tag: 'dolomite', name: "Dolomite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772972/dolomite-stone_medium_kul5vw.webp', level: 3, submenu: false, },
                    { id: 10206, tag: 'feldspar', name: "Feldspar", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772974/Feldspar_medium_nibsys.webp', level: 3, submenu: false, },
                    { id: 10207, tag: 'fluorite', name: "Fluorite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10208, tag: 'gypsum-anhydrite', name: "Gypsum and Anhydrite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772977/Gypsum_medium_ukakeh.webp', level: 3, submenu: false, },
                    { id: 10209, tag: 'halite', name: "Halite (Rock Salt)", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772977/Halite_medium_timmre.webp', level: 3, submenu: false, },
                    { id: 10210, tag: 'kaolin', name: "Kaolin", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772977/Kaolin-rock_medium_n1zzbt.webp', level: 3, submenu: false, },
                    { id: 10211, tag: 'mica', name: "Mica", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772979/Mica-Minerals_medium_zzvcux.webp', level: 3, submenu: false, },
                    { id: 10212, tag: 'nepheline', name: "Nepheline", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772980/Nepheline_medium_xt9i8i.webp', level: 3, submenu: false, },
                    { id: 10213, tag: 'perlite', name: "Perlite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772981/Perlite-ore_medium_udj3hi.webp', level: 3, submenu: false, },
                    { id: 10214, tag: 'pyrophyllite', name: "Pyrophyllite", parent_id: 102, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, submenu: false, },
                    { id: 10215, tag: 'silica', name: "Silica", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772983/Silica-ore_medium_x15wya.webp', level: 3, submenu: false, },
                    { id: 10216, tag: 'talc', name: "Talc", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772985/Talc_medium_rmb38s.webp', level: 3, submenu: false, },
                    { id: 10217, tag: 'smectite', name: "Smectite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772983/Smectite-medium_v7jbat.webp', level: 3, submenu: false, },
                    { id: 10218, tag: 'vermiculite', name: "Vermiculite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772986/Vermiculite_medium_r16f4u.webp', level: 3, submenu: false, },
                    { id: 10219, tag: 'wollastonite', name: "Wollastonite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772987/Wollastonite_n3icrl.webp', level: 3, submenu: false, },
                    { id: 10220, tag: 'zeolite', name: "Zeolite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772987/Zeolite-ore_medium_adbtxe.webp', level: 3, submenu: false, }
                ]
            },
            {
                id: 103,
                name: "Marble and Natural Stone",
                parent_id: 1,
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772807/Marble-and-natural-stone_medium_ets6ih.webp',
                tag: 'marble-and-natural-stone',
                submenu: true,
                level: 2,
                children: [
                    { id: 10301, tag: 'marble', name: "Marble", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773375/MarbleHandler_medium_gs4bhe.webp', level: 3, submenu: false, },
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Gravel_-Sand_-Aggregate_medium_toqhjk.webp',
                tag: 'gravel-sand-aggregate',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 105,
                name: "Coal and Peat",
                parent_id: 1,
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Gravel_-Sand_-Aggregate_medium_toqhjk.webp',
                tag: 'coal-and-peat',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 106,
                name: "Other Minerals",
                parent_id: 1,
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/other-minerals_medium_vlqbvg.webp',
                tag: 'other-minerals',
                submenu: false,
                level: 2,
                children: []
            }
        ]
    },
    // Adding other top level categories from 'real' if any...
];
