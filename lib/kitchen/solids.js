// Real sizes for the things you place in a kitchen, and solid 3D models for the common appliances.
// Sizes are feet: [width (left↔right), depth (back↔front), height]. A solid model is a list of parts in feet,
// measured from the back-left corner of its footprint at counter level: boxes and cylinders, with face details
// as [left, top, width, height] fractions of that face plus CSS. The front of every model faces +y (toward you).

export const REAL = {
  microwave: [1.65, 1.25, 1], toaster: [0.95, 0.6, 0.7], coffee_maker: [0.75, 0.85, 1.15], kettle: [0.7, 0.55, 0.8], kettle_m: [0.7, 0.55, 0.8],
  air_fryer: [0.95, 1.05, 1.15], espresso: [1, 1.05, 1.1], rice_cooker: [0.9, 0.9, 0.8], rice_cooker_m: [0.9, 0.9, 0.8], blender: [0.65, 0.65, 1.3],
  knife_block: [0.45, 0.75, 0.95], cutting_board: [1.4, 0.9, 0.1], dish_stack: [0.9, 0.9, 0.45], fruit_bowl: [1, 1, 0.5], cookbooks: [1, 0.6, 1],
  herb_pots: [1.5, 0.5, 0.9], cast_iron: [1.4, 1, 0.3], faucet: [0.6, 0.7, 1.1], faucet_modern: [0.6, 0.7, 1.3], plant: [1.2, 1.2, 2.6],
  dutch_oven: [1, 1, 0.6], stand_mixer: [0.8, 1.2, 1.2], ice_cream: [0.9, 0.9, 1], choc_fountain: [0.9, 0.9, 1.6], pizza_oven: [1.6, 1.4, 1.2],
  gold_whisk: [0.4, 0.4, 1.2], robot_arm: [1, 1, 1.8], us_waffle: [0.9, 1, 0.5], mx_molcajete: [0.7, 0.7, 0.45], mx_press: [0.7, 0.7, 0.35],
  it_moka: [0.4, 0.4, 0.65], it_pasta: [0.8, 0.6, 0.6], cn_steamer: [0.9, 0.9, 0.6], cn_wok: [1.4, 1.2, 0.4], in_dabba: [0.8, 0.8, 0.3],
  in_cooker: [0.9, 0.8, 0.8], gr_briki: [0.3, 0.4, 0.4], gr_amphora: [0.6, 0.6, 1.4], jp_cat: [0.5, 0.45, 0.7], jp_knife: [0.9, 0.5, 0.8],
  kr_onggi: [1.3, 0.8, 1.1], kr_grill: [1.2, 1.2, 0.4], th_basket: [0.5, 0.5, 0.8], th_mortar: [0.6, 0.6, 0.45], lb_mezze: [1.3, 1, 0.3],
  lb_dallah: [0.5, 0.4, 1], et_jebena: [0.45, 0.45, 0.9], fr_baguette: [0.8, 0.6, 1.1], fr_copper: [1.4, 1, 0.6], gb_tin: [0.7, 0.7, 0.45],
  gb_teaset: [1.2, 0.8, 0.6], br_pot: [0.9, 0.9, 0.6], vn_phin: [0.3, 0.3, 0.4], vn_lantern: [0.8, 0.8, 1.2], jm_dutchpot: [1, 1, 0.6],
  jm_drum: [1.6, 1.6, 1.1], es_paella: [1.6, 1.4, 0.25], tr_cezve: [0.3, 0.4, 0.35], tr_tea: [1, 0.7, 0.7], eg_idra: [0.8, 0.8, 0.9],
  eg_fanous: [0.6, 0.6, 1.2], tn_tagine: [0.9, 0.9, 0.9], tn_couscous: [0.9, 0.9, 1], cu_cafetera: [0.4, 0.4, 0.65],
};

const GLASS = 'linear-gradient(135deg,#1a1e23,#39424b 55%,#1d2227)';
const btn = (x, y, s, c = '#4a4f55') => [x, y, s, s, `border-radius:50%;background:${c}`];
const B = (x, y, z, w, d, h, c, more = {}) => ({ t: 'box', x, y, z, w, d, h, c, ...more });
const Y = (x, y, z, r, h, c, more = {}) => ({ t: 'cyl', x, y, z, r, h, c, ...more });

