import React, { useState } from "react";

// --- Components ย่อย ---

const RuleSection = ({ title, icon, children, id }) => (
  <section
    id={id}
    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
  >
    <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-4 flex items-center gap-3.5 backdrop-blur-sm sticky top-0 z-10">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm border border-indigo-100 shrink-0">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 text-base md:text-lg leading-tight">
        {title}
      </h3>
    </div>
    <div className="p-5 text-sm md:text-base text-slate-600 font-normal leading-7 md:leading-8 space-y-4">
      {children}
    </div>
  </section>
);

const HighlightBox = ({ type = "info", title, children }) => {
  const styles = {
    info: "bg-blue-50/50 text-blue-800 border-blue-100",
    warning: "bg-amber-50/50 text-amber-900 border-amber-100",
    danger: "bg-rose-50/50 text-rose-900 border-rose-100",
    success: "bg-emerald-50/50 text-emerald-900 border-emerald-100",
  };
  return (
    <div className={`p-4 rounded-xl border text-sm ${styles[type]} space-y-2`}>
      {title && (
        <div className="font-semibold uppercase tracking-wide text-xs opacity-70 mb-2 flex items-center gap-1">
          {title}
        </div>
      )}
      <div className="leading-relaxed font-normal opacity-90">{children}</div>
    </div>
  );
};

const VoteCard = ({ count, title, action, color }) => {
  const styles = {
    red: "bg-rose-50 border-rose-100 text-rose-800",
    orange: "bg-orange-50 border-orange-100 text-orange-800",
    green: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };

  return (
    <div
      className={`flex flex-col border rounded-xl p-4 ${styles[color]} relative overflow-hidden text-center md:text-left h-full`}
    >
      <div className="font-bold text-xl mb-1">{count}</div>
      <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
        {title}
      </div>
      <div className="text-sm font-medium mt-auto leading-snug opacity-90">
        {action}
      </div>
    </div>
  );
};

