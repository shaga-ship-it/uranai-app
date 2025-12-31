// ============================================
// 計算ロジック (utils/logic.ts)
// ============================================

import {
  TENKAN,
  CHISHI,
  GOGYO,
  CHISHI_GOGYO,
  INYO,
  ZOKAN,
  JUNIUNSEI,
  JUNIUNSEI_TABLE,
  JUSSHIN_DESCRIPTION,
  JUNIUNSEI_DESCRIPTION,
} from "@/utils/data";

// 節入り日データ（簡略版）
const getSetsuri = (year: number, month: number) => {
  const setsuriDays: { [key: number]: { day: number; name: string } } = {
    1: { day: 6, name: "小寒" },
    2: { day: 4, name: "立春" },
    3: { day: 6, name: "啓蟄" },
    4: { day: 5, name: "清明" },
    5: { day: 6, name: "立夏" },
    6: { day: 6, name: "芒種" },
    7: { day: 7, name: "小暑" },
    8: { day: 8, name: "立秋" },
    9: { day: 8, name: "白露" },
    10: { day: 8, name: "寒露" },
    11: { day: 7, name: "立冬" },
    12: { day: 7, name: "大雪" },
  };
  return setsuriDays[month];
};

export const getDayPillar = (year: number, month: number, day: number) => {
  const baseDate = Date.UTC(1900, 0, 1);
  const targetDate = Date.UTC(year, month - 1, day);
  const diffTime = targetDate - baseDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const baseTenkan = 0;
  const baseChishi = 10;
  let offset = diffDays % 60;
  if (offset < 0) offset += 60;
  const tenkanIndex = (baseTenkan + offset) % 10;
  const chishiIndex = (baseChishi + offset) % 12;
  return { tenkan: TENKAN[tenkanIndex], chishi: CHISHI[chishiIndex] };
};

export const getYearPillar = (year: number, month: number, day: number) => {
  const setsuriDay = getSetsuri(2, year)?.day || 4;
  let adjustedYear = year;
  if (month < 2 || (month === 2 && day < setsuriDay)) {
    adjustedYear = year - 1;
  }
  const tenkanIndex = (((adjustedYear - 4) % 10) + 10) % 10;
  const chishiIndex = (((adjustedYear - 4) % 12) + 12) % 12;
  return { tenkan: TENKAN[tenkanIndex], chishi: CHISHI[chishiIndex] };
};

export const getMonthPillar = (
  year: number,
  month: number,
  day: number,
  yearTenkan: string
) => {
  const setsuri = getSetsuri(month, year);
  const setsuriDay = setsuri?.day || 6;
  let adjustedMonth = month;
  if (day < setsuriDay) {
    adjustedMonth = month - 1;
    if (adjustedMonth < 1) {
      adjustedMonth = 12;
    }
  }
  const monthChishiMap: { [key: number]: number } = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
    7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 0,
  };
  const chishiIndex = monthChishiMap[adjustedMonth];
  const chishi = CHISHI[chishiIndex];
  const yearPillarForMonth = getYearPillar(year, month, day);
  const yearTenkanForMonth = yearPillarForMonth.tenkan;
  const yearTenkanIndex = TENKAN.indexOf(yearTenkanForMonth);
  const gokotonBase = [2, 4, 6, 8, 0];
  const baseIndex = gokotonBase[yearTenkanIndex % 5];
  const monthOffset = (chishiIndex - 2 + 12) % 12;
  const tenkanIndex = (baseIndex + monthOffset) % 10;
  const tenkan = TENKAN[tenkanIndex];
  return { tenkan, chishi };
};

