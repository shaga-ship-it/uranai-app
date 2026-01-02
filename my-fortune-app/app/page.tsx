"use client";

import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

import {
  GOGYO,
  CHISHI_GOGYO,
  ZOKAN,
  PILLAR_DESCRIPTION,
  JUNIUNSEI_DESCRIPTION,
  JUSSHIN_DESCRIPTION,
  GOGYO_DESCRIPTION,
  PREFECTURES,
  JUSSHIN_MISSION,
  DAY_MASTER_PERSONALITY,
} from "@/utils/data";

import {
  adjustToTrueSolarTime,
  getYearPillar,
  getMonthPillar,
  getDayPillar,
  getHourPillar,
  getJusshin,
  getJuniunsei,
  calculateGogyoBalance,
  getKijinKishin,
  getRyunenInfo,
  get10YearFortune,
  getFortuneInterpretation,
  calculateCompatibility,
  getMonthlyCalendar,
  getDayFortune,
} from "@/utils/logic";

// ============================================
// コンポーネント
// ============================================

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1a0a2e 0%, #2a1a4e 100%)",
          border: "1px solid rgba(255,215,0,0.3)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ color: "#ffd700", margin: 0, fontSize: "18px" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ffd700", fontSize: "24px", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ color: "#d0d0d0", lineHeight: "1.7", fontSize: "14px" }}>{children}</div>
      </div>
    </div>
  );
};

const InfoButton = ({ title, children }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", borderRadius: "50%",
          width: "18px", height: "18px", color: "#ffd700", fontSize: "11px", cursor: "pointer", marginLeft: "4px", lineHeight: "16px", padding: 0,
        }}
      >
        ?
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>{children}</Modal>
    </>
  );
};

// ============================================
// メインアプリ
// ============================================

