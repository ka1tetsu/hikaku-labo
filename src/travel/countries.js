// Every country / territory a traveller is likely to type, grouped into travel regions.
// Display names come from the runtime's Intl.DisplayNames (CLDR), so no hand-typed
// translations can drift. Aliases only cover common Japanese/English short forms.
const REGION_CODES = {
  '東アジア': 'JP KR KP CN TW HK MO MN',
  '東南アジア': 'TH VN KH LA MM MY SG ID PH BN TL',
  '南アジア': 'IN NP BT BD LK MV PK AF',
  '中東': 'AE QA SA OM BH KW JO IL PS LB SY IQ IR YE TR',
  'ロシア・中央アジア': 'RU KZ UZ KG TJ TM AZ GE AM',
  'ヨーロッパ': 'GB IE FR DE IT ES PT NL BE LU CH AT CZ SK PL HU SI HR BA RS ME MK AL GR BG RO MD UA BY LT LV EE FI SE NO DK IS MT CY AD MC SM VA LI XK',
  '北米': 'US CA',
  'ハワイ・グアム': 'GU MP',
  '中南米': 'MX GT BZ SV HN NI CR PA CU JM HT DO BS BB TT AG DM GD KN LC VC CO VE EC PE BO CL AR UY PY BR GY SR PR',
  'オセアニア': 'AU NZ FJ PG SB VU WS TO KI TV NR PW FM MH NC PF CK',
  'アフリカ': 'EG LY TN DZ MA SD SS ET ER DJ SO KE UG TZ RW BI CD CG CF CM TD NE NG BJ TG GH CI LR SL GN GW SN GM ML BF MR CV ST GQ GA AO ZM ZW MW MZ MG MU SC KM NA BW ZA LS SZ',
};

const EXTRA_ALIASES = {
  JP: '日本|にほん|にっぽん|国内', KR: '韓国|かんこく|大韓民国|south korea', KP: '北朝鮮', CN: '中国|ちゅうごく|china|中華人民共和国',
  TW: '台湾|たいわん', HK: '香港|ほんこん', MO: 'マカオ|澳門', TH: 'タイ|タイ王国|thailand', VN: 'ベトナム|vietnam',
  PH: 'フィリピン', ID: 'インドネシア', MY: 'マレーシア', SG: 'シンガポール', KH: 'カンボジア', IN: 'インド',
  MV: 'モルディブ', AE: 'アラブ首長国連邦|uae|アラブ', TR: 'トルコ|トルキエ|turkiye', GB: 'イギリス|英国|uk|イングランド|britain|england|united kingdom',
  FR: 'フランス', DE: 'ドイツ|germany', IT: 'イタリア', ES: 'スペイン', PT: 'ポルトガル', NL: 'オランダ|holland|netherlands',
  CH: 'スイス|switzerland', AT: 'オーストリア', CZ: 'チェコ|czechia', HU: 'ハンガリー', GR: 'ギリシャ|ギリシア', FI: 'フィンランド',
  DK: 'デンマーク', IS: 'アイスランド', HR: 'クロアチア', US: 'アメリカ|米国|usa|america|アメリカ合衆国', CA: 'カナダ',
  GU: 'グアム', MP: 'サイパン|北マリアナ諸島', MX: 'メキシコ', PE: 'ペルー', AU: 'オーストラリア|豪州|australia',
  NZ: 'ニュージーランド|nz', MA: 'モロッコ', EG: 'エジプト', ZA: '南アフリカ|みなみあふりか|south africa', RU: 'ロシア',
};

function names(code) {
  const out = new Set();
  try {
    for (const [locale, style] of [['ja', 'short'], ['ja', 'long'], ['en', 'short'], ['en', 'long']]) {
      const name = new Intl.DisplayNames([locale], { type: 'region', style }).of(code);
      if (name && name !== code) out.add(name);
    }
  } catch {
    // Older runtimes without Intl.DisplayNames still get the alias list below.
  }
  return [...out];
}

export const COUNTRY_INDEX = Object.freeze(Object.entries(REGION_CODES).flatMap(([region, codes]) =>
  codes.split(' ').map(code => {
    const display = names(code);
    const extras = EXTRA_ALIASES[code] ? EXTRA_ALIASES[code].split('|') : [];
    const name = extras[0] || display[0] || code;
    const nameEn = (() => {
      try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; }
    })();
    return Object.freeze({ code, name, nameEn, region, aliases: [...new Set([name, ...display, ...extras])] });
  })));

export const COUNTRY_REGIONS = Object.freeze(Object.keys(REGION_CODES));
export const countryByCode = code => COUNTRY_INDEX.find(c => c.code === code) || null;
// Regional-indicator flag emoji (🇹🇭) for an ISO 3166-1 alpha-2 code.
export const flagOf = code => (/^[A-Z]{2}$/.test(code || '') ? String.fromCodePoint(...[...code].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '');