export const SOLID = {
  microwave: [B(0, 0, 0, 1.65, 1.25, 1, '#d3d7dc', { rad: 3, front: [
    [0.04, 0.1, 0.62, 0.8, `background:${GLASS};border-radius:5px;box-shadow:inset 0 0 0 2px #7d848c`],
    [0.68, 0.1, 0.012, 0.8, 'background:#9aa1a8'],
    [0.73, 0.12, 0.22, 0.13, 'background:#111;border-radius:2px;box-shadow:inset 0 0 0 3px #111,inset 0 0 0 30px #7fdc8a'],
    btn(0.74, 0.34, 0.055), btn(0.82, 0.34, 0.055), btn(0.9, 0.34, 0.055), btn(0.74, 0.48, 0.055), btn(0.82, 0.48, 0.055), btn(0.9, 0.48, 0.055),
    btn(0.74, 0.62, 0.055), btn(0.82, 0.62, 0.055), btn(0.9, 0.62, 0.055), [0.75, 0.76, 0.18, 0.11, 'border-radius:6px;background:#f0613a'],
  ] })],
  toaster: [B(0, 0, 0, 0.95, 0.6, 0.7, '#ece8e0', { rad: 10, top: [[0.12, 0.3, 0.76, 0.12, 'background:#3a332c;border-radius:3px'], [0.12, 0.58, 0.76, 0.12, 'background:#3a332c;border-radius:3px']], front: [
    [0.1, 0.78, 0.8, 0.06, 'background:#bdb6aa;border-radius:3px'], btn(0.2, 0.42, 0.12, '#5a524a'), [0.62, 0.3, 0.2, 0.08, 'background:#3a332c;border-radius:4px'],
  ] })],
  coffee_maker: [
    B(0, 0, 0, 0.75, 0.85, 0.14, '#26292d'),
    B(0, 0, 0.14, 0.75, 0.38, 1.01, '#2b2e33', { front: [[0.2, 0.08, 0.6, 0.16, 'background:#16181b;border-radius:3px;box-shadow:inset 0 0 0 30px #ff9a3c40'], btn(0.42, 0.32, 0.16, '#d9534f')] }),
    B(0, 0.38, 0.85, 0.75, 0.47, 0.3, '#2b2e33', { front: [[0.1, 0.25, 0.8, 0.12, 'background:#16181b;border-radius:3px']] }),
    Y(0.375, 0.6, 0.14, 0.2, 0.42, 'rgba(120,140,150,.55)', { glass: true }),
    Y(0.375, 0.6, 0.14, 0.17, 0.2, '#3a2416'),
  ],
  air_fryer: [B(0, 0, 0, 0.95, 1.05, 1.15, '#232528', { rad: 14, top: [[0.2, 0.2, 0.6, 0.35, 'background:#121315;border-radius:6px;box-shadow:inset 0 0 0 30px #50a8ff22']], front: [
    [0.08, 0.38, 0.84, 0.012, 'background:#000'], [0.3, 0.55, 0.4, 0.12, 'background:#3a3d42;border-radius:8px'], [0.32, 0.12, 0.36, 0.14, 'background:#0d0e10;border-radius:4px;box-shadow:inset 0 0 0 3px #0d0e10,inset 0 0 0 30px #5ec8ff'],
  ] })],
  espresso: [
    B(0, 0, 0, 1, 1.05, 1.1, '#cfd3d8', { rad: 4, front: [[0.08, 0.1, 0.84, 0.14, 'background:#22262a;border-radius:3px'], btn(0.16, 0.13, 0.08, '#8fe39c'), btn(0.3, 0.13, 0.08, '#e3c88f'),
      [0.12, 0.35, 0.76, 0.42, 'background:#2b2f34;border-radius:4px'], [0.3, 0.33, 0.4, 0.1, 'background:#7c838a;border-radius:0 0 8px 8px'], [0.1, 0.82, 0.8, 0.1, 'background:repeating-linear-gradient(90deg,#9aa1a8 0 3px,#5f666d 3px 6px)']] }),
    Y(0.5, 0.88, 0.1, 0.09, 0.14, '#f4f1ea'),
  ],
  kettle: [
    Y(0.3, 0.275, 0, 0.29, 0.06, '#2b2e33'),
    Y(0.3, 0.275, 0.06, 0.26, 0.58, '#cfd4d9'),
    Y(0.3, 0.275, 0.64, 0.18, 0.06, '#e8ebee'),
    Y(0.3, 0.275, 0.7, 0.06, 0.05, '#2b2e33'),
    B(0.56, 0.22, 0.12, 0.08, 0.11, 0.58, '#2b2e33', { rad: 3 }),
    B(0.36, 0.22, 0.66, 0.24, 0.11, 0.06, '#2b2e33', { rad: 3 }),
    B(0, 0.24, 0.42, 0.08, 0.07, 0.14, '#b9bfc5'),
  ],
  rice_cooker: [
    Y(0.45, 0.45, 0, 0.43, 0.62, '#f4f2ee'),
    Y(0.45, 0.45, 0.62, 0.4, 0.12, '#e4e1db'),
    B(0.39, 0.38, 0.72, 0.12, 0.14, 0.06, '#8a8780', { rad: 3 }),
    B(0.3, 0.84, 0.12, 0.3, 0.06, 0.24, '#d8d4cc', { rad: 3, front: [[0.15, 0.15, 0.7, 0.3, 'background:#20242a;border-radius:2px;box-shadow:inset 0 0 0 30px #f5b04a55'], btn(0.38, 0.58, 0.24, '#e0605a')] }),
  ],
  // a real blender: a chunky 7½″ base (5″ high), a 6½″ wide jar about 9″ tall, and a lid, 16″ in all
  blender: [
    B(0.02, 0.02, 0, 0.6, 0.6, 0.42, '#2a2d31', { rad: 6, front: [btn(0.34, 0.28, 0.3, '#5a5f66'), [0.18, 0.74, 0.64, 0.09, 'background:#8fe39c;border-radius:2px']] }),
    Y(0.32, 0.32, 0.42, 0.27, 0.74, 'rgba(170,200,215,.45)', { glass: true }),
    Y(0.32, 0.32, 0.45, 0.245, 0.34, 'rgba(240,120,150,.85)'),
    Y(0.32, 0.32, 1.16, 0.26, 0.08, '#1d1f22'),
    Y(0.32, 0.32, 1.24, 0.07, 0.04, '#1d1f22'),
    B(0.56, 0.27, 0.62, 0.07, 0.1, 0.45, 'rgba(60,70,80,.9)', { rad: 3 }),
  ],
  knife_block: [
    B(0, 0.05, 0, 0.45, 0.7, 0.68, '#b98a57', { grain: true }),
    B(0.06, 0.12, 0.68, 0.08, 0.1, 0.24, '#1f1b18', { rad: 2 }), B(0.19, 0.12, 0.68, 0.08, 0.1, 0.26, '#1f1b18', { rad: 2 }), B(0.32, 0.12, 0.68, 0.08, 0.1, 0.22, '#1f1b18', { rad: 2 }),
    B(0.08, 0.32, 0.68, 0.08, 0.1, 0.2, '#1f1b18', { rad: 2 }), B(0.24, 0.32, 0.68, 0.08, 0.1, 0.23, '#1f1b18', { rad: 2 }),
  ],
  cutting_board: [B(0, 0, 0, 1.4, 0.9, 0.1, '#c99a62', { rad: 6, grain: true }), B(1.24, 0.38, 0.1, 0.08, 0.14, 0.001, '#8a6440')],
  dish_stack: [0, 1, 2, 3, 4, 5].map((i) => Y(0.45, 0.45, i * 0.065, 0.44 - (i % 2) * 0.02, 0.055, i % 2 ? '#f6f4ef' : '#e9e5dc')),
};
SOLID.kettle_m = SOLID.kettle.map((p, i) => (i === 1 ? { ...p, c: '#3b4a5a' } : i === 0 ? { ...p, c: '#5ec8ff' } : p));
SOLID.rice_cooker_m = SOLID.rice_cooker.map((p, i) => (i < 2 ? { ...p, c: i ? '#2f3336' : '#3b4045' } : p));
