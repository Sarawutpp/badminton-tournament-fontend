// src/pages/public/RulesPage.jsx
import React, { useState } from "react";

// --- Components ย่อย (Design Layout) ---

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

const VoteCard = ({ count, title, description, color }) => {
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
      <div className="text-[11px] md:text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
        {title}
      </div>
      <div className="text-xs md:text-sm font-medium mt-auto leading-snug opacity-90 whitespace-pre-line">
        {description}
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
          sub2: "2.2 รุ่น Baby, BG-, N, BG(men/mixs), Single(NB/N)",
          warningTitle: "⚠️ ข้อห้ามสำคัญ",
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
          title: "ข้อ 7: การตรวจสอบมือ (Skill Level Verification)",
          sub71: "7.1 เกณฑ์การตัดสิน",
          desc71:
            "การพิจารณาความสามารถของนักกีฬาจะยึดตามมาตรฐานกลางของรายการ (Moodeng Cup Model) เป็นหลัก เพื่อให้เกิดความยุติธรรมสูงสุด",
          sub72: "7.2 กระบวนการตรวจสอบ",
          desc72_intro:
            "คณะกรรมการจะนำ คลิปวิดีโอเหตุการณ์จริง (จากทีมงานหรือผู้ประท้วง) มาทำการตรวจสอบเปรียบเทียบใน 2 ประเด็นหลัก คือ",
          desc72_list: [
            {
              head: "เปรียบเทียบกับคลิปประเมินตนเอง (Vs. Self-Evaluation):",
              text: "เพื่อตรวจสอบว่าฟอร์มการเล่นแตกต่างจากตอนส่งคลิปอย่างสิ้นเชิง ราวกับเป็นคนละคน (Sandbagging) หรือไม่",
            },
            {
              head: "เปรียบเทียบกับมาตรฐานรายการ (Vs. Model):",
              text: "เพื่อตรวจสอบว่าฝีมือการเล่นจริง เกินกว่ามาตรฐาน (Over Model) ของรุ่นที่สมัครอย่างเห็นได้ชัดหรือไม่",
            },
          ],
          sub73: "7.3 เกณฑ์การตัดสินและบทลงโทษ (Voting & Penalty)",
          voteCards: [
            {
              count: "3 ท่าน (3 เสียง)",
              title: "โหวตตรงกันหมด",
              description:
                "❌ ถือว่าผิดกติกาชัดเจน\n👉 ตัดสิทธิ์ออกจากการแข่งขัน (Disqualified) ตลอดทั้งรายการ\n(ผลโมฆะ / ไม่คืนเงิน)",
              color: "red",
            },
            {
              count: "2 ท่าน (2 เสียง)",
              title: "โหวตตรงกัน 2 ท่าน",
              description:
                "🟠 ผิดกติกาเฉพาะเหตุการณ์\n👉 ปรับแพ้แมตช์นั้น (Forfeit)\nคู่แข่งชนะ 21-0, 21-0 (ได้ 3 แต้ม)\n(ยังแข่งแมตช์ต่อไปได้)",
              color: "orange",
            },
            {
              count: "0-1 ท่าน",
              title: "เสียงไม่ถึงเกณฑ์",
              description:
                "🟢 ไม่ผิดกติกา\n👉 ให้ยึดผลการแข่งขันตามสกอร์จริงในสนาม",
              color: "green",
            },
          ],
          note: "*ตัดสินชี้ขาดโดยคณะกรรมการกลาง 3 ท่าน",
        },
        r8: {
          title: "ข้อ 8: การประท้วงและการตัดสิน (Protest)",
          sub81: "8.1 การรวบรวมหลักฐานและยื่นประท้วง",
          desc81_intro:
            "เนื่องจากรายการนี้ไม่มีกรรมการตัดสินประจำสนาม (Self-Judging) หากคู่แข่งขันมีความสงสัยในคุณสมบัติหรือฝีมือของฝ่ายตรงข้าม ท่านจะต้องปฏิบัติดังนี้:",
          desc81_list: [
            {
              head: "บันทึกหลักฐาน:",
              text: 'ผู้ประท้วงต้องทำการ "บันทึกวิดีโอ (Record Video)" การแข่งขันในแมตช์นั้นๆ ด้วยตนเอง เพื่อใช้เป็นหลักฐานยืนยัน',
            },
            {
              head: "การแจ้งเหตุ:",
              text: "ให้นำหลักฐานคลิปวิดีโอมาแจ้งต่อ กองอำนวยการ (Central Committee) ทันทีที่จบการแข่งขัน หรือในช่วงพักเกม",
            },
          ],
          warning: "ห้ามประท้วงปากเปล่าโดยไม่มีหลักฐาน",
          sub82: "8.2 กระบวนการพิจารณา",
          desc82:
            "คณะกรรมการกลางจะดำเนินการตรวจสอบตามกระบวนการใน ข้อ 7.2 โดยใช้หลักฐานวิดีโอที่ผู้ประท้วงนำส่ง",
          sub83: "8.3 คำตัดสิน",
          desc83:
            "ผลการตัดสินจะยึดตาม มติเสียงโหวตของคณะกรรมการ (ตามข้อ 7.3) ถือเป็นที่สิ้นสุด (Final Decision) และไม่สามารถโต้แย้งได้",
        },
        // --- ADDED RULE 9 ---
        r9: {
          title: "ข้อ 9: การเล่นเต็มความสามารถ (Best Effort)",
          list: [
            "นักกีฬาต้องลงแข่งขันและเล่นให้เต็มที่ในทุกแมตช์ ไม่ว่าผลแพ้-ชนะจะมีผลต่อการเข้ารอบหรือไม่",
            "ห้ามตกลงผลการแข่งขันล่วงหน้า หรือเจตนาแกล้งแพ้ (ล็อคสกอร์) เพื่อหวังผลในการเลือกสายแข่งรอบต่อไป",
          ],
          penaltyTitle: "⚠️ บทลงโทษร้ายแรง (Severe Penalty)",
          penaltyDesc: (
            <>
              หากทีมงานเห็นว่านักกีฬาเจตนาเล่นไม่เต็มที่ (เช่น ตีทิ้งขว้าง,
              ไม่รับลูก, ยืนเฉย) เพื่อเจตนาแกล้งแพ้:
              <br />
              👉{" "}
              <span className="font-bold text-rose-800">
                ปรับแพ้ในแมตช์นั้นทันที
              </span>{" "}
              +{" "}
              <span className="font-bold text-rose-800">
                ตัดสิทธิ์จากการแข่งขัน
              </span>{" "}
              (ไม่คืนเงินค่าสมัคร)
            </>
          ),
        },
      },
    },
    // English Translation
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
          sub2: "2.2 Level Baby, BG-, N, BG(men/mixs), Single(NB/N)",
          warningTitle: "⚠️ Important Restriction",
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
          sub71: "7.1 Judgment Criteria",
          desc71:
            "Skill assessment follows the Moodeng Cup Model standard to ensure maximum fairness.",
          sub72: "7.2 Verification Process",
          desc72_intro:
            "The committee will compare actual match video (from staff or protesters) against two main factors:",
          desc72_list: [
            {
              head: "Vs. Self-Evaluation:",
              text: "To check for Sandbagging (playing significantly better than the self-eval clip).",
            },
            {
              head: "Vs. Model:",
              text: "To check if the skill level clearly exceeds the category limit (Over Model).",
            },
          ],
          sub73: "7.3 Voting & Penalty",
          voteCards: [
            {
              count: "3 Votes (Unanimous)",
              title: "Clearly Violation",
              description:
                "❌ Disqualified from tournament\n(All results void / No Refund)",
              color: "red",
            },
            {
              count: "2 Votes (Majority)",
              title: "Incident Violation",
              description:
                "🟠 Forfeit Match Only\nOpponent wins 21-0, 21-0 (3 pts)\n(Can play remaining matches)",
              color: "orange",
            },
            {
              count: "0-1 Vote",
              title: "Insufficient",
              description: "🟢 Clean\nResult stands as played.",
              color: "green",
            },
          ],
          note: "*Decision by 3 Central Committee members.",
        },
        r8: {
          title: "Rule 8: Protest & Dispute Resolution",
          sub81: "8.1 Evidence & Filing",
          desc81_intro:
            "Since this is a Self-Judging tournament, if you suspect an opponent's qualification:",
          desc81_list: [
            {
              head: "Record Evidence:",
              text: 'You MUST "Record Video" of the match yourself.',
            },
            {
              head: "Report:",
              text: "Submit video to Central Committee IMMEDIATELY after match or during interval.",
            },
          ],
          warning: "Verbal protests without evidence are NOT accepted.",
          sub82: "8.2 Review Process",
          desc82:
            "Committee will review based on Rule 7.2 criteria using the submitted video.",
          sub83: "8.3 Decision",
          desc83: "Voting result is Final Decision and cannot be appealed.",
        },
        // --- ADDED RULE 9 (English) ---
        r9: {
          title: "Rule 9: Best Effort",
          list: [
            "Athletes must play to the best of their ability in every match, regardless of how the result affects qualification standing.",
            "Match-fixing or intentional losing to manipulate bracket placement is strictly prohibited.",
          ],
          penaltyTitle: "⚠️ Severe Penalty",
          penaltyDesc: (
            <>
              If the committee determines a player is intentionally throwing a
              game (e.g., clearly wasting shots, not receiving serves):
              <br />
              👉{" "}
              <span className="font-bold text-rose-800">
                Immediate Forfeit
              </span>{" "}
              +{" "}
              <span className="font-bold text-rose-800">Disqualification</span>{" "}
              (No Refund)
            </>
          ),
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
            <span className="font-semibold text-indigo-700 block mb-2 text-base break-words">
              {s.r2.sub2}
            </span>
            <HighlightBox type="warning" title={s.r2.warningTitle}>
              <ul className="space-y-2 list-none">
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

            <HighlightBox type="info" title={s.r5.byeTitle}>
              <div className="flex flex-col gap-1 text-sm">{s.r5.byeDesc}</div>
            </HighlightBox>

            <div className="bg-gray-50/50 p-4 rounded-xl text-sm border border-dashed border-gray-300 text-gray-500">
              <strong className="text-gray-700">Criteria:</strong>{" "}
              {s.r5.criteria}
            </div>
          </div>
        </div>

        {/* 5.2 Knockout */}
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

      {/* ข้อ 7 (Detailed) */}
      <RuleSection title={s.r7.title} icon="🕵️‍♂️" id="skill-verify">
        <div className="space-y-6">
          {/* 7.1 */}
          <div>
            <h4 className="font-bold text-indigo-700 border-b border-indigo-50 pb-1 mb-2">
              {s.r7.sub71}
            </h4>
            <p className="text-slate-600">{s.r7.desc71}</p>
          </div>

          {/* 7.2 */}
          <div>
            <h4 className="font-bold text-indigo-700 border-b border-indigo-50 pb-1 mb-2">
              {s.r7.sub72}
            </h4>
            <p className="mb-3 text-slate-600">{s.r7.desc72_intro}</p>
            <ul className="space-y-2">
              {s.r7.desc72_list.map((item, i) => (
                <li
                  key={i}
                  className="flex flex-col sm:flex-row gap-1 sm:gap-2"
                >
                  <strong className="text-slate-800 whitespace-nowrap">
                    • {item.head}
                  </strong>
                  <span className="text-slate-600">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 7.3 */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200">
            <h4 className="font-bold text-center text-slate-700 mb-4 text-sm bg-white inline-block px-4 py-1 rounded-full border border-slate-100 shadow-sm mx-auto block w-fit">
              {s.r7.sub73}
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
        </div>
      </RuleSection>

      {/* ข้อ 8 (Detailed) */}
      <RuleSection title={s.r8.title} icon="📹">
        <div className="space-y-6">
          {/* 8.1 */}
          <div>
            <h4 className="font-bold text-indigo-700 border-b border-indigo-50 pb-1 mb-2">
              {s.r8.sub81}
            </h4>
            <p className="mb-3 text-slate-600">{s.r8.desc81_intro}</p>
            <ul className="space-y-3 mb-3 pl-2">
              {s.r8.desc81_list.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="bg-indigo-50 text-indigo-600 font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <strong className="block text-slate-800 text-sm">
                      {item.head}
                    </strong>
                    <span className="text-slate-600 text-sm">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-rose-50 border border-rose-100 text-rose-800 px-3 py-2 rounded-lg text-xs font-semibold text-center">
              ⚠️ {s.r8.warning}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 8.2 */}
            <div>
              <h4 className="font-bold text-indigo-700 border-b border-indigo-50 pb-1 mb-2">
                {s.r8.sub82}
              </h4>
              <p className="text-slate-600 text-sm">{s.r8.desc82}</p>
            </div>
            {/* 8.3 */}
            <div>
              <h4 className="font-bold text-indigo-700 border-b border-indigo-50 pb-1 mb-2">
                {s.r8.sub83}
              </h4>
              <p className="text-slate-600 text-sm">{s.r8.desc83}</p>
            </div>
          </div>
        </div>
      </RuleSection>

      {/* --- ข้อ 9 (ADDED NEW SECTION) --- */}
      <RuleSection title={s.r9.title} icon="💪">
        <ul className="list-disc pl-5 space-y-3 marker:text-indigo-300">
          {s.r9.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <div className="mt-4">
          <HighlightBox type="danger" title={s.r9.penaltyTitle}>
            {s.r9.penaltyDesc}
          </HighlightBox>
        </div>
      </RuleSection>

      <div className="h-12 text-center">
        <p className="text-[10px] text-slate-300">© 2026 Moodeng Cup System</p>
      </div>
    </div>
  );
}