export const getHourPillar = (dayTenkan: string, hour: number, minute: number) => {
  if (hour === -1) return null;
  const totalMinutes = hour * 60 + minute;
  let chishiIndex;
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) chishiIndex = 0;
  else if (totalMinutes < 3 * 60) chishiIndex = 1;
  else if (totalMinutes < 5 * 60) chishiIndex = 2;
  else if (totalMinutes < 7 * 60) chishiIndex = 3;
  else if (totalMinutes < 9 * 60) chishiIndex = 4;
  else if (totalMinutes < 11 * 60) chishiIndex = 5;
  else if (totalMinutes < 13 * 60) chishiIndex = 6;
  else if (totalMinutes < 15 * 60) chishiIndex = 7;
  else if (totalMinutes < 17 * 60) chishiIndex = 8;
  else if (totalMinutes < 19 * 60) chishiIndex = 9;
  else if (totalMinutes < 21 * 60) chishiIndex = 10;
  else chishiIndex = 11;
  const chishi = CHISHI[chishiIndex];
  const dayTenkanIndex = TENKAN.indexOf(dayTenkan);
  const goshotonBase = [0, 2, 4, 6, 8];
  const baseIndex = goshotonBase[dayTenkanIndex % 5];
  const tenkanIndex = (baseIndex + chishiIndex) % 10;
  const tenkan = TENKAN[tenkanIndex];
  return { tenkan, chishi };
};

export const adjustToTrueSolarTime = (hour: number, minute: number, longitude: number) => {
  if (hour === -1) return null;
  const diffMinutes = (longitude - 135) * 4;
  let totalMinutes = hour * 60 + minute + diffMinutes;
  while (totalMinutes < 0) totalMinutes += 1440;
  while (totalMinutes >= 1440) totalMinutes -= 1440;
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: Math.floor(totalMinutes % 60),
  };
};