export default function RulesPage() {
  const [lang, setLang] = useState("th"); // 'th' or 'en'

  // --- ข้อมูลเนื้อหา (Content Data) แยกภาษา ---
  const content = {
    th: {
      updated: "อัปเดต: ม.ค. 2026",
      mainTitle: "ระเบียบการแข่งขัน",
      subTitle: "Moodeng Cup Official Rules",
      sections: {
        r1: {
          title: "ข้อ 1: กติกาการแข่งขันทั่วไป",
          list: [
            <>
              ยึดตามกติกาของ{" "}
              <span className="font-semibold text-slate-800">
                สหพันธ์แบดมินตันโลก (BWF)
              </span>{" "}
              เป็นหลัก ยกเว้นระบุไว้เป็นอย่างอื่น
            </>,
            "คณะกรรมการขอสงวนสิทธิ์ในการเปลี่ยนแปลงแก้ไข โดยคำตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด",
          ],
        },
        r2: {
          title: "ข้อ 2: กติกาการเสิร์ฟเฉพาะรุ่น",
          sub1: "2.1 รุ่นมือ S",
          desc1: "ใช้กติกาการเสิร์ฟตามมาตรฐานสากล BWF",
          // ✅ ปรับแก้: เพิ่มเว้นวรรคและจัดคำให้สวยงาม
          sub2: "2.2 รุ่น Baby, BG-, N, BG(men/mixs), Single(NB/N)",
          warningTitle: "⚠️ ข้อห้ามสำคัญ",
          // ✅ ปรับแก้: แยก icon กับ text ออกจากกัน เพื่อการจัด Layout ที่ไม่เพี้ยน
          warningList: [
            {
              icon: "✅",
              text: (
                <>
                  อนุญาตให้เสิร์ฟลูกหลังด้วย{" "}
                  <span className="font-semibold text-amber-900 underline decoration-amber-300 decoration-2 underline-offset-2">
                    ท่าโฟร์แฮนด์ (Forehand)
                  </span>{" "}
                  เท่านั้น
                </>
              ),
            },
            {
              icon: "🚫",
              text: (
                <>
                  <strong>ไม่อนุญาต</strong> ให้เสิร์ฟลูกหลังด้วยท่าแบ็คแฮนด์
                  (Backhand) ในทุกกรณี
                </>
              ),
            },
          ],
        },
        r3: {
          title: "ข้อ 3: การตรงต่อเวลา",
          list: [
            <>
              นักกีฬาควรมาถึงสนามล่วงหน้าอย่างน้อย{" "}
              <span className="font-semibold text-slate-800">30 นาที</span>
            </>,
            <>
              หากถูกเรียกชื่อแล้วไม่มาปรากฏตัวภายใน{" "}
              <span className="font-semibold text-red-600">5 นาที</span>{" "}
              จะถูกปรับเป็นแพ้บาย (Walkover) ทันที
            </>,
            "อนุญาตให้วอร์มอัพในสนามได้ไม่เกิน 2 นาที",
          ],
        },
        r4: {
          title: "ข้อ 4: ข้อกำหนดการสมัคร",
          list: [
            "นักกีฬา 1 ท่าน ลงสมัครแข่งขันได้ไม่เกิน 2 ประเภท",
            "หากลงแข่ง 2 ประเภทและมีแมตช์ต่อเนื่อง พักได้ไม่เกิน 5 นาที",
            "ฝ่ายจัดฯ ขอสงวนสิทธิ์แก้ไขสายการแข่งขันหากข้อมูลผิดพลาด โดยพิจารณาเป็นรายกรณี",
          ],
        },
        r5: {
          title: "ข้อ 5: รูปแบบและการนับคะแนน",
          groupTitle: "5.1 รอบแบ่งกลุ่ม (Round Robin)",
          groupConfig: "🏸 1 เกม 21 แต้ม",
          noDeuce: "(ไม่มีดิวส์)",
          points: { win: "ชนะ", draw: "เสมอ", lose: "แพ้" },
          byeTitle: "👻 กรณีเจอ Team Bye (ทีมไม่ครบ)",
          byeDesc: (
            <>
              ถือว่าผู้ที่เจอทีมบาย <strong>ชนะผ่าน</strong> ทันที <br />
              <span className="text-blue-600/80">
                📝 บันทึกสกอร์เป็น <strong>21-11, 21-11</strong> (ได้รับ 3
                คะแนน)
              </span>
            </>
          ),
          criteria:
            "ลำดับการวัดผล: คะแนนรวม ➔ ผลต่างเซ็ต ➔ ผลต่างแต้ม ➔ แต้มได้ ➔ H2H ➔ จับฉลาก",
          koTitle: "5.2 การเข้ารอบ Knockout",
          brackets: [
            {
              label: "Grand",
              sub: "32 ทีม (8 กลุ่ม)",
              top: "ที่ 1, 2",
              bot: "ที่ 3, 4",
            },
            {
              label: "Special",
              sub: "24 ทีม (6 กลุ่ม)",
              top: "ที่ 1, 2 + Best 3rd",
              bot: "ที่ 3 เหลือ + ที่ 4",
            },
            {
              label: "Standard",
              sub: "16 ทีม (4 กลุ่ม)",
              top: "ที่ 1, 2",
              bot: "ที่ 3, 4",
            },
            {
              label: "Mini",
              sub: "8 ทีม (2 กลุ่ม)",
              top: "เข้ารอบทั้งหมด",
              bot: "-",
            },
          ],
          koRulesTitle: "5.3 & 5.4 กติการอบน็อคเอาท์",
          koRules: [
            <>
              <strong>สายบน:</strong> ใช้ระบบทีมวาง (Seeding) แยกสายตามผลงาน
            </>,
            <>
              <strong>สายล่าง:</strong> จับสลากประกบคู่ใหม่ (Random Draw)
            </>,
            <>
              <strong>Format:</strong> ชนะ 2 ใน 3 เกม (Best of 3)
            </>,
            <>
              <strong>Deuce:</strong> มีดิวส์ (20-20 ต้องห่าง 2 แต้ม, ตันที่ 30)
            </>,
          ],
        },
        r6: {
          title: "ข้อ 6: ยอมแพ้ / แพ้บาย / บาดเจ็บ",
          noShowTitle: "❌ No Show (ไม่มาแข่ง)",
          noShowDesc: (
            <>
              <span className="font-semibold text-rose-800">ปรับแพ้ 0-21</span>{" "}
              (ต่างจาก Team Bye)
            </>
          ),
          injuryTitle: "🩹 บาดเจ็บ",
          injuryDesc:
            "หากแข่งต่อไม่ได้ ถือว่ายอมแพ้ (Retired) ผลรอบแบ่งกลุ่มถือเป็นโมฆะ",
          timeoutTitle: "⏱️ เวลานอก",
          timeoutDesc: "ขอปฐมพยาบาลได้ 1 ครั้ง (ไม่เกิน 10 นาที)",
        },
        r7: {
          title: "ข้อ 7: การตรวจสอบมือ",
          desc: (
            <>
              เทียบฟอร์มการเล่นจริงกับ <strong>Moodeng Cup Model</strong>{" "}
              และคลิปประเมินตนเอง (ป้องกัน Sandbagging / Over Model)
            </>
          ),
          voteTitle: "🗳️ เกณฑ์การตัดสิน (Voting & Penalty)",
          voteCards: [
            {
              count: "3 เสียง",
              title: "เอกฉันท์",
              action: "Disqualified (ตัดสิทธิ์ / ไม่คืนเงิน)",
            },
            {
              count: "2 เสียง",
              title: "เสียงข้างมาก",
              action: "Forfeit (ปรับแพ้เฉพาะนัดนั้น 0-21)",
            },
            {
              count: "0-1 เสียง",
              title: "เสียงไม่ถึงเกณฑ์",
              action: "ไม่ผิดกติกา (ยึดสกอร์จริง)",
            },
          ],
          note: "*ตัดสินโดยคณะกรรมการกลาง 3 ท่าน",
        },
        r8: {
          title: "ข้อ 8: การประท้วง (Protest)",
          evidenceTitle: "หลักฐานสำคัญ",
          evidenceDesc: '"ต้องบันทึกวิดีโอด้วยตนเอง เพื่อใช้เป็นหลักฐาน"',
          warning: "ห้ามประท้วงปากเปล่า",
          list: [
            <>
              แจ้งกองอำนวยการ <strong>ทันที</strong> ที่จบเกมหรือช่วงพักเกม
            </>,
            "คณะกรรมการกลางจะพิจารณาคลิปตามเกณฑ์ข้อ 7",
            "ผลโหวตถือเป็นที่สิ้นสุด (Final Decision)",
          ],
        },
      },
    },
    en: {
      updated: "Updated: Jan 2026",
      mainTitle: "Tournament Rules",
      subTitle: "Moodeng Cup Official Rules",
      sections: {
        r1: {
          title: "Rule 1: General Regulations",
          list: [
            <>
              Competition follows{" "}
              <span className="font-semibold text-slate-800">BWF Rules</span>,
              except where specified otherwise.
            </>,
            "The committee reserves the right to amend rules. Committee decisions are final.",
          ],
        },
        r2: {
          title: "Rule 2: Serving Regulations",
          sub1: "2.1 Level S",
          desc1: "Standard BWF serving rules apply.",
          // ✅ ปรับแก้: เพิ่มเว้นวรรค
          sub2: "2.2 Level Baby, BG-, N, BG(men/mixs), Single(NB/N)",
          warningTitle: "⚠️ Important Restriction",
          // ✅ ปรับแก้: โครงสร้างข้อมูลแบบแยก Icon/Text
          warningList: [
            {
              icon: "✅",
              text: (
                <>
                  Serve must be performed with{" "}
                  <span className="font-semibold text-amber-900 underline decoration-amber-300 decoration-2 underline-offset-2">
                    Forehand
                  </span>{" "}
                  motion only.
                </>
              ),
            },
            {
              icon: "🚫",
              text: (
                <>
                  <strong>Backhand Serve</strong> is strictly prohibited in
                  these categories.
                </>
              ),
            },
          ],
        },
        r3: {
          title: "Rule 3: Punctuality",
          list: [
            <>
              Athletes should arrive at least{" "}
              <span className="font-semibold text-slate-800">30 minutes</span>{" "}
              before schedule.
            </>,
            <>
              Failure to appear within{" "}
              <span className="font-semibold text-red-600">5 minutes</span>{" "}
              after being called results in a <strong>Walkover</strong>.
            </>,
            "Warm-up on court is limited to 2 minutes.",
          ],
        },
        r4: {
          title: "Rule 4: Registration",
          list: [
            "Athletes may register for a maximum of 2 categories.",
            "Maximum 5 minutes rest allowed between consecutive matches.",
            "The committee reserves the right to adjust the draw in case of errors.",
          ],
        },
        r5: {
          title: "Rule 5: Format & Scoring",
          groupTitle: "5.1 Group Stage (Round Robin)",
          groupConfig: "🏸 1 Game to 21",
          noDeuce: "(No Deuce)",
          points: { win: "Win", draw: "Draw", lose: "Lose" },
          byeTitle: "👻 Team Bye Scenario",
          byeDesc: (
            <>
              Opponent receives an immediate <strong>Walkover Win</strong>.
              <br />
              <span className="text-blue-600/80">
                📝 Recorded score: <strong>21-11, 21-11</strong> (3 Points
                awarded).
              </span>
            </>
          ),
          criteria:
            "Ranking: Points ➔ Set Diff ➔ Score Diff ➔ Score For ➔ H2H ➔ Draw",
          koTitle: "5.2 Knockout Qualification",
          brackets: [
            {
              label: "Grand",
              sub: "32 Teams (8 Groups)",
              top: "1st & 2nd",
              bot: "3rd & 4th",
            },
            {
              label: "Special",
              sub: "24 Teams (6 Groups)",
              top: "1st, 2nd + Best 3rd",
              bot: "Remaining 3rd + 4th",
            },
            {
              label: "Standard",
              sub: "16 Teams (4 Groups)",
              top: "1st & 2nd",
              bot: "3rd & 4th",
            },
            {
              label: "Mini",
              sub: "8 Teams (2 Groups)",
              top: "All Qualify",
              bot: "-",
            },
          ],
          koRulesTitle: "5.3 & 5.4 Knockout Rules",
          koRules: [
            <>
              <strong>Upper Bracket:</strong> Seeding based on group
              performance.
            </>,
            <>
              <strong>Lower Bracket:</strong> Random Open Draw.
            </>,
            <>
              <strong>Format:</strong> Best of 3 Games.
            </>,
            <>
              <strong>Deuce:</strong> Deuce allowed (Max 30 points).
            </>,
          ],
        },
        r6: {
          title: "Rule 6: Walkover / Injury",
          noShowTitle: "❌ No Show",
          noShowDesc: (
            <>
              <span className="font-semibold text-rose-800">Forfeit 0-21</span>{" "}
              (Different from Team Bye)
            </>
          ),
          injuryTitle: "🩹 Injury",
          injuryDesc:
            "If unable to continue = Retired. Group results become Void.",
          timeoutTitle: "⏱️ Medical Timeout",
          timeoutDesc: "Allowed once per match (Max 10 mins).",
        },
        r7: {
          title: "Rule 7: Skill Verification",
          desc: (
            <>
              Verified against <strong>Moodeng Cup Model</strong> & Self-Eval
              video (Anti-Sandbagging / Over Model).
            </>
          ),
          voteTitle: "🗳️ Committee Voting & Penalty",
          voteCards: [
            {
              count: "3 Votes",
              title: "Unanimous",
              action: "Disqualified (No Refund)",
            },
            {
              count: "2 Votes",
              title: "Majority",
              action: "Forfeit Match (0-21 / Can play next)",
            },
            {
              count: "0-1 Vote",
              title: "Insufficient",
              action: "Clean (Score stands)",
            },
          ],
          note: "*Decision by 3 Central Committee members.",
        },
        r8: {
          title: "Rule 8: Protest",
          evidenceTitle: "Required Evidence",
          evidenceDesc: '"You MUST record video yourself as evidence."',
          warning: "Verbal protests are NOT accepted.",
          list: [
            <>
              Report to HQ <strong>IMMEDIATELY</strong> after match/interval.
            </>,
            "Committee will review based on Rule 7 criteria.",
            "Voting result is Final.",
          ],
        },
      },
    },
  };

  const t = content[lang];
  const s = t.sections;

  return (
    <div className="pb-24 max-w-3xl mx-auto px-4 md:px-6">
      {/* --- Language Switcher --- */}
      <div className="flex justify-end pt-4 mb-2">
        <div className="bg-slate-100 p-1 rounded-full inline-flex relative">
          <button
            onClick={() => setLang("th")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              lang === "th"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🇹🇭 ไทย
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              lang === "en"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🇬🇧 ENG
          </button>
        </div>
      </div>

      {/* Header Page */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] md:text-xs font-semibold mb-3 tracking-wide border border-indigo-100">
          <span>📅</span> {t.updated}
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2 tracking-tight">
          {t.mainTitle}
        </h1>
        <p className="text-slate-500 text-sm md:text-base font-normal">
          {t.subTitle}
        </p>
      </div>

      {/* ข้อ 1 */}
      <RuleSection title={s.r1.title} icon="⚖️">
        <ul className="list-disc pl-5 space-y-3 marker:text-indigo-300">
          {s.r1.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </RuleSection>

      {/* ข้อ 2 */}
      <RuleSection title={s.r2.title} icon="🏸">
        <div className="space-y-5">
          <div>
            <span className="font-semibold text-indigo-700 block mb-1 text-base">
              {s.r2.sub1}
            </span>
            <p className="text-slate-600">{s.r2.desc1}</p>
          </div>
          <div>
            {/* ✅ ปรับ: ใช้ break-words เพื่อป้องกันชื่อรุ่นยาวๆ ดัน Layout พัง */}
            <span className="font-semibold text-indigo-700 block mb-2 text-base break-words">
              {s.r2.sub2}
            </span>
            <HighlightBox type="warning" title={s.r2.warningTitle}>
              <ul className="space-y-2 list-none">
                {/* ✅ ปรับ: Render แบบแยก Icon (flex-shrink-0) กับ Text (flex-1) */}
                {s.r2.warningList.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <span className="flex-1 leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </HighlightBox>
          </div>
        </div>
      </RuleSection>

      {/* ข้อ 3 */}
      <RuleSection title={s.r3.title} icon="⏱️">
        <ul className="list-disc pl-5 space-y-3 marker:text-indigo-300">
          {s.r3.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </RuleSection>

      {/* ข้อ 4 */}
      <RuleSection title={s.r4.title} icon="📝">
        <ul className="list-disc pl-5 space-y-3 marker:text-indigo-300">
          {s.r4.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </RuleSection>

      {/* ข้อ 5 */}
      <RuleSection title={s.r5.title} icon="📊">
        {/* 5.1 Group Stage */}
        <div className="mb-8">
          <h4 className="font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg inline-block mb-4 border border-slate-100">
            {s.r5.groupTitle}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="bg-white px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 shadow-sm">
                {s.r5.groupConfig}
              </span>
              <span className="text-slate-400 text-xs font-light">
                {s.r5.noDeuce}
              </span>
            </div>

            {/* Points Badge */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium">
              <div className="bg-emerald-50 text-emerald-700 py-2 rounded-lg border border-emerald-100">
                {s.r5.points.win} <br />{" "}
                <span className="text-lg font-bold">3</span> Pts
              </div>
              <div className="bg-amber-50 text-amber-700 py-2 rounded-lg border border-amber-100">
                {s.r5.points.draw} <br />{" "}
                <span className="text-lg font-bold">1</span> Pt
              </div>
              <div className="bg-rose-50 text-rose-700 py-2 rounded-lg border border-rose-100">
                {s.r5.points.lose} <br />{" "}
                <span className="text-lg font-bold">0</span> Pt
              </div>
            </div>

            {/* Team Bye Logic */}
            <HighlightBox type="info" title={s.r5.byeTitle}>
              <div className="flex flex-col gap-1 text-sm">{s.r5.byeDesc}</div>
            </HighlightBox>

            <div className="bg-gray-50/50 p-4 rounded-xl text-sm border border-dashed border-gray-300 text-gray-500">
              <strong className="text-gray-700">Criteria:</strong>{" "}
              {s.r5.criteria}
            </div>
          </div>
        </div>

        {/* 5.2 Knockout Classification */}
        <div className="mb-8">
          <h4 className="font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg inline-block mb-4 border border-slate-100">
            {s.r5.koTitle}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {s.r5.brackets.map((item, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-4 relative ${
                  idx === 1
                    ? "bg-yellow-50/50 border-yellow-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="absolute top-3 right-3 text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                  {item.label}
                </div>
                <strong className="block text-base text-slate-800 mb-2">
                  {item.sub}
                </strong>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-1.5 py-0.5 rounded">
                      Upper
                    </span>
                    <span className="text-right">{item.top}</span>
                  </div>
                  {item.bot !== "-" && (
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 font-medium text-xs bg-amber-50 px-1.5 py-0.5 rounded">
                        Lower
                      </span>
                      <span className="text-right">{item.bot}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5.3 & 5.4 Knockout Rules */}
        <div>
          <h4 className="font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg inline-block mb-4 border border-slate-100">
            {s.r5.koRulesTitle}
          </h4>
          <ul className="space-y-2 text-sm md:text-base">
            {s.r5.koRules.map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </RuleSection>

      {/* ข้อ 6 */}
      <RuleSection title={s.r6.title} icon="🚑">
        <div className="space-y-4">
          <HighlightBox type="danger" title={s.r6.noShowTitle}>
            {s.r6.noShowDesc}
          </HighlightBox>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-700 block mb-1 text-sm">
                {s.r6.injuryTitle}
              </strong>
              <span className="text-xs text-slate-500">{s.r6.injuryDesc}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-700 block mb-1 text-sm">
                {s.r6.timeoutTitle}
              </strong>
              <span className="text-xs text-slate-500">{s.r6.timeoutDesc}</span>
            </div>
          </div>
        </div>
      </RuleSection>

      {/* ข้อ 7 */}
      <RuleSection title={s.r7.title} icon="🕵️‍♂️" id="skill-verify">
        <p className="mb-4 text-slate-600">{s.r7.desc}</p>

        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200">
          <h4 className="font-semibold text-center text-slate-700 mb-4 text-sm bg-white inline-block px-4 py-1 rounded-full border border-slate-100 shadow-sm mx-auto block w-fit">
            {s.r7.voteTitle}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <VoteCard {...s.r7.voteCards[0]} color="red" />
            <VoteCard {...s.r7.voteCards[1]} color="orange" />
            <VoteCard {...s.r7.voteCards[2]} color="green" />
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-light">
            {s.r7.note}
          </p>
        </div>
      </RuleSection>

      {/* ข้อ 8 */}
      <RuleSection title={s.r8.title} icon="📹">
        <div className="flex flex-col md:flex-row gap-5 items-center">
          <div className="w-full md:w-1/3 bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center shrink-0">
            <span className="text-3xl block mb-2">🎥</span>
            <h4 className="font-bold text-indigo-900 text-sm mb-1">
              {s.r8.evidenceTitle}
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed mb-2">
              {s.r8.evidenceDesc}
            </p>
            <span className="inline-block bg-white text-[10px] text-indigo-400 px-2 py-0.5 rounded border border-indigo-100">
              {s.r8.warning}
            </span>
          </div>

          <ul className="w-full space-y-3 list-decimal pl-5 text-sm marker:text-slate-400 marker:font-light">
            {s.r8.list.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </RuleSection>

      <div className="h-12 text-center">
        <p className="text-[10px] text-slate-300">© 2026 Moodeng Cup System</p>
      </div>
    </div>
  );
}