export default function ShichusuimeiApp() {
  const [birthData, setBirthData] = useState({ year: 1990, month: 1, day: 1, hour: 12, minute: 0, prefecture: "東京都" });
  const [birthData2, setBirthData2] = useState({ year: 1990, month: 1, day: 1, hour: 12, minute: 0, prefecture: "東京都" });
  const [result, setResult] = useState<any>(null);
  const [result2, setResult2] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState("meishiki");
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();

  const calculateResult = (data: any) => {
    const { year, month, day, hour, minute, prefecture } = data;
    const currentYear = new Date().getFullYear();
    const prefData = PREFECTURES.find((p) => p.name === prefecture) || PREFECTURES[12];
    const adjustedTime = hour === -1 ? null : adjustToTrueSolarTime(hour, minute, prefData.longitude);
    const yearPillar = getYearPillar(year, month, day);
    const monthPillar = getMonthPillar(year, month, day, yearPillar.tenkan);
    const dayPillar = getDayPillar(year, month, day);
    const hourPillar = adjustedTime ? getHourPillar(dayPillar.tenkan, adjustedTime.hour, adjustedTime.minute) : null;

    const pillars = {
      year: { ...yearPillar, jusshin: getJusshin(dayPillar.tenkan, yearPillar.tenkan), juniunsei: getJuniunsei(dayPillar.tenkan, yearPillar.chishi), zokan: ZOKAN[yearPillar.chishi] },
      month: { ...monthPillar, jusshin: getJusshin(dayPillar.tenkan, monthPillar.tenkan), juniunsei: getJuniunsei(dayPillar.tenkan, monthPillar.chishi), zokan: ZOKAN[monthPillar.chishi] },
      day: { ...dayPillar, juniunsei: getJuniunsei(dayPillar.tenkan, dayPillar.chishi), zokan: ZOKAN[dayPillar.chishi] },
      hour: hourPillar ? { ...hourPillar, jusshin: getJusshin(dayPillar.tenkan, hourPillar.tenkan), juniunsei: getJuniunsei(dayPillar.tenkan, hourPillar.chishi), zokan: ZOKAN[hourPillar.chishi] } : null,
    };

    const gogyoBalance = calculateGogyoBalance(pillars);
    const kijinInfo = getKijinKishin(dayPillar.tenkan, gogyoBalance);
    const personality = DAY_MASTER_PERSONALITY[dayPillar.tenkan];
    const mission = JUSSHIN_MISSION[pillars.month.jusshin] || JUSSHIN_MISSION["比肩"];
    const thisYear = getRyunenInfo(dayPillar.tenkan, currentYear);
    const nextYear = getRyunenInfo(dayPillar.tenkan, currentYear + 1);
    const tenYearFortune = get10YearFortune(dayPillar.tenkan, currentYear);

    return {
      pillars, dayMaster: dayPillar.tenkan, gogyoBalance, kijinInfo, personality, mission,
      thisYear: { ...thisYear, fortune: getFortuneInterpretation(thisYear.jusshin) },
      nextYear: { ...nextYear, fortune: getFortuneInterpretation(nextYear.jusshin) },
      tenYearFortune, currentYear, adjustedTime, prefecture,
    };
  };

  const calculate = () => { setResult(calculateResult(birthData)); setShowResult(true); setActiveTab("meishiki"); };
  const calculateBoth = () => { setResult(calculateResult(birthData)); setResult2(calculateResult(birthData2)); setShowCompatibility(true); };

  const years = Array.from({ length: 106 }, (_, i) => 2025 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = [{ value: -1, label: "不明" }, ...Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}時` }))];
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const gogyoColors: any = {
    木: { bg: "rgba(34,139,34,0.3)", text: "#90EE90", border: "#228B22" },
    火: { bg: "rgba(220,20,60,0.3)", text: "#FF6B6B", border: "#DC143C" },
    土: { bg: "rgba(139,90,43,0.3)", text: "#DEB887", border: "#8B5A2B" },
    金: { bg: "rgba(192,192,192,0.3)", text: "#E8E8E8", border: "#C0C0C0" },
    水: { bg: "rgba(30,144,255,0.3)", text: "#87CEEB", border: "#1E90FF" },
  };

  const renderStars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  const tabs = [
    { id: "meishiki", label: "命式", icon: "📜" },
    { id: "personality", label: "本質", icon: "🎭" },
    { id: "mission", label: "天職", icon: "⭐" },
    { id: "kaiun", label: "開運", icon: "🔑" },
    { id: "thisyear", label: "今年", icon: "🌟" },
    { id: "nextyear", label: "来年", icon: "🌙" },
    { id: "tenyear", label: "10年", icon: "📈" },
    { id: "calendar", label: "暦", icon: "📅" },
    { id: "compatibility", label: "相性", icon: "💕" },
  ];

  const radarData = result ? [
    { subject: "木", value: result.gogyoBalance["木"], fullMark: 5 },
    { subject: "火", value: result.gogyoBalance["火"], fullMark: 5 },
    { subject: "土", value: result.gogyoBalance["土"], fullMark: 5 },
    { subject: "金", value: result.gogyoBalance["金"], fullMark: 5 },
    { subject: "水", value: result.gogyoBalance["水"], fullMark: 5 },
  ] : [];

  const lineChartData = result ? result.tenYearFortune.map((y: any) => ({ year: y.year.toString(), 運気: y.rating })) : [];
  const calendarData = result ? getMonthlyCalendar(result.dayMaster, calendarYear, calendarMonth) : null;
  const selectedDayFortune = result && selectedDay ? getDayFortune(result.dayMaster, calendarYear, calendarMonth, selectedDay) : null;
  const compatibility = result && result2 ? calculateCompatibility(result.dayMaster, result2.dayMaster) : null;

  const getGogyoAnalysis = () => {
    if (!result) return null;
    const balance = result.gogyoBalance;
    const max: any = Object.entries(balance).reduce((a: any, b: any) => a[1] > b[1] ? a : b);
    const min: any = Object.entries(balance).reduce((a: any, b: any) => a[1] < b[1] ? a : b);
    let analysis = "";
    if (max[1] >= 3) analysis += `${max[0]}が${max[1]}と多めです。${GOGYO_DESCRIPTION[max[0]].excess} `;
    if (min[1] === 0) {
      analysis += `${min[0]}が不足しています。${GOGYO_DESCRIPTION[min[0]].lack} `;
      analysis += `\n\n【${min[0]}を補う開運アクション】\n${GOGYO_DESCRIPTION[min[0]].enhance}`;
    }
    return analysis || "五行のバランスが取れています。大きな偏りはありません。";
  };

  const BirthInputForm = ({ data, setData, label }: any) => (
    <div style={{ marginBottom: "20px" }}>
      {label && <div style={{ color: "#ffd700", fontSize: "14px", marginBottom: "10px", fontWeight: "bold" }}>{label}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "8px" }}>
        {[
          { key: "year", label: "生年", options: years.map((y) => ({ value: y, label: `${y}年` })) },
          { key: "month", label: "月", options: months.map((m) => ({ value: m, label: `${m}月` })) },
          { key: "day", label: "日", options: days.map((d) => ({ value: d, label: `${d}日` })) },
          { key: "hour", label: "時", options: hours },
        ].map(({ key, label, options }) => (
          <div key={key}>
            <label style={{ display: "block", marginBottom: "4px", color: "#a0a0b0", fontSize: "11px" }}>{label}</label>
            <select className="styled-select" value={data[key]} onChange={(e) => setData({ ...data, [key]: parseInt(e.target.value) })}>
              {options.map((o: any) => <option key={o.value !== undefined ? o.value : o} value={o.value !== undefined ? o.value : o}>{o.label !== undefined ? o.label : o}</option>)}
            </select>
          </div>
        ))}
        {data.hour !== -1 && (
          <div>
            <label style={{ display: "block", marginBottom: "4px", color: "#a0a0b0", fontSize: "11px" }}>分</label>
            <select className="styled-select" value={data.minute} onChange={(e) => setData({ ...data, minute: parseInt(e.target.value) })}>
              {minutes.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}分</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#a0a0b0", fontSize: "11px" }}>出生地</label>
          <select className="styled-select" value={data.prefecture} onChange={(e) => setData({ ...data, prefecture: e.target.value })}>
            {PREFECTURES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const moveDayFortune = (direction: number) => {
    let newDay = selectedDay + direction;
    let newMonth = calendarMonth;
    let newYear = calendarYear;
    const daysInCurrentMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    if (newDay < 1) { newMonth -= 1; if (newMonth < 1) { newMonth = 12; newYear -= 1; } newDay = new Date(newYear, newMonth, 0).getDate(); }
    else if (newDay > daysInCurrentMonth) { newMonth += 1; if (newMonth > 12) { newMonth = 1; newYear += 1; } newDay = 1; }
    setCalendarYear(newYear); setCalendarMonth(newMonth); setSelectedDay(newDay);
  };

  const goToToday = () => { setCalendarYear(todayYear); setCalendarMonth(todayMonth); setSelectedDay(todayDate); };

  // ★ここがSNS拡散の重要ポイント！シェアする文章を動的に作ります
  const getShareText = () => {
    if (!result) return "";
    
    // 【修正1】URLを「きれいな短縮URL」に固定する
    // ※ window.location.href だと長いURLになってしまうため
    const url = "https://uranai-app-eight.vercel.app/";

    // 【修正2】文章に「感情」と「驚き」を足す
    return `🔮【無料!! 四柱推命・運勢診断】\n\n私の本質は...「${result.personality.symbol}（${result.dayMaster}）」タイプでした！\n今の運勢は「${result.thisYear.jusshin}」みたい🤔\n\n性格も運気も当たりすぎてて怖い...💦\nあなたの運勢はどうなる？\n\n👇今すぐ診断する\n${url}\n\n#四柱推命 #占い #無料占い`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 25%, #0a1a2a 50%, #1a0a2e 75%, #0a0a1a 100%)", fontFamily: '"Noto Serif JP", "Hiragino Mincho Pro", serif', color: "#e8e0d0", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        .styled-select { appearance: none; background: rgba(20,10,30,0.9); border: 1px solid rgba(255,215,0,0.4); color: #e8e0d0; padding: 10px 12px; border-radius: 8px; font-size: 14px; width: 100%; cursor: pointer; font-family: inherit; }
        .styled-select:focus { border-color: rgba(255,215,0,0.8); outline: none; }
        .styled-select option { background: #1a0a2e; color: #e8e0d0; }
        .fortune-card { background: linear-gradient(135deg, rgba(40,20,60,0.8) 0%, rgba(20,30,50,0.8) 100%); border: 1px solid rgba(255,215,0,0.2); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .tab-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.2); color: #a0a0b0; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 12px; white-space: nowrap; transition: all 0.3s; }
        .tab-btn:hover { background: rgba(255,215,0,0.1); color: #ffd700; }
        .tab-btn.active { background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; }
        .calculate-btn { background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); color: #1a0a2e; border: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; cursor: pointer; font-family: inherit; transition: transform 0.3s; }
        .calculate-btn:hover { transform: scale(1.05); }
        
        /* 命式のスタイル修正（スマホ対応） */
        .pillar-card { 
            background: linear-gradient(180deg, rgba(50,30,60,0.9) 0%, rgba(30,20,40,0.95) 100%); 
            border: 1px solid rgba(255,215,0,0.3); 
            border-radius: 12px; 
            padding: 12px; 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            min-height: 200px; 
            flex: 1; /* 幅を均等に */
            min-width: 0; /* 小さく縮めるように */
        }
        .pillar-char { font-size: 28px; transition: font-size 0.3s; }
        .pillar-sub { font-size: 10px; }
        
        /* スマホ用メディアクエリ */
        @media (max-width: 480px) {
            .pillar-card { padding: 8px 2px; min-height: 180px; }
            .pillar-char { font-size: 20px !important; }
            .pillar-sub { font-size: 9px !important; }
            .fortune-card { padding: 16px 12px; }
        }

        .fortune-section { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin-bottom: 12px; border-left: 3px solid #ffd700; }
        .calendar-day { padding: 8px 4px; text-align: center; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
        .calendar-day:hover { transform: scale(1.05); }
        .calendar-good { background: rgba(144,238,144,0.2); color: #90EE90; }
        .calendar-caution { background: rgba(255,99,71,0.2); color: #FF6347; }
        .calendar-normal { background: rgba(255,255,255,0.05); color: #a0a0b0; }
        .calendar-today { border: 2px solid #ffd700 !important; box-shadow: 0 0 10px rgba(255,215,0,0.5); }
        .calendar-selected { background: rgba(255,215,0,0.3) !important; }
        .nav-btn { background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.4); color: #ffd700; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.3s; }
        .nav-btn:hover { background: rgba(255,215,0,0.2); }
        .share-btn { padding: 10px 20px; border-radius: 20px; border: none; font-size: 14px; cursor: pointer; font-family: inherit; margin: 4px; }
      `}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 48px)", background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px" }}>四柱推命</h1>
          <p style={{ color: "#a0a0b0", fontSize: "14px" }}>生年月日時から運命を読み解く</p>
        </div>

        <div className="fortune-card">
          <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "18px", borderBottom: "1px solid rgba(255,215,0,0.3)", paddingBottom: "8px" }}>生年月日時を入力</h2>
          <BirthInputForm data={birthData} setData={setBirthData} />
          <div style={{ textAlign: "center" }}><button className="calculate-btn" onClick={calculate}>運勢を占う</button></div>
        </div>

        {showResult && result && (
          <>
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto", paddingBottom: "8px" }}>
              {tabs.map((tab) => <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.icon} {tab.label}</button>)}
            </div>

            {/* 各タブの内容 */}
            {activeTab === "meishiki" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "8px", fontSize: "20px", textAlign: "center" }}>📜 命式</h2>
                <p style={{ textAlign: "center", color: "#a0a0b0", fontSize: "12px", marginBottom: "16px" }}>四柱推命の基本となる命式です。4つの柱があなたの運命を表します。</p>
                {result.adjustedTime && <div style={{ textAlign: "center", marginBottom: "16px", color: "#a0a0b0", fontSize: "12px" }}>※ {result.prefecture}の経度で真太陽時に補正：{result.adjustedTime.hour}時{result.adjustedTime.minute}分</div>}
                
                {/* 修正箇所：flexWrapを削除し、gapを微調整 */}
                <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "24px" }}>
                  {[
                    { name: "時柱", pillar: result.pillars.hour, key: "時柱" },
                    { name: "日柱", pillar: result.pillars.day, isMain: true, key: "日柱" },
                    { name: "月柱", pillar: result.pillars.month, key: "月柱" },
                    { name: "年柱", pillar: result.pillars.year, key: "年柱" },
                  ].map((item, index) => (
                    <div key={index} className="pillar-card" style={item.isMain ? { border: "2px solid #ffd700", boxShadow: "0 0 10px rgba(255,215,0,0.3)" } : {}}>
                      <div className="pillar-sub" style={{ color: "#a0a0b0", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.name}{item.isMain && <span style={{ color: "#ffd700" }}>（主）</span>}<InfoButton title={PILLAR_DESCRIPTION[item.key].title}><p>{PILLAR_DESCRIPTION[item.key].detail}</p></InfoButton></div>
                      {item.pillar ? (
                        <>
                          <div style={{ minHeight: "20px", marginBottom: "4px" }}>{item.pillar.jusshin && <div className="pillar-sub" style={{ color: "#ff8c00", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.pillar.jusshin}<InfoButton title={item.pillar.jusshin}><p style={{ color: "#ffd700", marginBottom: "8px" }}>{JUSSHIN_DESCRIPTION[item.pillar.jusshin]?.short}</p><p>{JUSSHIN_DESCRIPTION[item.pillar.jusshin]?.detail}</p></InfoButton></div>}</div>
                          <div className="pillar-char" style={{ color: gogyoColors[GOGYO[item.pillar.tenkan]]?.text }}>{item.pillar.tenkan}</div>
                          <div className="pillar-char" style={{ marginBottom: "6px", color: gogyoColors[CHISHI_GOGYO[item.pillar.chishi]]?.text }}>{item.pillar.chishi}</div>
                          <div style={{ fontSize: "9px", color: "#808080", marginBottom: "4px", transform: "scale(0.9)" }}>蔵: {item.pillar.zokan?.join(" ")}</div>
                          <div className="pillar-sub" style={{ marginTop: "auto", color: "#87CEEB", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.pillar.juniunsei}<InfoButton title={item.pillar.juniunsei}><p style={{ color: "#ffd700", marginBottom: "8px" }}>{JUNIUNSEI_DESCRIPTION[item.pillar.juniunsei]?.short}</p><p>{JUNIUNSEI_DESCRIPTION[item.pillar.juniunsei]?.detail}</p></InfoButton></div>
                        </>
                      ) : <div style={{ color: "#606070", fontSize: "12px", padding: "20px 0", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>不明</div>}
                    </div>
                  ))}
                </div>
                <h3 style={{ color: "#ffd700", fontSize: "16px", marginBottom: "8px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>五行バランス<InfoButton title="五行バランスとは"><p>五行（木・火・土・金・水）は、宇宙のすべてを構成する5つの要素です。</p><p style={{ marginTop: "8px" }}>命式に含まれる五行のバランスから、あなたの性格傾向や開運のヒントがわかります。</p></InfoButton></h3>
                <div style={{ height: "220px", marginBottom: "12px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,215,0,0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffd700", fontSize: 14 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "#a0a0b0", fontSize: 10 }} />
                      <Radar name="五行" dataKey="value" stroke="#ffd700" fill="#ffd700" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>{Object.entries(result.gogyoBalance).map(([gogyo, count]: any) => <span key={gogyo} style={{ background: gogyoColors[gogyo]?.bg, border: `1px solid ${gogyoColors[gogyo]?.border}`, color: gogyoColors[gogyo]?.text, padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>{gogyo}: {count}</span>)}</div>
                <div style={{ textAlign: "center", marginBottom: "16px", color: "#a0a0b0", fontSize: "13px" }}>{result.kijinInfo.strength}（日主が{result.kijinInfo.strength === "身強" ? "強い" : "弱い"}）</div>
                <div className="fortune-section"><h4 style={{ color: "#ffd700", fontSize: "14px", marginBottom: "8px" }}>あなたの五行バランス解説</h4><p style={{ fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-line" }}>{getGogyoAnalysis()}</p></div>
              </div>
            )}

            {activeTab === "personality" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "20px", textAlign: "center" }}>🎭 本質と性格</h2>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ fontSize: "48px", color: gogyoColors[GOGYO[result.dayMaster]]?.text }}>{result.dayMaster}</div>
                  <div style={{ color: "#ff8c00", fontSize: "16px" }}>{result.personality.element}</div>
                  <div style={{ color: "#a0a0b0", fontSize: "14px" }}>象徴：{result.personality.symbol}</div>
                </div>
                <div className="fortune-section"><p style={{ lineHeight: "1.8", fontSize: "14px" }}>{result.personality.personality}</p></div>
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "16px" }}>
                  <div className="fortune-section" style={{ borderLeftColor: "#90EE90" }}><h4 style={{ color: "#90EE90", fontSize: "14px", marginBottom: "8px" }}>💪 長所・強み</h4><div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{result.personality.strengths.map((s: any, i: number) => <span key={i} style={{ background: "rgba(144,238,144,0.1)", border: "1px solid rgba(144,238,144,0.3)", padding: "4px 10px", borderRadius: "15px", fontSize: "11px", color: "#90EE90" }}>{s}</span>)}</div></div>
                  <div className="fortune-section" style={{ borderLeftColor: "#FF6347" }}><h4 style={{ color: "#FF6347", fontSize: "14px", marginBottom: "8px" }}>⚠️ 短所・注意点</h4><div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{result.personality.weaknesses.map((w: any, i: number) => <span key={i} style={{ background: "rgba(255,99,71,0.1)", border: "1px solid rgba(255,99,71,0.3)", padding: "4px 10px", borderRadius: "15px", fontSize: "11px", color: "#FF6347" }}>{w}</span>)}</div></div>
                </div>
                <div className="fortune-section" style={{ borderLeftColor: "#87CEEB" }}><h4 style={{ color: "#87CEEB", fontSize: "14px", marginBottom: "8px" }}>👀 周囲からの印象</h4><p style={{ fontSize: "13px", lineHeight: "1.8" }}>{result.personality.impression}</p></div>
              </div>
            )}

            {activeTab === "mission" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "20px", textAlign: "center" }}>⭐ 使命と天職</h2>
                <div className="fortune-section"><h3 style={{ color: "#ff8c00", fontSize: "16px", marginBottom: "10px" }}>あなたの使命</h3><p style={{ fontSize: "14px", lineHeight: "1.9" }}>{result.mission.mission}</p></div>
                <div className="fortune-section"><h3 style={{ color: "#ff8c00", fontSize: "14px", marginBottom: "10px" }}>持って生まれた才能</h3><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{result.mission.talents.map((t: any, i: number) => <span key={i} style={{ background: "rgba(144,238,144,0.1)", border: "1px solid rgba(144,238,144,0.3)", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", color: "#90EE90" }}>{t}</span>)}</div></div>
                <div className="fortune-section"><h3 style={{ color: "#ff8c00", fontSize: "14px", marginBottom: "10px" }}>天職・適職</h3><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{result.mission.careers.map((c: any, i: number) => <span key={i} style={{ background: "rgba(135,206,235,0.1)", border: "1px solid rgba(135,206,235,0.3)", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", color: "#87CEEB" }}>{c}</span>)}</div></div>
              </div>
            )}

            {activeTab === "kaiun" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "20px", textAlign: "center" }}>🔑 開運の鍵</h2>
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr", marginBottom: "20px" }}>
                  <div style={{ background: "rgba(144,238,144,0.1)", border: "1px solid rgba(144,238,144,0.3)", borderRadius: "12px", padding: "14px", textAlign: "center" }}><div style={{ color: "#90EE90", fontSize: "12px", marginBottom: "6px" }}>喜神（味方の五行）</div><div style={{ fontSize: "20px", color: "#fff" }}>{result.kijinInfo.kijin.join(" / ")}</div></div>
                  <div style={{ background: "rgba(255,99,71,0.1)", border: "1px solid rgba(255,99,71,0.3)", borderRadius: "12px", padding: "14px", textAlign: "center" }}><div style={{ color: "#FF6347", fontSize: "12px", marginBottom: "6px" }}>忌神（注意の五行）</div><div style={{ fontSize: "20px", color: "#fff" }}>{result.kijinInfo.kishin.join(" / ")}</div></div>
                </div>
                <div className="fortune-section"><p style={{ fontSize: "13px", marginBottom: "16px" }}>あなたは<strong style={{ color: "#ffd700" }}>{result.kijinInfo.strength}</strong>なので、<span style={{ color: "#90EE90" }}>{result.kijinInfo.kijin.join("・")}</span>の気を積極的に取り入れることで運気がアップします。</p></div>
                {result.kijinInfo.kijin.map((gogyo: any, i: number) => <div key={i} className="fortune-section" style={{ borderLeftColor: gogyoColors[gogyo]?.border }}><h4 style={{ color: gogyoColors[gogyo]?.text, fontSize: "14px", marginBottom: "8px" }}>{gogyo}の気を取り入れる方法</h4><p style={{ fontSize: "13px", lineHeight: "1.8" }}>{GOGYO_DESCRIPTION[gogyo].enhance}</p></div>)}
                <div className="fortune-section" style={{ borderLeftColor: "#FF6347" }}><h4 style={{ color: "#FF6347", fontSize: "14px", marginBottom: "8px" }}>⚠️ 避けた方が良いこと</h4><p style={{ fontSize: "13px", lineHeight: "1.8" }}>{result.kijinInfo.kishin.map((g: any) => `${g}の気が強すぎる環境（${GOGYO_DESCRIPTION[g].excess.split("。")[0]}）`).join("、")}には注意しましょう。</p></div>
              </div>
            )}

            {activeTab === "thisyear" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "12px", fontSize: "20px", textAlign: "center" }}>🌟 {result.currentYear}年の運勢</h2>
                <div style={{ textAlign: "center", marginBottom: "20px" }}><span style={{ fontSize: "28px", color: "#ff8c00" }}>{result.thisYear.tenkan}{result.thisYear.chishi}</span><span style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", color: "#1a0a2e", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginLeft: "10px" }}>{result.thisYear.jusshin}</span></div>
                {[
                  { icon: "🌟", title: "全体運", content: result.thisYear.fortune.overall },
                  { icon: "💼", title: "仕事運", content: result.thisYear.fortune.work },
                  { icon: "💕", title: "恋愛運", content: result.thisYear.fortune.love },
                  { icon: "🏥", title: "健康運", content: result.thisYear.fortune.health },
                  { icon: "💰", title: "金運", content: result.thisYear.fortune.money },
                ].map((item, i) => <div key={i} className="fortune-section"><h3 style={{ color: "#ffd700", fontSize: "14px", marginBottom: "8px" }}>{item.icon} {item.title}</h3><p style={{ fontSize: "13px", lineHeight: "1.7" }}>{item.content}</p></div>)}
                <div style={{ background: "rgba(255,215,0,0.1)", borderRadius: "12px", padding: "14px", textAlign: "center", marginTop: "16px" }}><span style={{ color: "#ffd700" }}>✨ 開運アクション：</span><span>{result.thisYear.fortune.lucky}</span></div>
              </div>
            )}

            {activeTab === "nextyear" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "12px", fontSize: "20px", textAlign: "center" }}>🌙 {result.currentYear + 1}年の運勢</h2>
                <div style={{ textAlign: "center", marginBottom: "20px" }}><span style={{ fontSize: "28px", color: "#ff8c00" }}>{result.nextYear.tenkan}{result.nextYear.chishi}</span><span style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", color: "#1a0a2e", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginLeft: "10px" }}>{result.nextYear.jusshin}</span></div>
                {[
                  { icon: "🌟", title: "全体運", content: result.nextYear.fortune.overall },
                  { icon: "💼", title: "仕事運", content: result.nextYear.fortune.work },
                  { icon: "💕", title: "恋愛運", content: result.nextYear.fortune.love },
                  { icon: "🏥", title: "健康運", content: result.nextYear.fortune.health },
                  { icon: "💰", title: "金運", content: result.nextYear.fortune.money },
                ].map((item, i) => <div key={i} className="fortune-section"><h3 style={{ color: "#ffd700", fontSize: "14px", marginBottom: "8px" }}>{item.icon} {item.title}</h3><p style={{ fontSize: "13px", lineHeight: "1.7" }}>{item.content}</p></div>)}
                <div style={{ background: "rgba(255,215,0,0.1)", borderRadius: "12px", padding: "14px", textAlign: "center", marginTop: "16px" }}><span style={{ color: "#ffd700" }}>✨ 開運アクション：</span><span>{result.nextYear.fortune.lucky}</span></div>
              </div>
            )}

            {activeTab === "tenyear" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "20px", textAlign: "center" }}>📈 今後10年の運勢</h2>
                <div style={{ height: "200px", marginBottom: "20px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,215,0,0.1)" />
                      <XAxis dataKey="year" tick={{ fill: "#a0a0b0", fontSize: 11 }} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "#a0a0b0", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ background: "#1a0a2e", border: "1px solid #ffd700", borderRadius: "8px" }} labelStyle={{ color: "#ffd700" }} />
                      <Line type="monotone" dataKey="運気" stroke="#ffd700" strokeWidth={3} dot={{ fill: "#ffd700", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(85px, 1fr))", gap: "8px" }}>
                  {result.tenYearFortune.map((y: any, i: number) => (
                    <div key={i} style={{ background: i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "#ffd700" : "rgba(255,215,0,0.15)"}`, borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "14px", color: "#ffd700", fontWeight: "bold" }}>{y.year}</div>
                      <div style={{ fontSize: "16px", color: "#ff8c00", margin: "4px 0" }}>{y.tenkan}{y.chishi}</div>
                      <div style={{ fontSize: "10px", color: "#87CEEB", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>{y.jusshin}<InfoButton title={`${y.year}年 ${y.jusshin}`}><p style={{ color: "#ffd700", marginBottom: "8px" }}>{JUSSHIN_DESCRIPTION[y.jusshin]?.short}</p><p>{JUSSHIN_DESCRIPTION[y.jusshin]?.detail}</p></InfoButton></div>
                      <div style={{ fontSize: "11px", color: y.rating >= 4 ? "#90EE90" : y.rating <= 2 ? "#FF6347" : "#ffd700", fontWeight: "bold" }}>{y.label}</div>
                      <div style={{ fontSize: "12px", color: y.rating >= 4 ? "#90EE90" : y.rating <= 2 ? "#FF6347" : "#ffd700" }}>{renderStars(y.rating)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "16px", color: "#a0a0b0", fontSize: "11px", textAlign: "center" }}>大吉 ★★★★★ ／ 吉 ★★★★☆ ／ 平運 ★★★☆☆ ／ 小凶 ★★☆☆☆ ／ 要注意 ★☆☆☆☆</div>
              </div>
            )}

            {activeTab === "calendar" && calendarData && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "20px", textAlign: "center" }}>📅 開運カレンダー</h2>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <button className="nav-btn" onClick={() => { if (calendarMonth === 1) { setCalendarMonth(12); setCalendarYear(calendarYear - 1); } else setCalendarMonth(calendarMonth - 1); }}>◀</button>
                  <span style={{ color: "#ffd700", fontSize: "18px", fontWeight: "bold", minWidth: "140px", textAlign: "center" }}>{calendarYear}年{calendarMonth}月</span>
                  <button className="nav-btn" onClick={() => { if (calendarMonth === 12) { setCalendarMonth(1); setCalendarYear(calendarYear + 1); } else setCalendarMonth(calendarMonth + 1); }}>▶</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px" }}>{["日", "月", "火", "水", "木", "金", "土"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: "12px", color: i === 0 ? "#FF6347" : i === 6 ? "#87CEEB" : "#a0a0b0", padding: "6px" }}>{d}</div>)}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "16px" }}>
                  {Array(calendarData.firstDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                  {calendarData.calendar.map((d, i) => {
                    const isToday = calendarYear === todayYear && calendarMonth === todayMonth && d.day === todayDate;
                    const isSelected = d.day === selectedDay;
                    return (
                      <div key={i} className={`calendar-day calendar-${d.luck} ${isToday ? "calendar-today" : ""} ${isSelected ? "calendar-selected" : ""}`} onClick={() => setSelectedDay(d.day)}>
                        <div style={{ fontWeight: isToday ? "bold" : "normal" }}>{d.day}</div>
                        {isToday && <div style={{ fontSize: "8px", color: "#ffd700" }}>今日</div>}
                        <div style={{ fontSize: "9px" }}>{d.jusshin?.substring(0, 2)}</div>
                      </div>
                    );
                  })}
                </div>
                {selectedDayFortune && (
                  <div style={{ borderTop: "1px solid rgba(255,215,0,0.2)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <button className="nav-btn" onClick={() => moveDayFortune(-1)}>◀ 前日</button>
                      <button className="nav-btn" onClick={goToToday}>今日に戻る</button>
                      <button className="nav-btn" onClick={() => moveDayFortune(1)}>翌日 ▶</button>
                    </div>
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                      <div style={{ fontSize: "18px", color: "#ffd700", fontWeight: "bold" }}>{calendarYear}年{calendarMonth}月{selectedDay}日の運勢</div>
                      <div style={{ color: "#ff8c00", fontSize: "24px", margin: "8px 0" }}>{selectedDayFortune.kanshi}</div>
                      <div style={{ color: "#87CEEB", fontSize: "14px" }}>{selectedDayFortune.jusshin} ／ {selectedDayFortune.juniunsei}</div>
                    </div>
                    <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: "16px" }}>
                      <div style={{ background: "rgba(255,215,0,0.1)", borderRadius: "12px", padding: "12px", textAlign: "center" }}><div style={{ fontSize: "20px", marginBottom: "4px" }}>🧭</div><div style={{ color: "#a0a0b0", fontSize: "10px" }}>ラッキー方位</div><div style={{ color: "#ffd700", fontSize: "16px", fontWeight: "bold" }}>{selectedDayFortune.luckyDirection}</div></div>
                      <div style={{ background: "rgba(255,215,0,0.1)", borderRadius: "12px", padding: "12px", textAlign: "center" }}><div style={{ fontSize: "20px", marginBottom: "4px" }}>🍽️</div><div style={{ color: "#a0a0b0", fontSize: "10px" }}>ラッキーフード</div><div style={{ color: "#ffd700", fontSize: "14px", fontWeight: "bold" }}>{selectedDayFortune.luckyFood}</div></div>
                    </div>
                    {selectedDayFortune.advice && <div className="fortune-section" style={{ borderLeftColor: "#90EE90" }}><p style={{ fontSize: "13px", color: "#90EE90" }}>✨ {selectedDayFortune.advice}</p></div>}
                    {selectedDayFortune.caution && <div className="fortune-section" style={{ borderLeftColor: "#FF6347" }}><p style={{ fontSize: "13px", color: "#FF6347" }}>⚠️ {selectedDayFortune.caution}</p></div>}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", fontSize: "12px" }}><span><span style={{ color: "#90EE90" }}>●</span> 吉日</span><span><span style={{ color: "#FF6347" }}>●</span> 注意日</span><span><span style={{ color: "#a0a0b0" }}>●</span> 平日</span></div>
              </div>
            )}

            {activeTab === "compatibility" && (
              <div className="fortune-card">
                <h2 style={{ color: "#ffd700", marginBottom: "16px", fontSize: "20px", textAlign: "center" }}>💕 相性診断</h2>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ color: "#ffd700", fontSize: "14px", marginBottom: "10px" }}>あなた：{result.dayMaster}（{result.personality.symbol}）</div>
                  <BirthInputForm data={birthData2} setData={setBirthData2} label="相手の生年月日" />
                  <div style={{ textAlign: "center" }}><button className="calculate-btn" onClick={calculateBoth} style={{ padding: "10px 30px", fontSize: "14px" }}>相性を診断</button></div>
                </div>
                {showCompatibility && compatibility && result2 && (
                  <div>
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                      <span style={{ fontSize: "40px", color: gogyoColors[GOGYO[result.dayMaster]]?.text }}>{result.dayMaster}</span>
                      <span style={{ fontSize: "24px", margin: "0 16px", color: "#ffd700" }}>×</span>
                      <span style={{ fontSize: "40px", color: gogyoColors[GOGYO[result2.dayMaster]]?.text }}>{result2.dayMaster}</span>
                    </div>
                    {[
                      { title: "💕 恋愛相性", score: compatibility.loveScore, comment: compatibility.loveComment },
                      { title: "💼 仕事相性", score: compatibility.workScore, comment: compatibility.workComment },
                      { title: "🤝 友人相性", score: compatibility.friendScore, comment: compatibility.friendComment },
                    ].map((item, i) => (
                      <div key={i} className="fortune-section">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ color: "#ffd700", fontSize: "14px" }}>{item.title}</span>
                          <span style={{ fontSize: "24px", fontWeight: "bold", color: item.score >= 80 ? "#90EE90" : item.score >= 60 ? "#ffd700" : "#FF6347" }}>{item.score}%</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "8px", marginBottom: "8px" }}>
                          <div style={{ background: item.score >= 80 ? "#90EE90" : item.score >= 60 ? "#ffd700" : "#FF6347", width: `${item.score}%`, height: "100%", borderRadius: "10px", transition: "width 1s" }} />
                        </div>
                        <p style={{ fontSize: "13px", color: "#d0d0d0" }}>{item.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="fortune-card" style={{ textAlign: "center" }}>
              <h3 style={{ color: "#ffd700", fontSize: "16px", marginBottom: "12px" }}>📱 診断結果をシェア</h3>
              {/* 更新されたシェアボタン：動的なテキスト（getShareText）を使用 */}
              <button className="share-btn" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`, "_blank")} style={{ background: "#1DA1F2", color: "#fff" }}>𝕏 でシェア</button>
              <button className="share-btn" onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(getShareText())}`, "_blank")} style={{ background: "#00B900", color: "#fff" }}>LINE でシェア</button>
            </div>

            <div style={{ textAlign: "center", color: "#606070", fontSize: "11px", marginTop: "20px", padding: "16px" }}>※ このアプリは四柱推命の基本的な計算に基づいています。より詳細な鑑定には専門家への相談をおすすめします。</div>
          </>
        )}
      </div>
    </div>
  );
}