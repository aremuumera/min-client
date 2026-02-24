
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772949/iron-ore_medium_qhw2yn.webp'
            },
            {
                name: "Aluminum Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772940/Aluminum-ore_medium_ofktit.webp'
            },
            {
                name: "Antimony Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772938/Antimony-ore_medium_tt6zws.webp'
            },
            {
                name: "Cobalt Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772942/cobalt-ore_medium_ng8lrp.webp'
            },
            {
                name: "Chrome Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Copper Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772944/copper-ore_medium_umwyil.webp'
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772948/molybdenum-ore_medium_pmg37j.webp'
            },
            {
                name: "Nickel Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772953/nickel-ore_medium_u5mrn7.webp'
            },
            {
                name: "Niobium Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772949/niobium_medium_gp7xhd.webp'
            },
            {
                name: "PGE Group Elements",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772951/PGE_medium_fjui81.webp'
            },
            {
                name: "Silver Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772951/silver-ore_medium_aqmwkr.webp'
            },
            {
                name: "Tantalum Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772952/Tantalum_0_1_medium_sffqv5.webp'
            },
            {
                name: "Tin Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772954/tin-ore_medium_ip1por.webp'
            },
            {
                name: "Tungsten Ores",
                link: "/",
                img: '/assets/sphalerite(ZincSulphide).jpg'
            },
            {
                name: "Zinc Ores",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772955/zinc-ore_medium_mnpowu.webp'
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772969/Asbestos_medium_o7vf7m.webp'
            },
            {
                name: "Barite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772971/Barite-ore_medium_p8vgxl.webp'
            },
            {
                name: "Bentonite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772971/bentonite-ore_medium_e3vd8c.webp'
            },
            {
                name: "Calcium Carbonate (Calcite)",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772972/Calcite_medium_zjjxvq.webp'
            },
            {
                name: "Dolomite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772972/dolomite-stone_medium_kul5vw.webp'
            },
            {
                name: "Feldspar",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772974/Feldspar_medium_nibsys.webp'
            },
            {
                name: "Gypsum",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772977/Gypsum_medium_ukakeh.webp'
            },
            {
                name: "Kaolin",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772977/Kaolin-rock_medium_n1zzbt.webp'
            },
            {
                name: "Mica",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772979/Mica-Minerals_medium_zzvcux.webp'
            },
            {
                name: "Nephelin syenite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772980/Nepheline_medium_xt9i8i.webp'
            },
            {
                name: "Perlite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772981/Perlite-ore_medium_udj3hi.webp'
            },
            {
                name: "Pyrophylite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772982/Pyrophillite_medium_hzv0lb.webp'
            },
            {
                name: "Silica",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772983/Silica-ore_medium_x15wya.webp'
            },
            {
                name: "Talc",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772985/Talc_medium_rmb38s.webp'
            },
            {
                name: "Smectite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772983/Smectite-medium_v7jbat.webp'
            },
            {
                name: "Vermiculite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772986/Vermiculite_medium_r16f4u.webp'
            },
            {
                name: "Wollastonite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772987/Wollastonite_n3icrl.webp'
            },
            {
                name: "Zeolite",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772987/Zeolite-ore_medium_adbtxe.webp'
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773375/MarbleHandler_medium_gs4bhe.webp'
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Gravel_-Sand_-Aggregate_medium_toqhjk.webp'
            },
            {
                name: "Sand",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773415/Grinders-and-Mills_medium_vpmya8.webp'
            },
            {
                name: "Aggregate",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Gravel_-Sand_-Aggregate_medium_toqhjk.webp'
            },
            {
                name: "Coal",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/coal_medium_rday5y.webp'
            },
            {
                name: "Other Minerals",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/other-minerals_medium_vlqbvg.webp'
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773415/Grinders-and-Mills_medium_vpmya8.webp'
            },
            {
                name: "Aggregate",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Gravel_-Sand_-Aggregate_medium_toqhjk.webp'
            },
            {
                name: "Coal",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/coal_medium_rday5y.webp'
            },
            {
                name: "Other Minerals",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/other-minerals_medium_vlqbvg.webp'
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773415/Grinders-and-Mills_medium_vpmya8.webp'
            },
            {
                name: "Aggregate",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/Gravel_-Sand_-Aggregate_medium_toqhjk.webp'
            },
            {
                name: "Coal",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/coal_medium_rday5y.webp'
            },
            {
                name: "Other Minerals",
                link: "/",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/other-minerals_medium_vlqbvg.webp'
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
                    { id: 10207, tag: 'fluorite', name: "Fluorite", parent_id: 102, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771931126/flourite_yauypb.jpg', level: 3, submenu: false, },
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
                    { id: 10301, tag: 'marble', name: "Marble", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930525/Marble_medium_xuqpuz.webp', level: 3, submenu: false, },
                    { id: 10302, tag: 'onyx', name: "Onyx", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930525/Onyx_medium_ph0qmh.webp', level: 3, submenu: false, },
                    { id: 10303, tag: 'travertine', name: "Travertine", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930525/Travertine_medium_xi5adk.webp', level: 3, submenu: false, },
                    { id: 10304, tag: 'limestone', name: "Limestone", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930527/Limestone_medium_vgikwh.webp', level: 3, submenu: false, },
                    { id: 10305, tag: 'sandstone', name: "Sandstone", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930527/Sandstone_medium_m3zuuv.webp', level: 3, submenu: false, },
                    { id: 10306, tag: 'granite', name: "Granite", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930525/Granite_medium_ougm54.webp', level: 3, submenu: false, },
                    { id: 10307, tag: 'basalt', name: "Basalt", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930525/Basalt_medium_cb2glk.webp', level: 3, submenu: false, },
                    { id: 10308, tag: 'quartz', name: "Quartz", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930526/Quartz_medium_cpw1jc.webp', level: 3, submenu: false, },
                    { id: 10309, tag: 'quartzite', name: "Quartzite", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930525/Quartzite_medium_hs6ojn.webp', level: 3, submenu: false, },
                    { id: 10310, tag: 'slate', name: "Slate", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930526/slate_medium_bwksaz.webp', level: 3, submenu: false, },
                    { id: 10311, tag: 'precious-semi-precious-stones', name: "Precious and Semi-Precious Stones", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930526/precious-semi-precious-stone_medium_r8bebk.webp', level: 3, submenu: false, },
                    { id: 10312, tag: 'other-natural-stone', name: "Other Natural Stone", parent_id: 103, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771930527/Other_natural_stone_bxu6rw.webp', level: 3, submenu: false, }
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

    /*
    ** Cat 2
    */
    {
        id: 2,
        name: "Mining tools",
        parent_id: null,
        img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771772808/other-minerals_medium_vlqbvg.webp',
        tag: 'mining-tools',
        submenu: true,
        level: 1,
        children: [
            {
                id: 201,
                name: "Drilling Rigs and Equipment",
                tag: 'drilling-rigs-and-equipment',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773087/Drilling_rigs_and_equipments_medium_d2yzgt.webp',
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773088/Energy---Machines-and-Equipments_medium_antwcr.webp',
                submenu: true,
                level: 2,
                children: [
                    { id: 20201, tag: 'generators', name: "Generators", parent_id: 202, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773202/Generators_medium_itanwj.webp', level: 3 },
                    { id: 20202, tag: 'solar-panels', name: "Solar Panels", parent_id: 202, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773205/Solar-Panels_medium_lgsjyi.webp', level: 3 },
                    { id: 20203, tag: 'wind-turbines', name: "Wind Turbines", parent_id: 202, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773208/Wind-Turbines_medium_d7sxmp.webp', level: 3 },
                    { id: 20204, tag: 'water-turbines', name: "Water Turbines", parent_id: 202, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20205, tag: 'electrical-electronic-equipment', name: "Electrical and Electronic Equipment", parent_id: 202, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773200/Electrical-and-Electronic-Equipment_medium_dut7wi.webp', level: 3 },
                    { id: 20206, tag: 'other-energy-resources', name: "Other Energy Resources", parent_id: 202, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773203/Other-Energy-Resources_medium_hcutfv.webp', level: 3 }
                ]
            },
            {
                id: 203,
                name: "Engineering Devices and Equipment",
                parent_id: 2,
                tag: 'engineering-devices-and-equipment',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773090/Engineering_Devices_and_Equipments_cmybwa.webp',
                submenu: true,
                level: 2,
                children: [
                    { id: 20301, tag: 'cartography-gps-gnss-device', name: "Cartography GPS GNSS Device and Accessories", parent_id: 203, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773268/Cartography_GPS_GNSS_Device_and_Accessories_gyjmgq.webp', level: 3, },
                    { id: 20302, tag: 'detectors-underground-imaging', name: "Detectors, Underground Imaging", parent_id: 203, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773269/Detectors_-Underground-Imaging_medium_avdnqi.webp', level: 3, },
                    { id: 20303, tag: 'explosives-blasting-equipment', name: "Explosives and Blasting Equipment", parent_id: 203, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773271/Explosives-and-Blasting-Equipment_medium_whuagi.webp', level: 3, },
                    { id: 20304, tag: 'ground-investigation-equipment', name: "Ground Investigation Equipment and Parts", parent_id: 203, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773272/Ground-Investigation-Equipment-and-Parts_medium_bxydap.webp', level: 3, },
                    { id: 20305, tag: 'laboratory-equipment-accessories', name: "Laboratory Equipment and Accessories", parent_id: 203, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773273/Laboratory-Equipment-and-Accessories_medium_bbsawq.webp', level: 3, },
                    { id: 20306, tag: 'sample-preparation-machines', name: "Sample Preparation Machines", parent_id: 203, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773275/Sample-Preparation-Machines_medium_meefty.webp', level: 3, }
                ]
            },
            {
                id: 204,
                name: "Heavy Equipment",
                parent_id: 2,
                tag: 'heavy-equipment',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773089/Heavy-Equipment_medium_yi6unx.webp',
                submenu: true,
                level: 2,
                children: [
                    { id: 20401, tag: 'backhoe-loader', name: "Backhoe Loader", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773306/Backhoe-Loader_medium_hjvqai.webp', level: 3 },
                    { id: 20402, tag: 'bored-pile-machine', name: "Bored Pile Machine", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773308/Bored-Pile-Machine_medium_j4hd7u.webp', level: 3 },
                    { id: 20403, tag: 'dozer-bucket', name: "Dozer Bucket", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773309/Dozer-Bucket_medium_wmfned.webp', level: 3 },
                    { id: 20404, tag: 'excavator', name: "Excavator", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773310/Excavator_medium_dxgunt.webp', level: 3 },
                    { id: 20405, tag: 'forklifts-stackers', name: "Forklifts and Stackers", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773312/Forklifts-and-Stackers_medium_xsiyop.webp', level: 3 },
                    { id: 20406, tag: 'grader', name: "Grader", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773314/Grader_medium_bys7os.webp', level: 3 },
                    { id: 20407, tag: 'heavy-equipment-spares', name: "Heavy Equipment Spares Parts", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773089/Heavy-Equipment_medium_yi6unx.webp', level: 3 },
                    { id: 20408, tag: 'hydraulic-breaker-gun', name: "Hydraulic Breaker and Gun", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773318/Hydraulic-Breaker-and-Gun_medium_bb8e81.webp', level: 3 },
                    { id: 20409, tag: 'loader', name: "Loader", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773306/Backhoe-Loader_medium_hjvqai.webp', level: 3 },
                    { id: 20410, tag: 'mobile-crane', name: "Mobile Crane", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773323/Mobile-Crane_medium_rjciqz.webp', level: 3 },
                    { id: 20411, tag: 'rock-truck', name: "Rock Truck", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773334/Rock-Truck_medium_rckqnv.webp', level: 3 },
                    { id: 20412, tag: 'telehandler', name: "Telehandler", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773336/Telehandler_medium_tprce1.webp', level: 3 },
                    { id: 20413, tag: 'mine-trailer', name: "Mine Trailer", parent_id: 204, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20414, tag: 'other-heavy-equipment', name: "Other Heavy Equipment", parent_id: 204, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773333/Other-Heavy-Equipment_medium_etaepw.webp', level: 3 }
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
                    { id: 20601, tag: 'marble-quarry-machines', name: "Marble Quarry Machines", parent_id: 206, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773374/Marble-Quarry-Machines_11zon_medium_yitf7i.webp', level: 3, },
                    { id: 20602, tag: 'marble-processing-machines', name: "Marble Processing Machines", parent_id: 206, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773369/Marble-Processing-Machines_medium_vtmh4u.webp', level: 3, },
                    { id: 20603, tag: 'marble-handling-transport', name: "Marble Handling and Transport Equipment", parent_id: 206, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, }
                ]
            },
            {
                id: 207,
                name: "Ore Mineral Processing Equipment",
                parent_id: 2,
                tag: 'ore-mineral-processing-equipment',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773035/mineral-processing_medium_yc22j7.webp',
                submenu: true,
                level: 2,
                children: [
                    { id: 20701, tag: 'bulk-bag-filling', name: "Bulk Bag Filling and Bagging", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773403/Bulk-Bag-Filling-and-Bagging_medium_egdtep.webp', level: 3 },
                    { id: 20702, tag: 'bunkers-feeders', name: "Bunkers and Feeders", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773405/Bunkers-and-Feeders_medium_vhpszg.webp', level: 3 },
                    { id: 20703, tag: 'centrifuges', name: "Centrifuges", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20704, tag: 'conveyors-carrier', name: "Conveyors and Carrier", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773407/Conveyors-and-Carrier_medium_rydvet.webp', level: 3 },
                    { id: 20705, tag: 'crushers', name: "Crushers", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773409/Crushers_medium_he1mek.webp', level: 3 },
                    { id: 20706, tag: 'cyclones', name: "Cyclones", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773402/Air-Cyclones_medium_zo4cuz.webp', level: 3 },
                    { id: 20707, tag: 'filters-presses', name: "Filters and Presses", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20708, tag: 'flotation-cells', name: "Flotation Cells", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773412/flotation-cells_medium_xjr9t5.webp', level: 3 },
                    { id: 20709, tag: 'grinders-mills', name: "Grinders and Mills", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773415/Grinders-and-Mills_medium_vpmya8.webp', level: 3 },
                    { id: 20710, tag: 'leaching-equipment', name: "Leaching Equipment", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773419/Leaching_medium_apu7oy.webp', level: 3 },
                    { id: 20711, tag: 'mining-drying-machine', name: "Mining Drying Machine", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773429/Mining-Drying-Machine_0_medium_kvikgd.webp', level: 3 },
                    { id: 20712, tag: 'pumps', name: "Pumps", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773432/Pumps_medium_oebg9m.webp', level: 3 },
                    { id: 20713, tag: 'separators', name: "Separators", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773435/Separators_medium_gdowhh.webp', level: 3 },
                    { id: 20714, tag: 'screens', name: "Screens", parent_id: 207, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3 },
                    { id: 20715, tag: 'silos', name: "Silos", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773438/Silos_medium_fahwzz.webp', level: 3 },
                    { id: 20716, tag: 'thickeners', name: "Thickeners", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773438/Thickener_medium_nrvqwm.webp', level: 3 },
                    { id: 20717, tag: 'washing-machines', name: "Washing Machines", parent_id: 207, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773441/washing-machine_medium_sbpkzw.webp', level: 3 }
                ]
            },
            {
                id: 208,
                name: "Underground Mining Equipment",
                parent_id: 2,
                tag: 'underground-mining-equipment',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773095/underground-mining-equipment_0_medium_vi9rgi.webp',
                submenu: true,
                level: 2,
                children: [
                    { id: 20801, name: "Roof Support Systems", parent_id: 208, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20802, name: "Ventilation Systems", parent_id: 208, img: '/assets/sphalerite(ZincSulphide).jpg', level: 3, },
                    { id: 20803, name: "Underground Pumps", parent_id: 208, img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773440/underground-pumps_medium_umo78t.webp', level: 3, }
                ]
            },
            {
                id: 209,
                name: "Other Mining Equipment",
                parent_id: 2,
                tag: 'other-mining-equipment',
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773093/Other_Mining_Equipment_erb7kr.webp',
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
        img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773036/Mining-Services_medium_zub8vf.webp',
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773032/Consulting-_-advisory_medium_nlal9h.webp',
                parent_id: 3,
                tag: 'consulting-advisory',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 303,
                name: "Drilling and Blasting Services",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773032/Consulting-_-advisory_medium_nlal9h.webp',
                parent_id: 3,
                tag: 'drilling-and-blasting-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 304,
                name: "Exploration & Surveying services",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773033/Exploration-_-Surveying-servicess_medium_jrksdy.webp',
                parent_id: 3,
                tag: 'exploration-surveying-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 305,
                name: "Freight Services",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773033/Exploration-_-Surveying-servicess_medium_jrksdy.webp',
                parent_id: 3,
                tag: 'freight-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 306,
                name: "Mining Services",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773036/Mining-Services_medium_zub8vf.webp',
                parent_id: 3,
                tag: 'mining-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 307,
                name: "Mineral Processing Services",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773036/Mining-Services_medium_zub8vf.webp',
                parent_id: 3,
                tag: 'mineral-processing-services',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 308,
                name: "Supply Chain Solution",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773037/Supply-Chain-Solution_medium_jmjjqb.webp',
                parent_id: 3,
                tag: 'supply-chain-solution',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 309,
                name: "Other Services",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773037/Supply-Chain-Solution_medium_jmjjqb.webp',
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
        img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773037/Other-Services_medium_xp4p8g.webp',
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
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773062/Fall-protection_medium_pgat3e.webp',
                parent_id: 4,
                tag: 'fall-protection',
                submenu: false,
                level: 2,
                children: []
            },
            {
                id: 407,
                name: "Hearing Protection",
                img: 'https://res.cloudinary.com/dof6efau4/image/upload/v1771773062/Fall-protection_medium_pgat3e.webp',
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
    // African countries involved in mining
    { name: 'Nigeria', region: 'Africa', flag: 'https://flagcdn.com/ng.svg' },
    {
        name: 'South Africa',
        region: 'Africa',
        flag: 'https://flagcdn.com/za.svg',
        mainResources: ['Gold', 'Platinum', 'Diamonds', 'Coal'],
    },
    {
        name: 'Ghana',
        region: 'Africa',
        flag: 'https://flagcdn.com/gh.svg',
        mainResources: ['Gold', 'Bauxite', 'Manganese'],
    },
    {
        name: 'DRC',
        region: 'Africa',
        flag: 'https://flagcdn.com/cd.svg',
        mainResources: ['Cobalt', 'Copper', 'Diamonds', 'Coltan'],
    },
    {
        name: 'Zambia',
        region: 'Africa',
        flag: 'https://flagcdn.com/zm.svg',
        mainResources: ['Copper', 'Cobalt', 'Emeralds'],
    },
    {
        name: 'Botswana',
        region: 'Africa',
        flag: 'https://flagcdn.com/bw.svg',
        mainResources: ['Diamonds', 'Copper', 'Nickel'],
    },
    // Western countries involved in mining
    {
        name: 'Canada',
        region: 'Western',
        flag: 'https://flagcdn.com/ca.svg',
        mainResources: ['Gold', 'Copper', 'Zinc', 'Uranium'],
    },
    {
        name: 'United States',
        region: 'Western',
        flag: 'https://flagcdn.com/us.svg',
        mainResources: ['Coal', 'Copper', 'Gold', 'Rare Earth Elements'],
    },
    {
        name: 'Australia',
        region: 'Western',
        flag: 'https://flagcdn.com/au.svg',
        mainResources: ['Iron Ore', 'Coal', 'Gold', 'Bauxite'],
    },
    {
        name: 'United Kingdom',
        region: 'Western',
        flag: 'https://flagcdn.com/gb.svg',
        mainResources: ['Coal', 'Potash', 'Limestone'],
    },
    // China
    {
        name: 'China',
        region: 'Asia',
        flag: 'https://flagcdn.com/cn.svg',
        mainResources: ['Coal', 'Rare Earth Elements', 'Gold', 'Graphite'],
    },
];

export const MoqUnits = [
    'Tons',
    'Kg',
    'gr',
    'square meter',
    'square feet',
    'Cubic meter',
    'meter',
    'slab',
    'set',
    'piece',
    'box',
    'barrel',
    'lb',
    'oz',
    'l',
    'ml',
    'm',
    'cm',
    'mm',
    'sqm',
    'sqft',
    'cum',
    'cuft',
    'pcs',
    'sets',
    'pairs',
    'bags',
    'boxes',
    'cartons',
    'pallets',
    'rolls',
    'sheets',
    'units',
    'others'
];