export const getJusshin = (dayTenkan: string, targetTenkan: string) => {
  if (!targetTenkan) return "";
  const dayGogyo = GOGYO[dayTenkan];
  const targetGogyo = GOGYO[targetTenkan];
  const sameInyo = INYO[dayTenkan] === INYO[targetTenkan];
  if (dayGogyo === targetGogyo) return sameInyo ? "比肩" : "劫財";
  const GOGYO_GENERATE: any = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const GOGYO_CONQUER: any = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
  const GOGYO_GENERATED: any = { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" };
  const GOGYO_CONQUERED: any = { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" };
  if (GOGYO_GENERATE[dayGogyo] === targetGogyo) return sameInyo ? "食神" : "傷官";
  if (GOGYO_CONQUER[dayGogyo] === targetGogyo) return sameInyo ? "偏財" : "正財";
  if (GOGYO_CONQUERED[dayGogyo] === targetGogyo) return sameInyo ? "偏官" : "正官";
  if (GOGYO_GENERATED[dayGogyo] === targetGogyo) return sameInyo ? "偏印" : "印綬";
  return "";
};

export const getJuniunsei = (dayTenkan: string, chishi: string) => {
  if (!chishi) return "";
  const table = JUNIUNSEI_TABLE[dayTenkan];
  return table && table[chishi] !== undefined ? JUNIUNSEI[table[chishi]] : "";
};

export const getRyunenInfo = (dayTenkan: string, year: number) => {
  const tenkanIndex = (((year - 4) % 10) + 10) % 10;
  const chishiIndex = (((year - 4) % 12) + 12) % 12;
  return {
    tenkan: TENKAN[tenkanIndex],
    chishi: CHISHI[chishiIndex],
    jusshin: getJusshin(dayTenkan, TENKAN[tenkanIndex]),
    juniunsei: getJuniunsei(dayTenkan, CHISHI[chishiIndex]),
  };
};

export const calculateGogyoBalance = (pillars: any) => {
  const balance: { [key: string]: number } = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  ["year", "month", "day", "hour"].forEach((key) => {
    const pillar = pillars[key];
    if (pillar) {
      balance[GOGYO[pillar.tenkan]] += 1;
      balance[CHISHI_GOGYO[pillar.chishi]] += 1;
    }
  });
  return balance;
};

export const getKijinKishin = (dayTenkan: string, gogyoBalance: any) => {
  const GOGYO_GENERATE: any = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const GOGYO_CONQUER: any = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
  const GOGYO_GENERATED: any = { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" };
  const GOGYO_CONQUERED: any = { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" };
  const dayGogyo = GOGYO[dayTenkan];
  const total = Object.values(gogyoBalance).reduce((a: any, b: any) => a + b, 0);
  const dayStrength = gogyoBalance[dayGogyo] + gogyoBalance[GOGYO_GENERATED[dayGogyo]];
  const isStrong = dayStrength > (total as number) / 2;
  return isStrong
    ? {
        strength: "身強",
        kijin: [GOGYO_CONQUER[dayGogyo], GOGYO_GENERATE[dayGogyo]],
        kishin: [dayGogyo, GOGYO_GENERATED[dayGogyo]],
      }
    : {
        strength: "身弱",
        kijin: [dayGogyo, GOGYO_GENERATED[dayGogyo]],
        kishin: [GOGYO_CONQUER[dayGogyo], GOGYO_CONQUERED[dayGogyo]],
      };
};

export const getFortuneInterpretation = (jusshin: string) => {
  const interpretations: any = {
    比肩: {
      overall: "自立と独立の年。自分の力を信じて前進できる時期です。競争心が高まり、新しいことへの挑戦意欲が湧いてきます。",
      work: "独立独歩で成果を上げられる年。自分のスキルアップに最適な時期です。",
      love: "対等なパートナーシップを求める時期。お互いを尊重し合える関係が築けます。",
      health: "体力・気力ともに充実。運動を始めるのに良い時期です。",
      money: "自力での収入アップが期待できます。投資より実力で稼ぐ方が吉。",
      lucky: "新しい資格取得、スキルアップ、独立準備、自己投資",
    },
    劫財: {
      overall: "変化と行動の年。積極的に動くことで運が開けます。ただし、財運には注意が必要な時期。",
      work: "競争が激しくなる暗示。差別化と独自性で勝負を。",
      love: "ライバル出現の可能性。積極的なアプローチが必要です。",
      health: "活動的になりすぎて疲労が溜まりやすい。怪我に注意。",
      money: "出費が増えやすい年。大きな投資や賭け事は避けて。",
      lucky: "自己投資、スポーツ、新規プロジェクト、行動力を活かす活動",
    },
    食神: {
      overall: "才能開花の年！創造性が高まり、楽しみながら成果を上げられる幸運な時期です。",
      work: "アイデアが次々と湧き、クリエイティブな仕事で成功。",
      love: "魅力が増して異性からの注目度アップ！",
      health: "食を楽しめる年。ただし食べ過ぎには注意。",
      money: "才能を活かした副収入が期待できます。",
      lucky: "創作活動、芸術鑑賞、グルメ、旅行、趣味を極める",
    },
    傷官: {
      overall: "表現力と感性が冴える年。自己表現を大切に。ただし言葉には気をつけて。",
      work: "革新的なアイデアで注目を集められます。",
      love: "理想が高くなりがち。相手への批判は控えめに。",
      health: "神経を使いすぎる傾向。リラックスを心がけて。",
      money: "技術や専門性を活かした収入が期待できます。",
      lucky: "芸術活動、資格取得、技術習得、自己表現",
    },
    偏財: {
      overall: "財運上昇の年！チャンスを積極的に掴みに行きましょう。社交運も絶好調。",
      work: "営業・交渉で成果が出やすい。人脈を広げて。",
      love: "出会いのチャンス多数！社交的な場に出かけて。",
      health: "飲み会続きで体調を崩しやすい。適度に控えて。",
      money: "臨時収入や投資利益が期待できます。",
      lucky: "投資、営業活動、人脈拡大、イベント参加",
    },
    正財: {
      overall: "堅実な発展の年。コツコツとした努力が実を結びます。",
      work: "誠実な仕事ぶりが評価されます。昇給に期待。",
      love: "結婚運アップ！真剣な交際に発展しやすい。",
      health: "規則正しい生活で健康維持。",
      money: "着実な収入アップ。貯蓄に最適な年。",
      lucky: "貯蓄、不動産、結婚準備、堅実な投資",
    },
    偏官: {
      overall: "試練と成長の年。困難を乗り越えて大きく成長できます。",
      work: "プレッシャーの多い年。乗り越えれば大きな評価に。",
      love: "刺激的な出会いがありそう。衝動的な行動は控えて。",
      health: "ストレスが溜まりやすい。スポーツで発散を。",
      money: "収入に波がある年。大きなリスクは避けて。",
      lucky: "資格試験、転職活動、スポーツ、チャレンジ",
    },
    正官: {
      overall: "名誉運上昇の年！社会的な評価が高まります。",
      work: "昇進・栄転のチャンス。リーダーシップを発揮して。",
      love: "結婚運良好。責任感のある相手との縁。",
      health: "責任感から無理をしがち。適度な休息を。",
      money: "安定した収入と社会的地位の向上。",
      lucky: "昇進試験、結婚、起業、社会貢献活動",
    },
    偏印: {
      overall: "学びと探求の年。新しい知識や技術を身につけるのに最適。",
      work: "専門性を高めるチャンス。独自路線が吉。",
      love: "知的な相手との出会いに期待。",
      health: "頭を使いすぎる傾向。十分な睡眠を。",
      money: "副業や専門分野からの収入に期待。",
      lucky: "資格取得、研究、読書、オンライン学習",
    },
    印綬: {
      overall: "知性と教養が高まる年。目上からの援助も期待できます。",
      work: "上司や先輩からのサポートに恵まれます。",
      love: "精神的なつながりを重視した交際。",
      health: "精神的な安定が得られる年。",
      money: "目上からの援助や臨時収入の可能性。",
      lucky: "勉強、資格取得、読書、メンターとの出会い",
    },
  };
  return interpretations[jusshin] || { overall: "安定した運気です。" };
};

export const get10YearFortune = (dayTenkan: string, startYear: number) => {
  const years = [];
  const labels = ["大吉", "吉", "平運", "小凶", "要注意"];
  for (let i = 0; i < 10; i++) {
    const year = startYear + i;
    const info = getRyunenInfo(dayTenkan, year);
    let rating = 3;
    if (["食神", "正財", "偏財", "正官", "印綬"].includes(info.jusshin)) rating = 5;
    else if (["比肩", "偏印"].includes(info.jusshin)) rating = 4;
    else if (["傷官", "偏官"].includes(info.jusshin)) rating = 3;
    else if (["劫財"].includes(info.jusshin)) rating = 2;
    if (["帝旺", "建禄", "冠帯"].includes(info.juniunsei)) rating = Math.min(5, rating + 1);
    if (["死", "墓", "絶"].includes(info.juniunsei)) rating = Math.max(1, rating - 1);
    years.push({ year, ...info, rating, label: labels[5 - rating] });
  }
  return years;
};

export const calculateCompatibility = (person1DayTenkan: string, person2DayTenkan: string) => {
  const GOGYO_GENERATE: any = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const GOGYO_CONQUER: any = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
  const g1 = GOGYO[person1DayTenkan], g2 = GOGYO[person2DayTenkan];
  const i1 = INYO[person1DayTenkan], i2 = INYO[person2DayTenkan];
  let loveScore = 50, workScore = 50, friendScore = 50;
  let loveComment = "", workComment = "", friendComment = "";

  if (g1 === g2) {
    if (i1 !== i2) {
      loveScore = 85; workScore = 75; friendScore = 90;
      loveComment = "価値観が似ていて安心感のある関係。お互いを深く理解できます。";
      workComment = "同じ方向を向いて協力できる良いパートナー。";
      friendComment = "最高の親友になれる相性。長く付き合える関係です。";
    } else {
      loveScore = 60; workScore = 65; friendScore = 70;
      loveComment = "似すぎていて刺激が足りないかも。";
      workComment = "競争関係になりやすい。役割分担を明確に。";
      friendComment = "ライバルにも親友にもなれる関係。";
    }
  } else if (GOGYO_GENERATE[g1] === g2) {
    loveScore = 90; workScore = 85; friendScore = 80;
    loveComment = "あなたが相手を支え、成長させる関係。";
    workComment = "あなたのサポートで相手が活躍。";
    friendComment = "面倒見の良い関係。";
  } else if (GOGYO_GENERATE[g2] === g1) {
    loveScore = 88; workScore = 80; friendScore = 82;
    loveComment = "相手に支えられ、成長できる関係。";
    workComment = "相手のサポートで実力を発揮できます。";
    friendComment = "頼れる存在。";
  } else if (GOGYO_CONQUER[g1] === g2) {
    loveScore = 65; workScore = 70; friendScore = 55;
    loveComment = "あなたが主導権を握る関係。";
    workComment = "リーダーシップを発揮できる関係。";
    friendComment = "上下関係ができやすい。";
  } else if (GOGYO_CONQUER[g2] === g1) {
    loveScore = 55; workScore = 60; friendScore = 50;
    loveComment = "相手に振り回されがち。";
    workComment = "相手のペースに巻き込まれやすい。";
    friendComment = "気を使いすぎる関係になりがち。";
  } else {
    loveScore = 70; workScore = 72; friendScore = 75;
    loveComment = "お互いの違いが新鮮に感じられる関係。";
    workComment = "異なる視点を持ち寄れる良い関係。";
    friendComment = "違いを認め合える関係。";
  }
  return { loveScore, workScore, friendScore, loveComment, workComment, friendComment };
};

export const getDayFortune = (dayTenkan: string, year: number, month: number, day: number) => {
  const targetDayPillar = getDayPillar(year, month, day);
  const jusshin = getJusshin(dayTenkan, targetDayPillar.tenkan);
  const juniunsei = getJuniunsei(dayTenkan, targetDayPillar.chishi);
  let luck = "normal", advice = "", caution = "";
  const goodJusshin = ["食神", "正財", "偏財", "正官", "印綬"];
  const cautionJusshin = ["劫財", "偏官", "傷官"];

  if (goodJusshin.includes(jusshin)) {
    luck = "good";
    const advices: any = {
      食神: "創作活動や趣味に最適。楽しむことで運が開けます。",
      正財: "堅実な活動に吉。契約や約束事に良い日。",
      偏財: "社交や営業に最適。人との出会いを大切に。",
      正官: "公的な場や面接に吉。誠実さが評価されます。",
      印綬: "学習や研究に最適。知識を深める日。",
    };
    advice = advices[jusshin] || "良い運気の日です。";
  } else if (cautionJusshin.includes(jusshin)) {
    luck = "caution";
    const cautions: any = {
      劫財: "出費に注意。衝動的な行動は控えて。",
      偏官: "プレッシャーを感じやすい日。無理は禁物。",
      傷官: "言葉遣いに注意。批判的になりすぎないで。",
    };
    caution = cautions[jusshin] || "慎重に過ごしましょう。";
  } else {
    advice = "平穏な一日。マイペースで過ごせます。";
  }
  const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  const luckyDirection = directions[(day + TENKAN.indexOf(dayTenkan)) % 8];
  const foods: any = { 木: "緑の野菜", 火: "赤い食材", 土: "かぼちゃ", 金: "白い食材", 水: "海藻" };
  const luckyFood = foods[GOGYO[dayTenkan]];
  return {
    kanshi: targetDayPillar.tenkan + targetDayPillar.chishi,
    jusshin, juniunsei, luck, advice, caution, luckyDirection, luckyFood,
  };
};

export const getMonthlyCalendar = (dayTenkan: string, year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const calendar = [];
  for (let day = 1; day <= daysInMonth; day++) {
    calendar.push({ day, ...getDayFortune(dayTenkan, year, month, day) });
  }
  return { calendar, firstDayOfWeek, daysInMonth };
};