/**
 * 공통 계산 엔진 - 연금/세금/보험료 계산 로직
 */

const CalcEngine = {
  // ============================================
  // 국민연금 계산
  // ============================================
  nationalPension: {
    /**
     * 국민연금 수령 개시 연령 반환
     * @param {number} birthYear - 출생연도
     * @returns {number} 수령 개시 연령
     */
    getStartAge(birthYear) {
      const ages = CONSTANTS.NATIONAL_PENSION.START_AGE;
      if (birthYear <= 1952) return 60;
      if (birthYear <= 1956) return ages['1953_1956'];
      if (birthYear <= 1960) return ages['1957_1960'];
      if (birthYear <= 1964) return ages['1961_1964'];
      if (birthYear <= 1968) return ages['1965_1968'];
      return ages.DEFAULT;
    },

    /**
     * 국민연금 예상 월 수령액 (기본연금액)
     * 기본연금액 = 소득대체율 × (A값 + B값) × (1 + 0.05×(n-20))
     * n: 가입기간(년), A: 전체 평균소득, B: 본인 평균소득
     *
     * @param {number} avgMonthlyIncome - 본인 가입기간 평균 기준소득월액 (B값)
     * @param {number} enrollmentMonths - 총 가입기간 (개월)
     * @returns {number} 월 예상 수령액
     */
    calcBasicPension(avgMonthlyIncome, enrollmentMonths) {
      const NP = CONSTANTS.NATIONAL_PENSION;
      const A = NP.A_VALUE;
      const B = Math.min(avgMonthlyIncome, NP.INCOME_UPPER);
      const years = enrollmentMonths / 12;

      if (years < NP.MIN_PENSION_YEARS) return 0;

      // 소득대체율 적용 (연도별 변동이나 간단화)
      const rate = NP.REPLACEMENT_RATE_2025;

      // 기본연금액 산식: rate × (A + B) × (1 + 0.05 × (n - 20)) / 12
      // 20년 기준, 초과분에 5%씩 추가
      let factor;
      if (years <= 20) {
        factor = years / 20;
      } else {
        factor = 1 + 0.05 * (years - 20);
      }

      const basicPension = rate * (A + B) * factor;
      return Math.round(basicPension);
    },

    /**
     * 조기수령 감액 적용
     * @param {number} basicPension - 기본 연금액
     * @param {number} earlyYears - 조기수령 연수 (1~5)
     * @returns {number} 감액된 연금액
     */
    calcEarlyPension(basicPension, earlyYears) {
      const NP = CONSTANTS.NATIONAL_PENSION;
      const reduction = Math.min(earlyYears, NP.EARLY_MAX_YEARS) * NP.EARLY_REDUCTION_YEARLY;
      return Math.round(basicPension * (1 - reduction));
    },

    /**
     * 연기수령 증액 적용
     * @param {number} basicPension - 기본 연금액
     * @param {number} deferYears - 연기 연수 (1~5)
     * @returns {number} 증액된 연금액
     */
    calcDeferredPension(basicPension, deferYears) {
      const NP = CONSTANTS.NATIONAL_PENSION;
      const increase = Math.min(deferYears, NP.DEFER_MAX_YEARS) * NP.DEFER_INCREASE_YEARLY;
      return Math.round(basicPension * (1 + increase));
    },

    /**
     * 3가지 시나리오(조기/정상/연기) 누적 수령액 비교
     * @param {number} basicPension - 기본 연금액
     * @param {number} startAge - 정상 수령 개시 연령
     * @param {number} earlyYears - 조기수령 연수
     * @param {number} deferYears - 연기수령 연수
     * @param {number} endAge - 시뮬레이션 종료 나이
     * @returns {Object} 연령별 누적 수령액 배열
     */
    compareScenarios(basicPension, startAge, earlyYears, deferYears, endAge = 90) {
      const earlyPension = this.calcEarlyPension(basicPension, earlyYears);
      const deferredPension = this.calcDeferredPension(basicPension, deferYears);

      const earlyStart = startAge - earlyYears;
      const deferStart = startAge + deferYears;

      const result = { ages: [], early: [], normal: [], deferred: [] };
      let cumEarly = 0, cumNormal = 0, cumDeferred = 0;

      for (let age = earlyStart; age <= endAge; age++) {
        result.ages.push(age);

        if (age >= earlyStart) cumEarly += earlyPension * 12;
        if (age >= startAge) cumNormal += basicPension * 12;
        if (age >= deferStart) cumDeferred += deferredPension * 12;

        result.early.push(cumEarly);
        result.normal.push(cumNormal);
        result.deferred.push(cumDeferred);
      }

      return result;
    },

    /**
     * 추납 효과 분석
     * @param {number} currentPension - 현재 예상 연금액
     * @param {number} additionalMonths - 추납할 기간 (개월)
     * @param {number} currentAvgIncome - 현재 평균 기준소득월액
     * @returns {Object} { cost, newPension, increase, breakEvenMonths }
     */
    calcAdditionalPayment(currentPension, additionalMonths, currentAvgIncome) {
      const NP = CONSTANTS.NATIONAL_PENSION;
      const cost = currentAvgIncome * NP.RATE * additionalMonths;
      // 추납으로 인한 가입기간 증가 효과 (근사)
      const increaseRate = additionalMonths / 12 * 0.05;
      const increase = Math.round(currentPension * increaseRate);
      const newPension = currentPension + increase;
      const breakEvenMonths = increase > 0 ? Math.ceil(cost / increase) : Infinity;

      return { cost, newPension, increase, breakEvenMonths };
    },
  },

  // ============================================
  // 퇴직연금 계산
  // ============================================
  retirementPension: {
    /**
     * DB형 퇴직금 계산
     * @param {number} avgSalary3m - 최근 3개월 평균임금
     * @param {number} serviceYears - 근속연수
     * @returns {number} 예상 퇴직금
     */
    calcDB(avgSalary3m, serviceYears) {
      return Math.round(avgSalary3m * serviceYears);
    },

    /**
     * DC형 퇴직금 예상 (적립금 + 운용수익)
     * @param {number} annualContribution - 연간 부담금 (연봉의 1/12 × 12)
     * @param {number} serviceYears - 근속연수
     * @param {number} returnRate - 연간 운용수익률
     * @returns {number} 예상 적립금
     */
    calcDC(annualContribution, serviceYears, returnRate = 0.03) {
      let total = 0;
      for (let i = 0; i < serviceYears; i++) {
        total = (total + annualContribution) * (1 + returnRate);
      }
      return Math.round(total);
    },

    /**
     * IRP 세액공제 효과 계산
     * @param {number} pensionSaving - 연금저축 납입액
     * @param {number} irpAmount - IRP 납입액
     * @param {number} totalSalary - 총급여
     * @returns {Object} { creditAmount, effectiveRate }
     */
    calcIRPTaxCredit(pensionSaving, irpAmount, totalSalary) {
      const RP = CONSTANTS.RETIREMENT_PENSION;

      // 연금저축 한도 적용
      const effectivePensionSaving = Math.min(pensionSaving, RP.PENSION_SAVING_LIMIT);
      // 합산 한도 적용
      const totalDeductible = Math.min(effectivePensionSaving + irpAmount, RP.IRP_TAX_CREDIT_LIMIT);

      // 세액공제율 결정
      const rate = totalSalary <= RP.SALARY_THRESHOLD
        ? RP.TAX_CREDIT_RATE_UNDER_5500
        : RP.TAX_CREDIT_RATE_OVER_5500;

      const creditAmount = Math.round(totalDeductible * rate);
      const effectiveRate = totalDeductible > 0 ? creditAmount / totalDeductible : 0;

      return { creditAmount, effectiveRate, totalDeductible, rate };
    },

    /**
     * 퇴직소득세 계산 (연분연승법)
     * @param {number} retirementIncome - 퇴직금 (세전)
     * @param {number} serviceYears - 근속연수
     * @returns {Object} 단계별 계산 과정 및 세액
     */
    calcRetirementIncomeTax(retirementIncome, serviceYears) {
      const RP = CONSTANTS.RETIREMENT_PENSION;

      // 1단계: 근속연수 공제
      let serviceDeduction;
      if (serviceYears <= 5) {
        serviceDeduction = 1000000 * serviceYears;
      } else if (serviceYears <= 10) {
        serviceDeduction = 5000000 + 2000000 * (serviceYears - 5);
      } else if (serviceYears <= 20) {
        serviceDeduction = 15000000 + 2500000 * (serviceYears - 10);
      } else {
        serviceDeduction = 40000000 + 3000000 * (serviceYears - 20);
      }

      // 2단계: 환산급여
      const taxBase1 = Math.max(retirementIncome - serviceDeduction, 0);
      const convertedIncome = Math.round(taxBase1 * 12 / serviceYears);

      // 3단계: 환산급여 공제
      let convertedDeduction = 0;
      const brackets = RP.CONVERTED_INCOME_DEDUCTION;
      for (let i = 0; i < brackets.length; i++) {
        if (convertedIncome <= brackets[i].limit) {
          if (i === 0) {
            convertedDeduction = convertedIncome * brackets[i].rate;
          } else {
            convertedDeduction = brackets[i].base +
              (convertedIncome - (i > 0 ? brackets[i - 1].limit : 0)) * brackets[i].rate;
          }
          break;
        }
      }

      // 4단계: 과세표준 (환산급여 - 환산급여공제)
      const taxableConverted = Math.max(convertedIncome - convertedDeduction, 0);

      // 5단계: 세율 적용 (종합소득세율)
      const taxBrackets = CONSTANTS.TAX.INCOME_TAX_BRACKETS;
      let convertedTax = 0;
      for (const bracket of taxBrackets) {
        if (taxableConverted <= bracket.limit) {
          convertedTax = taxableConverted * bracket.rate - bracket.deduction;
          break;
        }
      }

      // 6단계: 산출세액 = 환산산출세액 × 근속연수 / 12
      const finalTax = Math.max(Math.round(convertedTax * serviceYears / 12), 0);
      const localTax = Math.round(finalTax * CONSTANTS.TAX.LOCAL_TAX_RATE);

      return {
        retirementIncome,
        serviceYears,
        serviceDeduction,
        taxBase1,
        convertedIncome,
        convertedDeduction,
        taxableConverted,
        convertedTax: Math.max(Math.round(convertedTax), 0),
        incomeTax: finalTax,
        localTax,
        totalTax: finalTax + localTax,
        effectiveRate: retirementIncome > 0 ? (finalTax + localTax) / retirementIncome : 0,
      };
    },

    /**
     * 일시금 vs 연금 수령 비교
     * @param {number} retirementIncome - 퇴직금
     * @param {number} serviceYears - 근속연수
     * @param {number} pensionYears - 연금 수령 기간 (년)
     * @param {number} returnRate - IRP 운용수익률
     * @param {number} startAge - 수령 시작 나이
     * @returns {Object} 비교 결과
     */
    compareLumpSumVsPension(retirementIncome, serviceYears, pensionYears = 10, returnRate = 0.03, startAge = 55) {
      // 일시금 세금
      const lumpSumTax = this.calcRetirementIncomeTax(retirementIncome, serviceYears);

      // 연금 수령 시 세금 (퇴직소득세의 60~70% 수준)
      const pensionTaxRate = startAge < 70
        ? CONSTANTS.RETIREMENT_PENSION.PENSION_TAX_UNDER_70
        : startAge < 80
          ? CONSTANTS.RETIREMENT_PENSION.PENSION_TAX_70_79
          : CONSTANTS.RETIREMENT_PENSION.PENSION_TAX_80_OVER;

      // IRP 이전 후 연금수령 시 운용수익 반영
      let irpBalance = retirementIncome;
      const monthlyPension = [];
      let totalPensionTax = 0;
      let totalPensionReceived = 0;

      const monthlyReturn = returnRate / 12;
      const totalMonths = pensionYears * 12;

      // 매월 균등 수령 (PMT 방식)
      const monthlyAmount = irpBalance * monthlyReturn * Math.pow(1 + monthlyReturn, totalMonths) /
        (Math.pow(1 + monthlyReturn, totalMonths) - 1);

      for (let m = 0; m < totalMonths; m++) {
        irpBalance = irpBalance * (1 + monthlyReturn) - monthlyAmount;
        const tax = monthlyAmount * pensionTaxRate;
        totalPensionTax += tax;
        totalPensionReceived += (monthlyAmount - tax);
        monthlyPension.push(Math.round(monthlyAmount - tax));
      }

      const lumpSumNet = retirementIncome - lumpSumTax.totalTax;

      return {
        lumpSum: {
          gross: retirementIncome,
          tax: lumpSumTax.totalTax,
          net: lumpSumNet,
          effectiveRate: lumpSumTax.effectiveRate,
        },
        pension: {
          monthlyGross: Math.round(monthlyAmount),
          monthlyNet: Math.round(monthlyAmount * (1 - pensionTaxRate)),
          totalReceived: Math.round(totalPensionReceived),
          totalTax: Math.round(totalPensionTax),
          pensionYears,
        },
        taxSaving: Math.round(lumpSumTax.totalTax - totalPensionTax),
      };
    },
  },

  // ============================================
  // 세금 계산
  // ============================================
  tax: {
    /**
     * 종합소득세 계산
     * @param {number} taxableIncome - 과세표준
     * @returns {Object} { tax, rate, deduction, effectiveRate }
     */
    calcIncomeTax(taxableIncome) {
      const brackets = CONSTANTS.TAX.INCOME_TAX_BRACKETS;
      let tax = 0;
      let appliedRate = 0;
      let appliedDeduction = 0;

      for (const bracket of brackets) {
        if (taxableIncome <= bracket.limit) {
          tax = taxableIncome * bracket.rate - bracket.deduction;
          appliedRate = bracket.rate;
          appliedDeduction = bracket.deduction;
          break;
        }
      }

      tax = Math.max(Math.round(tax), 0);
      const localTax = Math.round(tax * CONSTANTS.TAX.LOCAL_TAX_RATE);

      return {
        incomeTax: tax,
        localTax,
        totalTax: tax + localTax,
        appliedRate,
        appliedDeduction,
        effectiveRate: taxableIncome > 0 ? (tax + localTax) / taxableIncome : 0,
      };
    },

    /**
     * 연금소득공제 계산
     * @param {number} pensionIncome - 총 연금소득
     * @returns {number} 공제액
     */
    calcPensionDeduction(pensionIncome) {
      const brackets = CONSTANTS.TAX.PENSION_INCOME_DEDUCTION;
      let deduction = 0;

      for (let i = 0; i < brackets.length; i++) {
        if (pensionIncome <= brackets[i].limit) {
          if (i === 0) {
            deduction = pensionIncome * brackets[i].rate;
          } else {
            deduction = brackets[i].base +
              (pensionIncome - (i > 0 ? brackets[i - 1].limit : 0)) * brackets[i].rate;
          }
          break;
        }
      }

      return Math.min(Math.round(deduction), CONSTANTS.TAX.PENSION_DEDUCTION_MAX);
    },

    /**
     * 사적연금 분리과세 vs 종합과세 비교
     * @param {number} privatePension - 사적연금 연간 수령액
     * @param {number} otherIncome - 기타 종합소득
     * @param {number} age - 수령자 나이
     * @returns {Object} 분리과세/종합과세 비교 결과
     */
    comparePrivatePensionTax(privatePension, otherIncome, age) {
      const TAX = CONSTANTS.TAX;

      // 분리과세 세율 결정 (나이별)
      let separateRate;
      if (age < 70) separateRate = 0.055;
      else if (age < 80) separateRate = 0.044;
      else separateRate = 0.033;

      // 1,500만원 초과 시 15% 분리과세 vs 종합과세 선택
      let separateTax;
      if (privatePension <= TAX.PRIVATE_PENSION_SEPARATE_LIMIT) {
        separateTax = Math.round(privatePension * separateRate);
      } else {
        // 1,500만원 초과: 전액 15% 분리과세 가능
        separateTax = Math.round(privatePension * 0.15);
      }

      // 종합과세: 기타소득과 합산
      const totalIncome = privatePension + otherIncome;
      const pensionDeduction = this.calcPensionDeduction(privatePension);
      const taxableIncome = Math.max(totalIncome - pensionDeduction - CONSTANTS.TAX.BASIC_DEDUCTION, 0);
      const compTax = this.calcIncomeTax(taxableIncome);

      // 기타소득만 있을 때의 세금
      const otherOnlyTaxable = Math.max(otherIncome - CONSTANTS.TAX.BASIC_DEDUCTION, 0);
      const otherOnlyTax = this.calcIncomeTax(otherOnlyTaxable);

      // 연금 추가로 인한 세금 증가분 = 전체 세금 - 기타소득만의 세금
      const additionalTax = compTax.totalTax - otherOnlyTax.totalTax;

      return {
        separate: {
          tax: separateTax,
          localTax: Math.round(separateTax * 0.1),
          totalTax: separateTax + Math.round(separateTax * 0.1),
          rate: privatePension <= TAX.PRIVATE_PENSION_SEPARATE_LIMIT ? separateRate : 0.15,
        },
        comprehensive: {
          totalIncome,
          pensionDeduction,
          taxableIncome,
          tax: compTax.totalTax,
          additionalTax,
          effectiveRate: privatePension > 0 ? additionalTax / privatePension : 0,
        },
        recommended: separateTax + Math.round(separateTax * 0.1) <= additionalTax ? '분리과세' : '종합과세',
        saving: Math.abs((separateTax + Math.round(separateTax * 0.1)) - additionalTax),
      };
    },
  },

  // ============================================
  // 건강보험료 계산
  // ============================================
  healthInsurance: {
    /**
     * 지역가입자 건강보험료 계산 (간소화 버전)
     * @param {number} annualIncome - 연간 소득 (이자+배당+사업+근로+연금+기타)
     * @param {number} propertyValue - 재산과표 (만원)
     * @param {number} carValue - 자동차 가액 (만원)
     * @param {number} carCC - 자동차 배기량 (cc)
     * @returns {Object} { monthlyPremium, longTermCare, total, breakdown }
     */
    calcRegionalPremium(annualIncome, propertyValue = 0, carValue = 0, carCC = 0) {
      const HI = CONSTANTS.HEALTH_INSURANCE;

      // 1. 소득 부분 보험료 (연소득 기준)
      const monthlyIncome = annualIncome / 12;
      const incomePremium = Math.round(monthlyIncome * HI.RATE);

      // 2. 재산 부분 보험료 (간소화)
      let propertyScore = 0;
      const propertyExcess = Math.max(propertyValue - 4500, 0); // 기본공제 4,500만원
      if (propertyExcess > 0) {
        // 간소화: 초과분에 대해 등급별 점수
        const brackets = HI.REGIONAL.PROPERTY_SCORE.BRACKETS;
        for (let i = 1; i < brackets.length; i++) {
          const prevLimit = brackets[i - 1].limit;
          const currLimit = brackets[i].limit;
          if (propertyValue <= currLimit) {
            propertyScore = Math.round(propertyExcess / 100) * brackets[i].perUnit;
            break;
          }
        }
      }
      const propertyPremium = Math.round(propertyScore * HI.REGIONAL.PROPERTY_SCORE.POINT_VALUE);

      // 3. 자동차 부분 (4천만원 미만/1600cc 미만 면제)
      let carPremium = 0;
      if (carValue >= 4000 && carCC >= 1600) {
        let carScore = carCC >= 3000 ? HI.REGIONAL.CAR_SCORE.OVER_3000 : HI.REGIONAL.CAR_SCORE.OVER_1600_UNDER_3000;
        carPremium = Math.round(carScore * HI.REGIONAL.PROPERTY_SCORE.POINT_VALUE);
      }

      // 월 건강보험료 합계
      const monthlyPremium = incomePremium + propertyPremium + carPremium;

      // 장기요양보험료
      const longTermCare = Math.round(monthlyPremium * HI.LONG_TERM_CARE_RATE);

      return {
        monthlyPremium,
        longTermCare,
        total: monthlyPremium + longTermCare,
        breakdown: {
          income: incomePremium,
          property: propertyPremium,
          car: carPremium,
        },
      };
    },

    /**
     * 피부양자 자격 판정
     * @param {number} annualIncome - 연간 소득
     * @param {number} propertyTaxBase - 재산세 과표
     * @returns {Object} { qualified, reasons }
     */
    checkDependentStatus(annualIncome, propertyTaxBase) {
      const DEP = CONSTANTS.HEALTH_INSURANCE.DEPENDENT;
      const reasons = [];
      let qualified = true;

      // 소득 요건
      if (propertyTaxBase > DEP.PROPERTY_HIGH) {
        // 재산 9억 초과: 소득 1,000만원 이하
        if (annualIncome > DEP.INCOME_LIMIT_HIGH_PROPERTY) {
          qualified = false;
          reasons.push(`재산 9억 초과 시 소득 ${APP.format.manwon(DEP.INCOME_LIMIT_HIGH_PROPERTY)} 이하여야 합니다 (현재: ${APP.format.manwon(annualIncome)})`);
        }
      } else {
        if (annualIncome > DEP.INCOME_LIMIT) {
          qualified = false;
          reasons.push(`소득이 ${APP.format.manwon(DEP.INCOME_LIMIT)} 이하여야 합니다 (현재: ${APP.format.manwon(annualIncome)})`);
        }
      }

      // 재산 요건
      if (propertyTaxBase > DEP.PROPERTY_TAX_LIMIT) {
        qualified = false;
        reasons.push(`재산세 과표가 ${APP.format.manwon(DEP.PROPERTY_TAX_LIMIT)} 이하여야 합니다 (현재: ${APP.format.manwon(propertyTaxBase)})`);
      }

      if (qualified) {
        reasons.push('피부양자 자격 요건을 충족합니다.');
      }

      return { qualified, reasons };
    },

    /**
     * 임의계속가입 vs 지역가입자 비교
     * @param {number} lastSalary - 퇴직 전 월급여
     * @param {number} annualIncome - 퇴직 후 연간 소득
     * @param {number} propertyValue - 재산과표 (만원)
     * @returns {Object} 비교 결과
     */
    compareVoluntaryVsRegional(lastSalary, annualIncome, propertyValue) {
      const HI = CONSTANTS.HEALTH_INSURANCE;

      // 임의계속: 퇴직 전 보험료 유지 (직장가입자 본인부담분)
      const voluntaryPremium = Math.round(lastSalary * HI.HALF_RATE);
      const voluntaryLTC = Math.round(voluntaryPremium * HI.LONG_TERM_CARE_RATE);

      // 지역가입자
      const regional = this.calcRegionalPremium(annualIncome, propertyValue);

      return {
        voluntary: {
          premium: voluntaryPremium,
          longTermCare: voluntaryLTC,
          total: voluntaryPremium + voluntaryLTC,
          maxYears: HI.VOLUNTARY_EXTENSION.MAX_YEARS,
        },
        regional: {
          premium: regional.monthlyPremium,
          longTermCare: regional.longTermCare,
          total: regional.total,
        },
        monthlySaving: (voluntaryPremium + voluntaryLTC) - regional.total,
        recommended: (voluntaryPremium + voluntaryLTC) < regional.total ? '임의계속가입' : '지역가입자 전환',
      };
    },
  },

  // ============================================
  // 노후자금 계산
  // ============================================
  retirementFund: {
    /**
     * 노후 필요자금 계산
     * @param {number} monthlyExpense - 월 필요 생활비
     * @param {number} retireAge - 은퇴 나이
     * @param {number} endAge - 기대수명
     * @param {number} inflationRate - 물가상승률
     * @param {number} returnRate - 투자수익률
     * @returns {Object} 필요 자금 정보
     */
    calcRequiredFund(monthlyExpense, retireAge, endAge, inflationRate, returnRate) {
      const years = endAge - retireAge;
      const realReturn = (1 + returnRate) / (1 + inflationRate) - 1;

      let totalNeeded = 0;
      const yearlyData = [];

      for (let y = 0; y < years; y++) {
        const adjustedExpense = monthlyExpense * 12 * Math.pow(1 + inflationRate, y);
        totalNeeded += adjustedExpense / Math.pow(1 + returnRate, y);
        yearlyData.push({
          age: retireAge + y,
          annualExpense: Math.round(adjustedExpense),
          cumulative: Math.round(totalNeeded),
        });
      }

      // 현재가치 기준 필요자금
      const presentValue = Math.round(totalNeeded);

      // 명목가치 기준 총 필요자금
      let nominalTotal = 0;
      for (let y = 0; y < years; y++) {
        nominalTotal += monthlyExpense * 12 * Math.pow(1 + inflationRate, y);
      }

      return {
        presentValue,
        nominalTotal: Math.round(nominalTotal),
        years,
        monthlyExpense,
        yearlyData,
      };
    },

    /**
     * 보유자산 기반 월 사용가능 생활비 역산
     * @param {number} totalAssets - 보유 자산
     * @param {number} monthlyPension - 월 연금 수령액
     * @param {number} retireAge - 은퇴 나이
     * @param {number} endAge - 기대수명
     * @param {number} returnRate - 투자수익률
     * @param {number} inflationRate - 물가상승률
     * @returns {Object} 월 생활비, 자산 소진 추이
     */
    calcAvailableMonthly(totalAssets, monthlyPension, retireAge, endAge, returnRate, inflationRate) {
      const years = endAge - retireAge;
      const months = years * 12;
      const monthlyReturn = returnRate / 12;
      const monthlyInflation = inflationRate / 12;

      // PMT 방식으로 자산에서 매월 인출 가능 금액 계산 (실질수익률 기준)
      const realMonthlyReturn = (1 + monthlyReturn) / (1 + monthlyInflation) - 1;

      let monthlyFromAssets;
      if (realMonthlyReturn === 0) {
        monthlyFromAssets = totalAssets / months;
      } else {
        monthlyFromAssets = totalAssets * realMonthlyReturn /
          (1 - Math.pow(1 + realMonthlyReturn, -months));
      }

      const totalMonthly = Math.round(monthlyFromAssets + monthlyPension);

      // 자산 소진 추이 시뮬레이션
      let balance = totalAssets;
      const assetTimeline = [];

      for (let y = 0; y < years; y++) {
        const annualWithdrawal = monthlyFromAssets * 12 * Math.pow(1 + inflationRate, y);
        balance = balance * (1 + returnRate) - annualWithdrawal;
        assetTimeline.push({
          age: retireAge + y,
          balance: Math.max(Math.round(balance), 0),
        });
      }

      return {
        monthlyFromAssets: Math.round(monthlyFromAssets),
        monthlyPension,
        totalMonthly,
        assetTimeline,
      };
    },

    /**
     * 자산 인출 전략 시뮬레이션 (정액/정률/버킷)
     * @param {number} totalAssets - 보유 자산
     * @param {number} annualWithdrawal - 연간 인출 금액 (정액 기준)
     * @param {number} withdrawalRate - 인출률 (정률 기준, 예: 0.04)
     * @param {number} returnRate - 투자수익률
     * @param {number} inflationRate - 물가상승률
     * @param {number} years - 시뮬레이션 기간
     * @returns {Object} 전략별 자산 추이
     */
    simulateWithdrawal(totalAssets, annualWithdrawal, withdrawalRate, returnRate, inflationRate, years = 30) {
      const results = {
        fixed: [],    // 정액 인출 (물가조정)
        rate: [],     // 정률 인출
        bucket: [],   // 버킷 전략
      };

      // 정액 인출 (매년 물가상승률만큼 인출액 증가)
      let fixedBalance = totalAssets;
      for (let y = 0; y < years; y++) {
        const withdrawal = annualWithdrawal * Math.pow(1 + inflationRate, y);
        fixedBalance = Math.max(fixedBalance * (1 + returnRate) - withdrawal, 0);
        results.fixed.push(Math.round(fixedBalance));
      }

      // 정률 인출 (자산의 일정 비율)
      let rateBalance = totalAssets;
      for (let y = 0; y < years; y++) {
        const withdrawal = rateBalance * withdrawalRate;
        rateBalance = Math.max((rateBalance - withdrawal) * (1 + returnRate), 0);
        results.rate.push(Math.round(rateBalance));
      }

      // 버킷 전략 (3개 버킷: 단기/중기/장기)
      let bucket1 = totalAssets * 0.2;  // 2년치 (안전자산)
      let bucket2 = totalAssets * 0.3;  // 5년치 (채권)
      let bucket3 = totalAssets * 0.5;  // 장기 (주식)
      const bucket1Return = 0.02;
      const bucket2Return = 0.04;
      const bucket3Return = returnRate + 0.02;

      for (let y = 0; y < years; y++) {
        const withdrawal = annualWithdrawal * Math.pow(1 + inflationRate, y);
        bucket1 -= withdrawal;

        // 버킷1 부족하면 버킷2에서 보충
        if (bucket1 < 0) {
          bucket2 += bucket1;
          bucket1 = 0;
        }
        if (bucket2 < 0) {
          bucket3 += bucket2;
          bucket2 = 0;
        }

        bucket1 *= (1 + bucket1Return);
        bucket2 *= (1 + bucket2Return);
        bucket3 *= (1 + bucket3Return);

        // 매 5년마다 리밸런싱
        if (y > 0 && y % 5 === 0) {
          const total = bucket1 + bucket2 + bucket3;
          bucket1 = total * 0.2;
          bucket2 = total * 0.3;
          bucket3 = total * 0.5;
        }

        results.bucket.push(Math.round(Math.max(bucket1 + bucket2 + bucket3, 0)));
      }

      return results;
    },
  },
};

if (typeof window !== 'undefined') {
  window.CalcEngine = CalcEngine;
}
