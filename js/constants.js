/**
 * 연금/절세/노후자금 종합 포털 - 핵심 상수 관리
 * 매년 세법/요율 변경 시 이 파일만 수정하면 전체 반영
 * 기준: 2025-2026년
 */

const CONSTANTS = {
  // ============================================
  // 국민연금
  // ============================================
  NATIONAL_PENSION: {
    A_VALUE: 3089062,              // 2025년 A값 (전체 가입자 평균소득월액)
    RATE: 0.09,                     // 보험료율 9%
    INCOME_UPPER: 6370000,          // 기준소득월액 상한
    INCOME_LOWER: 390000,           // 기준소득월액 하한
    FULL_PENSION_YEARS: 20,         // 완전노령연금 최소 가입기간
    MIN_PENSION_YEARS: 10,          // 최소 수급 자격 가입기간
    MAX_PENSION_YEARS: 40,          // 최대 가입기간

    // 급여산식 계수 (소득대체율)
    // 1988~1998: 70%, 1999~2007: 60%, 2008~ 매년 0.5%p 감소
    // 2025년 기준 약 43%→ 2026년 42.5%
    REPLACEMENT_RATE_2025: 0.43,
    REPLACEMENT_RATE_2026: 0.425,
    REPLACEMENT_RATE_YEARLY_DECREASE: 0.005,

    // 조기수령 감액률 (연 6%, 월 0.5%)
    EARLY_REDUCTION_YEARLY: 0.06,
    EARLY_REDUCTION_MONTHLY: 0.005,
    EARLY_MAX_YEARS: 5,             // 최대 5년 조기수령

    // 연기수령 증액률 (연 7.2%, 월 0.6%)
    DEFER_INCREASE_YEARLY: 0.072,
    DEFER_INCREASE_MONTHLY: 0.006,
    DEFER_MAX_YEARS: 5,             // 최대 5년 연기

    // 수령 개시 연령 (출생연도별)
    START_AGE: {
      DEFAULT: 65,                  // 1969년 이후 출생
      '1953_1956': 61,
      '1957_1960': 62,
      '1961_1964': 63,
      '1965_1968': 64,
    },

    // 물가상승률 반영 (평균)
    CPI_ADJUSTMENT: 0.023,          // 2025년 2.3% 인상
  },

  // ============================================
  // 퇴직연금 (DB/DC/IRP)
  // ============================================
  RETIREMENT_PENSION: {
    // DB형: 퇴직금 = 평균임금 × 근속연수
    // DC형: 적립금 + 운용수익

    IRP_TAX_CREDIT_LIMIT: 9000000,  // IRP+연금저축 세액공제 합산 한도 900만원
    PENSION_SAVING_LIMIT: 6000000,  // 연금저축 세액공제 한도 600만원
    IRP_ONLY_LIMIT: 3000000,        // IRP 추가 한도 300만원

    // 세액공제율
    TAX_CREDIT_RATE_UNDER_5500: 0.165,  // 총급여 5,500만원 이하: 16.5%
    TAX_CREDIT_RATE_OVER_5500: 0.132,   // 총급여 5,500만원 초과: 13.2%
    SALARY_THRESHOLD: 55000000,          // 세액공제율 구분 기준

    // 연금 수령 시 세율 (연금소득세)
    PENSION_TAX_UNDER_70: 0.055,    // 70세 미만: 5.5%
    PENSION_TAX_70_79: 0.044,       // 70~79세: 4.4%
    PENSION_TAX_80_OVER: 0.033,     // 80세 이상: 3.3%

    // 퇴직소득세 관련
    RETIREMENT_INCOME_DEDUCTION: {
      // 근속연수 공제
      UNDER_5: { BASE: 1000000, RATE: 0 },       // 5년 이하: 100만원×근속연수
      UNDER_10: { BASE: 5000000, ADD: 2000000 },  // 5~10년: 500만 + 200만×(근속-5)
      UNDER_20: { BASE: 15000000, ADD: 2500000 }, // 10~20년: 1500만 + 250만×(근속-10)
      OVER_20: { BASE: 40000000, ADD: 3000000 },  // 20년 초과: 4000만 + 300만×(근속-20)
    },

    // 환산급여 공제 (환산급여 구간별)
    CONVERTED_INCOME_DEDUCTION: [
      { limit: 8000000, rate: 1.0, base: 0 },
      { limit: 70000000, rate: 0.6, base: 8000000 },
      { limit: 100000000, rate: 0.55, base: 45200000 },
      { limit: 300000000, rate: 0.45, base: 61700000 },
      { limit: Infinity, rate: 0.35, base: 151700000 },
    ],
  },

  // ============================================
  // 개인연금/연금저축
  // ============================================
  PERSONAL_PENSION: {
    ANNUAL_LIMIT: 18000000,         // 연금저축+IRP 연간 납입한도 1,800만원
    TAX_CREDIT_LIMIT: 6000000,      // 연금저축 세액공제 한도 600만원
    ISA_TRANSFER_EXTRA: 3000000,    // ISA→연금전환 추가 세액공제 300만원
    ISA_MIN_HOLDING: 3,             // ISA 최소 유지기간 3년

    // 중도해지 시 기타소득세
    EARLY_WITHDRAWAL_TAX: 0.165,    // 16.5%

    // 연금수령한도 (연금수령연차에 따라)
    ANNUAL_WITHDRAWAL_DIVISOR: {
      1: 11, 2: 11, 3: 11, 4: 11, 5: 11,
      6: 9, 7: 9, 8: 9, 9: 9, 10: 9,
      11: 3,  // 11년차 이후
    },
  },

  // ============================================
  // 절세/세금
  // ============================================
  TAX: {
    // 종합소득세 누진세율 (8단계, 2025년 기준)
    INCOME_TAX_BRACKETS: [
      { limit: 14000000, rate: 0.06, deduction: 0 },
      { limit: 50000000, rate: 0.15, deduction: 1260000 },
      { limit: 88000000, rate: 0.24, deduction: 5760000 },
      { limit: 150000000, rate: 0.35, deduction: 15440000 },
      { limit: 300000000, rate: 0.38, deduction: 19940000 },
      { limit: 500000000, rate: 0.40, deduction: 25940000 },
      { limit: 1000000000, rate: 0.42, deduction: 35940000 },
      { limit: Infinity, rate: 0.45, deduction: 65940000 },
    ],

    // 지방소득세
    LOCAL_TAX_RATE: 0.1,            // 소득세의 10%

    // 사적연금 분리과세 기준
    PRIVATE_PENSION_SEPARATE_LIMIT: 15000000,  // 1,500만원

    // 사적연금 분리과세율 (2025~)
    PRIVATE_PENSION_SEPARATE_RATE_UNDER_15M: 0.038,  // 1,500만원 이하 시 3.3~5.5% (나이별)
    PRIVATE_PENSION_SEPARATE_RATE_OVER_15M: 0.15,    // 1,500만원 초과 시 15% 분리과세 선택 가능

    // 기본공제
    BASIC_DEDUCTION: 1500000,       // 인적공제 기본 150만원
    STANDARD_DEDUCTION: 70000000,   // 근로소득공제 (참고용)

    // 연금소득공제
    PENSION_INCOME_DEDUCTION: [
      { limit: 3500000, rate: 1.0, base: 0 },
      { limit: 7000000, rate: 0.4, base: 3500000 },
      { limit: 14000000, rate: 0.2, base: 4900000 },
      { limit: Infinity, rate: 0.1, base: 6300000 },
    ],
    PENSION_DEDUCTION_MAX: 9000000,  // 연금소득공제 최대 900만원
  },

  // ============================================
  // 건강보험료
  // ============================================
  HEALTH_INSURANCE: {
    // 2026년 기준
    RATE: 0.0719,                   // 건강보험료율 7.19%
    LONG_TERM_CARE_RATE: 0.1295,    // 장기요양보험료율 12.95% (건보료의)
    HALF_RATE: 0.03595,             // 직장가입자 본인부담 절반

    // 지역가입자 부과요소
    REGIONAL: {
      BASIC_DEDUCTION: 10000,         // 기본공제 1억원 (만원 단위, 2024.02~)
      // 재산등급별 점수 (60등급, 2022.09 부과체계 개편 이후, 기본공제 차감 후 금액 기준)
      // limit: 등급 상한 (만원), score: 해당 등급 점수
      PROPERTY_GRADE: [
        { limit: 0,       score: 0 },
        { limit: 450,     score: 22 },
        { limit: 900,     score: 44 },
        { limit: 1350,    score: 66 },
        { limit: 1800,    score: 97 },
        { limit: 2250,    score: 122 },
        { limit: 2700,    score: 146 },
        { limit: 3150,    score: 171 },
        { limit: 3600,    score: 195 },
        { limit: 4050,    score: 219 },
        { limit: 4500,    score: 244 },
        { limit: 5020,    score: 268 },
        { limit: 5590,    score: 294 },
        { limit: 6220,    score: 320 },
        { limit: 6930,    score: 344 },
        { limit: 7710,    score: 365 },
        { limit: 8590,    score: 386 },
        { limit: 9570,    score: 412 },
        { limit: 10700,   score: 439 },
        { limit: 11900,   score: 465 },
        { limit: 13300,   score: 490 },
        { limit: 14800,   score: 516 },
        { limit: 16400,   score: 535 },
        { limit: 18300,   score: 559 },
        { limit: 20400,   score: 586 },
        { limit: 22700,   score: 611 },
        { limit: 25300,   score: 637 },
        { limit: 28100,   score: 659 },
        { limit: 31300,   score: 681 },
        { limit: 34900,   score: 706 },
        { limit: 38800,   score: 731 },
        { limit: 43200,   score: 757 },
        { limit: 48100,   score: 785 },
        { limit: 53600,   score: 812 },
        { limit: 59700,   score: 841 },
        { limit: 66500,   score: 881 },
        { limit: 74000,   score: 921 },
        { limit: 82400,   score: 961 },
        { limit: 91800,   score: 1001 },
        { limit: 103000,  score: 1041 },
        { limit: 114000,  score: 1091 },
        { limit: 127000,  score: 1141 },
        { limit: 142000,  score: 1191 },
        { limit: 158000,  score: 1241 },
        { limit: 176000,  score: 1291 },
        { limit: 196000,  score: 1341 },
        { limit: 218000,  score: 1391 },
        { limit: 242000,  score: 1451 },
        { limit: 270000,  score: 1511 },
        { limit: 300000,  score: 1571 },
        { limit: 330000,  score: 1641 },
        { limit: 363000,  score: 1711 },
        { limit: 399300,  score: 1781 },
        { limit: 439230,  score: 1851 },
        { limit: 483153,  score: 1921 },
        { limit: 531468,  score: 1991 },
        { limit: 584615,  score: 2061 },
        { limit: 643077,  score: 2131 },
        { limit: 707385,  score: 2201 },
        { limit: 778124,  score: 2271 },
        { limit: Infinity, score: 2341 },
      ],
      POINT_VALUE: 208.4,            // 1점당 금액 (2025년 기준, 2026년 211.5원)
      CAR_SCORE: {
        // 자동차 배기량/가액별 점수 (간소화)
        UNDER_1600: 0,               // 1600cc 미만/4천만 미만 면제
        OVER_1600_UNDER_3000: 18,
        OVER_3000: 27,
      },
    },

    // 피부양자 자격 요건
    DEPENDENT: {
      INCOME_LIMIT: 20000000,       // 소득 2,000만원 이하
      PROPERTY_TAX_LIMIT: 540000000, // 재산세 과표 5.4억 이하 (9억 초과 시 소득 1천만원)
      PROPERTY_HIGH: 900000000,      // 재산 9억 초과 시 소득요건 강화
      INCOME_LIMIT_HIGH_PROPERTY: 10000000, // 재산 9억 초과 시 소득 1,000만원 이하
    },

    // 임의계속가입
    VOLUNTARY_EXTENSION: {
      MAX_YEARS: 3,                 // 최대 3년
      RATE: 0.0719,                 // 동일 보험료율 적용
    },
  },

  // ============================================
  // 노후자금 설계
  // ============================================
  RETIREMENT_FUND: {
    DEFAULT_INFLATION: 0.025,       // 기본 물가상승률 2.5%
    DEFAULT_RETURN_RATE: 0.04,      // 기본 투자수익률 4%
    DEFAULT_LIFE_EXPECTANCY: 90,    // 기대수명 90세
    MALE_LIFE_EXPECTANCY: 80.6,     // 남성 기대수명
    FEMALE_LIFE_EXPECTANCY: 86.6,   // 여성 기대수명
    COUPLE_SURVIVAL_AGE: 95,        // 부부 중 1명 생존 연령

    // 월 생활비 참고 (2025년 기준, 한국보건사회연구원)
    MONTHLY_LIVING_COST: {
      INDIVIDUAL_MIN: 1310000,      // 개인 최소 131만원
      INDIVIDUAL_ADEQUATE: 1930000, // 개인 적정 193만원
      COUPLE_MIN: 1980000,          // 부부 최소 198만원
      COUPLE_ADEQUATE: 2940000,     // 부부 적정 294만원
    },

    // 의료비 추가 (연간)
    ANNUAL_MEDICAL_COST: {
      AGE_60_69: 2400000,           // 60대 240만원
      AGE_70_79: 3600000,           // 70대 360만원
      AGE_80_PLUS: 4800000,         // 80대+ 480만원
    },
  },

  // ============================================
  // 공통
  // ============================================
  COMMON: {
    CURRENT_YEAR: 2026,
    DATA_YEAR: '2025-2026',         // 적용 기준 연도
    LAST_UPDATED: '2026-02-22',     // 마지막 업데이트
  },
};

// 모듈 내보내기 방지 (브라우저 전역 사용)
if (typeof window !== 'undefined') {
  window.CONSTANTS = CONSTANTS;
}
